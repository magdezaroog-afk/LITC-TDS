-- =========================================================================
-- SYSTEM SECURITY: LITC-TS (v43.0)
-- COMPONENT: Secured Stored Procedures & Transaction Guard
-- TARGET PLATFORM: Microsoft SQL Server
-- AUTHOR: Senior Database Security Engineer
-- DESIGN PRINCIPLE: Transaction Safety, Strict Cascading Rules (ACID Compliant)
-- =========================================================================

USE LITC_TS_v43;
GO

-- =========================================================================
-- تنظيف الإجراءات القديمة لمنع التعارض أثناء التحديث (Drop Existing Procedures)
-- =========================================================================

IF OBJECT_ID('dbo.sp_CreateTicket', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_CreateTicket;
    PRINT 'INFO: Dropped existing procedure [dbo.sp_CreateTicket].';
END
GO

IF OBJECT_ID('dbo.sp_TransferTicket', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_TransferTicket;
    PRINT 'INFO: Dropped existing procedure [dbo.sp_TransferTicket].';
END
GO

IF OBJECT_ID('dbo.sp_CloseParentTicket', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.sp_CloseParentTicket;
    PRINT 'INFO: Dropped existing procedure [dbo.sp_CloseParentTicket].';
END
GO

-- =========================================================================
-- 1. إجراء إنشاء التذكرة (dbo.sp_CreateTicket)
-- =========================================================================
CREATE PROCEDURE dbo.sp_CreateTicket
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @CreatorID NVARCHAR(150),
    @CurrentDepartment NVARCHAR(100),
    @Building NVARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- تعريف معرف فرعي للتذكرة
    DECLARE @NewTicketID UNIQUEIDENTIFIER = NEWID();

    -- إدخال التذكرة الجديدة مع تعيين الحالة الافتراضية 'new'
    INSERT INTO dbo.Tickets (
        TicketID,
        Title,
        Description,
        Status,
        CreatorID,
        CurrentDepartment,
        Building,
        RecordVersion,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @NewTicketID,
        @Title,
        @Description,
        N'new', -- الحالة الافتراضية عند الإنشاء
        @CreatorID,
        @CurrentDepartment,
        @Building,
        1,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

    -- إرجاع التذكرة المنشأة حديثاً للتأكد والمزامنة
    SELECT 
        TicketID,
        Title,
        Description,
        Status,
        CreatorID,
        CurrentDepartment,
        Building,
        RecordVersion,
        CreatedAt,
        UpdatedAt
    FROM dbo.Tickets
    WHERE TicketID = @NewTicketID;
END;
GO
PRINT 'SUCCESS: Stored Procedure [dbo.sp_CreateTicket] created.';
GO

-- =========================================================================
-- 2. إجراء تحويل التذكرة وتدوين الأثر (dbo.sp_TransferTicket)
-- =========================================================================
CREATE PROCEDURE dbo.sp_TransferTicket
    @TicketID UNIQUEIDENTIFIER,
    @TargetDepartment NVARCHAR(100),
    @User NVARCHAR(150),
    @TransferReason NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    -- التحقق من وجود التذكرة أولاً
    IF NOT EXISTS (SELECT 1 FROM dbo.Tickets WHERE TicketID = @TicketID)
    BEGIN
        RAISERROR('SECURITY_VIOLATION: Specified TicketID does not exist.', 16, 1);
        RETURN;
    END

    -- بدء المعاملة الآمنة (ACID Transaction)
    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @SourceDepartment NVARCHAR(100);

        -- جلب القسم الحالي للتذكرة لتوثيق القسم المصدر في الأرشيف
        SELECT @SourceDepartment = CurrentDepartment 
        FROM dbo.Tickets 
        WHERE TicketID = @TicketID;

        -- أ. تحديث التذكرة: تغيير القسم الحالي، الحالة إلى 'transferred' وزيادة رقم الإصدار لمنع تعارض OCC
        UPDATE dbo.Tickets
        SET CurrentDepartment = @TargetDepartment,
            Status = N'transferred',
            RecordVersion = RecordVersion + 1,
            UpdatedAt = SYSUTCDATETIME()
        WHERE TicketID = @TicketID;

        -- ب. تدوين الأثر التاريخي للتحويل في جدول المراجعة والحوكمة
        INSERT INTO dbo.WorkflowAuditLogs (
            LogID,
            TicketID,
            SourceDepartment,
            TargetDepartment,
            [User],
            Timestamp,
            TransferReason
        )
        VALUES (
            NEWID(),
            @TicketID,
            @SourceDepartment,
            @TargetDepartment,
            @User,
            SYSUTCDATETIME(),
            @TransferReason
        );

        -- إتمام حفظ التعديلات بنجاح
        COMMIT TRANSACTION;
        PRINT 'SUCCESS: Ticket transferred and audit log recorded.';
    END TRY
    BEGIN CATCH
        -- التراجع عن كافة التغييرات في حال حدوث أي فشل جزئي
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        -- إلقاء تفاصيل الخطأ للجهة المستدعية
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO
PRINT 'SUCCESS: Stored Procedure [dbo.sp_TransferTicket] created.';
GO

-- =========================================================================
-- 3. إجراء إغلاق التذكرة بقفل التبعية التراكمي (dbo.sp_CloseParentTicket)
-- =========================================================================
CREATE PROCEDURE dbo.sp_CloseParentTicket
    @TicketID UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- التحقق من وجود التذكرة أولاً
    IF NOT EXISTS (SELECT 1 FROM dbo.Tickets WHERE TicketID = @TicketID)
    BEGIN
        RAISERROR('SECURITY_VIOLATION: Specified TicketID does not exist.', 16, 1);
        RETURN;
    END

    -- بدء المعاملة الآمنة لحماية حوكمة دورة الحياة (ACID Transaction)
    BEGIN TRANSACTION;

    BEGIN TRY
        -- أ. فحص جدول التذاكر الفرعية: البحث عن أي تذكرة فرعية تابعة للتذكرة الحالية وتكون حالتها نشطة (ليست مغلقة أو محلولة)
        IF EXISTS (
            SELECT 1 
            FROM dbo.ChildTickets 
            WHERE ParentTicketID = @TicketID 
              AND Status NOT IN (N'closed', N'resolved')
        )
        BEGIN
            -- التراجع فوراً وإلقاء استثناء لمنع الخرق الهيكلي للمشروع
            ROLLBACK TRANSACTION;
            RAISERROR('WORKFLOW_VIOLATION: Cannot close parent ticket with active child tickets.', 16, 1);
            RETURN;
        END

        -- ب. في حال كانت كل التذاكر الفرعية مغلقة أو لا توجد أي تذاكر فرعية: يتم تحديث حالة التذكرة الرئيسية إلى 'closed' وزيادة الإصدار
        UPDATE dbo.Tickets
        SET Status = N'closed',
            RecordVersion = RecordVersion + 1,
            UpdatedAt = SYSUTCDATETIME()
        WHERE TicketID = @TicketID;

        -- ج. إتمام المعاملة بنجاح
        COMMIT TRANSACTION;
        PRINT 'SUCCESS: Parent ticket status successfully updated to [closed].';
    END TRY
    BEGIN CATCH
        -- التراجع عن المعاملة إذا لم يتم التراجع عنها مسبقاً
        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        -- إلقاء تفاصيل الخطأ للجهة المستدعية
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrState INT = ERROR_STATE();
        
        RAISERROR(@ErrMsg, @ErrSeverity, @ErrState);
    END CATCH
END;
GO
PRINT 'SUCCESS: Stored Procedure [dbo.sp_CloseParentTicket] created.';
GO
