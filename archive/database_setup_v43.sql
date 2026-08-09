-- =========================================================================
-- SYSTEM ARCHITECTURE: LITC-TS (v43.0)
-- COMPONENT: Sovereign Operations Database Creation Script
-- TARGET PLATFORM: Microsoft SQL Server
-- AUTHOR: Senior Database Architect
-- DESIGN PRINCIPLE: Zero-Error, Strict Integrity Constraints
-- =========================================================================

-- 1. تهيئة وقفل إنشاء قاعدة البيانات لمنع التداخل والتعارض
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'LITC_TS_v43')
BEGIN
    CREATE DATABASE LITC_TS_v43;
    PRINT 'SUCCESS: Database [LITC_TS_v43] created successfully.';
END
ELSE
BEGIN
    PRINT 'INFO: Database [LITC_TS_v43] already exists.';
END
GO

USE LITC_TS_v43;
GO

-- 2. إعداد عزل المعاملات (Snapshot Isolation) لضمان التزامن المتوازي الأمثل ومنع الـ Deadlocks
ALTER DATABASE LITC_TS_v43 SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

-- =========================================================================
-- تنظيف الجداول القديمة لتسهيل إعادة البناء (Drop Existing Tables in Reverse Dependency Order)
-- =========================================================================

IF OBJECT_ID('dbo.WorkflowAuditLogs', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.WorkflowAuditLogs;
    PRINT 'INFO: Dropped existing table [WorkflowAuditLogs].';
END

IF OBJECT_ID('dbo.GovernanceAuditLogs', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.GovernanceAuditLogs;
    PRINT 'INFO: Dropped existing table [GovernanceAuditLogs].';
END

IF OBJECT_ID('dbo.ChildTickets', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.ChildTickets;
    PRINT 'INFO: Dropped existing table [ChildTickets].';
END

IF OBJECT_ID('dbo.Tickets', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.Tickets;
    PRINT 'INFO: Dropped existing table [Tickets].';
END
GO

-- =========================================================================
-- المستوى 0: جدول التذاكر الرئيسية (Tickets Table)
-- =========================================================================
CREATE TABLE dbo.Tickets (
    TicketID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CreatorID NVARCHAR(150) NOT NULL,
    CurrentDepartment NVARCHAR(100) NOT NULL,
    Building NVARCHAR(150) NOT NULL,
    RecordVersion INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    -- القيود البنيوية الصارمة (Strict Constraints)
    CONSTRAINT PK_Tickets PRIMARY KEY CLUSTERED (TicketID),
    
    -- قيد التحقق لمنع إدخال حالات غير معروفة (new, in-progress, transferred, resolved, closed)
    CONSTRAINT CK_Tickets_Status CHECK (
        Status IN ('new', 'in-progress', 'transferred', 'resolved', 'closed')
    ),

    -- منع تسجيل إصدارات سالبة للحفاظ على سلامة Loop Guard و Concurrency Control
    CONSTRAINT CK_Tickets_RecordVersion CHECK (RecordVersion >= 1)
);
PRINT 'SUCCESS: Table [Tickets] created with primary keys and constraints.';
GO

-- =========================================================================
-- المستوى 1: جدول التذاكر الفرعية/الإضافية (ChildTickets Table)
-- =========================================================================
CREATE TABLE dbo.ChildTickets (
    ChildTicketID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ParentTicketID UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    CreatorID NVARCHAR(150) NOT NULL,
    CurrentDepartment NVARCHAR(100) NOT NULL,
    Building NVARCHAR(150) NOT NULL,
    RecordVersion INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    -- القيود البنيوية الصارمة (Strict Constraints)
    CONSTRAINT PK_ChildTickets PRIMARY KEY CLUSTERED (ChildTicketID),

    -- قيد الربط الأجنبي الصارم (Foreign Key Constraint) مع تفعيل الحذف المتعاقب لإلغاء التذاكر الفرعية عند حذف الرئيسية
    CONSTRAINT FK_ChildTickets_Tickets FOREIGN KEY (ParentTicketID) 
        REFERENCES dbo.Tickets (TicketID) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION,

    -- قيد التحقق لمنع إدخال حالات تذاكر غير معتمدة
    CONSTRAINT CK_ChildTickets_Status CHECK (
        Status IN ('new', 'in-progress', 'transferred', 'resolved', 'closed')
    ),

    -- قيد التحقق لإصدار التذكرة لمنع التعديلات التزامنية المتعارضة
    CONSTRAINT CK_ChildTickets_RecordVersion CHECK (RecordVersion >= 1)
);
PRINT 'SUCCESS: Table [ChildTickets] created with foreign keys and check constraints.';
GO

-- =========================================================================
-- المستوى 2: جدول سجل الأثر والحوكمة (WorkflowAuditLogs Table)
-- =========================================================================
CREATE TABLE dbo.WorkflowAuditLogs (
    LogID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TicketID UNIQUEIDENTIFIER NOT NULL,
    SourceDepartment NVARCHAR(100) NOT NULL,
    TargetDepartment NVARCHAR(100) NOT NULL,
    [User] NVARCHAR(150) NOT NULL, -- استخدام المعقوفتين لتجنب حجز الكلمة المفتاحية في T-SQL
    Timestamp DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    TransferReason NVARCHAR(MAX) NOT NULL,

    -- القيود البنيوية الصارمة (Strict Constraints)
    CONSTRAINT PK_WorkflowAuditLogs PRIMARY KEY CLUSTERED (LogID),

    -- ربط السجل بالتذكرة الرئيسية مع ربط متعاقب لحذف السجلات عند حذف التذكرة
    CONSTRAINT FK_WorkflowAuditLogs_Tickets FOREIGN KEY (TicketID) 
        REFERENCES dbo.Tickets (TicketID) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION
);
PRINT 'SUCCESS: Table [WorkflowAuditLogs] created to track departmental transitions.';
GO

-- =========================================================================
-- جدول سجل حوكمة الأزمات والتجاوزات السيادي (GovernanceAuditLogs Table)
-- =========================================================================
CREATE TABLE dbo.GovernanceAuditLogs (
    LogID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ActionBy NVARCHAR(150) NOT NULL,
    EventType NVARCHAR(100) NOT NULL,
    TimestampMs BIGINT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_GovernanceAuditLogs PRIMARY KEY CLUSTERED (LogID)
);
PRINT 'SUCCESS: Table [GovernanceAuditLogs] created successfully.';
GO

-- =========================================================================
-- المستوى 3: إدارة الصلاحيات والأمان (RolePermissions Table)
-- =========================================================================
IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.RolePermissions;
    PRINT 'INFO: Dropped existing table [RolePermissions].';
END
GO

CREATE TABLE dbo.RolePermissions (
    RoleName NVARCHAR(100) NOT NULL,
    CanTransfer BIT NOT NULL DEFAULT 0,
    CanClose BIT NOT NULL DEFAULT 0,
    
    CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (RoleName)
);
PRINT 'SUCCESS: Table [RolePermissions] created with role identity rules.';
GO

-- حقن البيانات التأسيسية للأدوار التشغيلية
INSERT INTO dbo.RolePermissions (RoleName, CanTransfer, CanClose) VALUES
('Employee', 0, 0),
('Maintenance_Head', 1, 0),
('IT_Admin', 1, 1);
PRINT 'SUCCESS: Default security permissions seeded.';
GO

-- =========================================================================
-- المستوى 4: إعدادات حوكمة الـ SLA والأتمتة (SLAConfigurations Table)
-- =========================================================================
IF OBJECT_ID('dbo.SLAConfigurations', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.SLAConfigurations;
    PRINT 'INFO: Dropped existing table [SLAConfigurations].';
END
GO

CREATE TABLE dbo.SLAConfigurations (
    ServiceType NVARCHAR(100) NOT NULL,
    IsEscalationEnabled BIT NOT NULL DEFAULT 1,
    ThresholdMinutes INT NOT NULL DEFAULT 120,
    EscalationTargetRole NVARCHAR(100) NOT NULL,
    
    CONSTRAINT PK_SLAConfigurations PRIMARY KEY CLUSTERED (ServiceType)
);
PRINT 'SUCCESS: Table [SLAConfigurations] created.';
GO

INSERT INTO dbo.SLAConfigurations (ServiceType, IsEscalationEnabled, ThresholdMinutes, EscalationTargetRole) VALUES
('IT', 1, 120, 'IT_Admin');
PRINT 'SUCCESS: Default SLA configuration seeded.';
GO

-- =========================================================================
-- المستوى 5: إعدادات حوكمة قنوات الإشعارات والتحذيرات اللحظية (NotificationConfigurations Table)
-- =========================================================================
IF OBJECT_ID('dbo.NotificationConfigurations', 'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.NotificationConfigurations;
    PRINT 'INFO: Dropped existing table [NotificationConfigurations].';
END
GO

CREATE TABLE dbo.NotificationConfigurations (
    ServiceType NVARCHAR(100) NOT NULL,
    IsToastEnabled BIT NOT NULL DEFAULT 1,
    IsBellEnabled BIT NOT NULL DEFAULT 1,
    
    CONSTRAINT PK_NotificationConfigurations PRIMARY KEY CLUSTERED (ServiceType)
);
PRINT 'SUCCESS: Table [NotificationConfigurations] created.';
GO

INSERT INTO dbo.NotificationConfigurations (ServiceType, IsToastEnabled, IsBellEnabled) VALUES
('IT', 1, 1),
('Maintenance', 1, 1),
('HR', 1, 1);
PRINT 'SUCCESS: Default Notification configurations seeded.';
GO

-- =========================================================================
-- تحسين الأداء: إنشاء الفهارس غير العنقودية لتسريع الاستعلامات وعمليات الربط (Indexes)
-- =========================================================================

-- فهارس تسريع الربط وجلب التذاكر الفرعية بناء على التذكرة الرئيسية
CREATE NONCLUSTERED INDEX IX_ChildTickets_ParentTicketID 
    ON dbo.ChildTickets (ParentTicketID);

-- فهارس تسريع جلب سجلات الأثر والتتبع لحركات التذاكر
CREATE NONCLUSTERED INDEX IX_WorkflowAuditLogs_TicketID 
    ON dbo.WorkflowAuditLogs (TicketID);

-- فهارس تسريع جلب التذاكر بناء على القسم الحالي لزيادة أداء لوحات التحكم
CREATE NONCLUSTERED INDEX IX_Tickets_CurrentDepartment_Status 
    ON dbo.Tickets (CurrentDepartment, Status);

PRINT 'SUCCESS: Indexes initialized for optimal performance.';
GO
