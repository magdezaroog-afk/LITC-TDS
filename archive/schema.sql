-- =========================================================================
-- SYSTEM DEVELOPMENT: LITC-TS (v43.0)
-- ENVIRONMENT: Production (v43_Production)
-- TARGET DATABASE: Microsoft SQL Server
-- =========================================================================

-- 1. إنشاء قاعدة البيانات وتفعيل خاصية عزل المعاملات (Snapshot Isolation) لمنع الـ Locks
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'v43_Production')
BEGIN
    CREATE DATABASE v43_Production;
END
GO

USE v43_Production;
GO

ALTER DATABASE v43_Production SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
GO

-- =========================================================================
-- المستوى 0: الجداول المستقلة (Level 0 - Base Tables)
-- =========================================================================

CREATE TABLE Location (
    id INT IDENTITY(1,1) PRIMARY KEY,
    building NVARCHAR(255) NOT NULL,
    floor NVARCHAR(100) NULL,
    office NVARCHAR(100) NULL
);

CREATE TABLE CompanyDivision (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE SystemSetting (
    id INT IDENTITY(1,1) PRIMARY KEY,
    settingKey NVARCHAR(150) NOT NULL UNIQUE,
    settingValue NVARCHAR(MAX) NOT NULL,
    description NVARCHAR(1000) NULL,
    updatedAt DATETIME2 NOT NULL
);

CREATE TABLE SystemExtension (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL UNIQUE,
    version NVARCHAR(50) NOT NULL,
    metadataJson NVARCHAR(MAX) NOT NULL,
    uploadedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    checksum NVARCHAR(255) NOT NULL UNIQUE,
    isVerified BIT NOT NULL DEFAULT 0
);

CREATE TABLE UITheme (
    id INT IDENTITY(1,1) PRIMARY KEY,
    themeName NVARCHAR(100) NOT NULL UNIQUE,
    primaryColor NVARCHAR(50) NOT NULL,
    secondaryColor NVARCHAR(50) NOT NULL
);

CREATE TABLE [Action] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    apiEndpoint NVARCHAR(500) NOT NULL
);

CREATE TABLE MaintenanceWindow (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    startTime DATETIME2 NOT NULL,
    endTime DATETIME2 NOT NULL,
    affectedSystem NVARCHAR(255) NULL,
    isActive BIT NOT NULL DEFAULT 1,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Vendor (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL UNIQUE,
    contactEmail NVARCHAR(255) NULL,
    contactPhone NVARCHAR(50) NULL,
    slaAgreement NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PriorityMatrix (
    id INT IDENTITY(1,1) PRIMARY KEY,
    impact NVARCHAR(50) NOT NULL,
    urgency NVARCHAR(50) NOT NULL,
    priority NVARCHAR(50) NOT NULL,
    slaMultiplier FLOAT NOT NULL DEFAULT 1.0,
    CONSTRAINT UQ_PriorityMatrix_Impact_Urgency UNIQUE (impact, urgency)
);

CREATE TABLE Tag (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    colorCode NVARCHAR(20) NULL
);

CREATE TABLE ClosureCode (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(1000) NOT NULL
);

CREATE TABLE TicketState (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    label NVARCHAR(150) NOT NULL
);

CREATE TABLE BusinessHours (
    id INT IDENTITY(1,1) PRIMARY KEY,
    dayOfWeek INT NOT NULL,
    startTime NVARCHAR(5) NOT NULL,
    endTime NVARCHAR(5) NOT NULL,
    isWorkDay BIT NOT NULL DEFAULT 1
);

CREATE TABLE Holiday (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    holidayDate DATETIME2 NOT NULL UNIQUE
);

CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    entity NVARCHAR(100) NOT NULL,
    entityId INT NOT NULL,
    action NVARCHAR(100) NOT NULL,
    changedBy INT NOT NULL,
    changes NVARCHAR(MAX) NOT NULL,
    ipAddress NVARCHAR(45) NULL,
    userAgent NVARCHAR(500) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE NotificationQueue (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    recipient NVARCHAR(255) NOT NULL,
    subject NVARCHAR(255) NULL,
    body NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
    scheduledFor DATETIME2 NULL,
    sentAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- =========================================================================
-- المستوى 1: جداول تعتمد على المستوى الصفري (Level 1 Tables)
-- =========================================================================

CREATE TABLE UITemplate (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL UNIQUE,
    themeId INT NULL,
    CONSTRAINT FK_UITemplate_Theme FOREIGN KEY (themeId) REFERENCES UITheme(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE [Role] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL UNIQUE,
    templateId INT NULL,
    defaultCanViewInternal BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Role_Template FOREIGN KEY (templateId) REFERENCES UITemplate(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE Department (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL UNIQUE,
    isDeleted BIT NOT NULL DEFAULT 0,
    assignmentMode NVARCHAR(50) NOT NULL DEFAULT 'PULL',
    divisionId INT NOT NULL,
    CONSTRAINT FK_Department_Division FOREIGN KEY (divisionId) REFERENCES CompanyDivision(id) ON DELETE CASCADE
);

CREATE TABLE Widget (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    type NVARCHAR(100) NOT NULL,
    extensionId INT NULL,
    CONSTRAINT FK_Widget_Extension FOREIGN KEY (extensionId) REFERENCES SystemExtension(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE IssueCategory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    isDeleted BIT NOT NULL DEFAULT 0,
    parentId INT NULL,
    CONSTRAINT FK_IssueCategory_Parent FOREIGN KEY (parentId) REFERENCES IssueCategory(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE SystemTranslation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    langCode NVARCHAR(10) NOT NULL,
    tableKey NVARCHAR(100) NOT NULL,
    recordId INT NOT NULL,
    fieldKey NVARCHAR(100) NOT NULL,
    textValue NVARCHAR(MAX) NOT NULL,
    CONSTRAINT UQ_SystemTranslation_Keys UNIQUE (langCode, tableKey, recordId, fieldKey)
);

CREATE TABLE TicketStateTransition (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fromStateId INT NOT NULL,
    toStateId INT NOT NULL,
    roleId INT NULL,
    triggerEndpoint NVARCHAR(500) NULL,
    CONSTRAINT FK_Transition_FromState FOREIGN KEY (fromStateId) REFERENCES TicketState(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Transition_ToState FOREIGN KEY (toStateId) REFERENCES TicketState(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Transition_Role FOREIGN KEY (roleId) REFERENCES [Role](id) ON DELETE SET NULL,
    CONSTRAINT UQ_Transition_States_Role UNIQUE (fromStateId, toStateId, roleId)
);

-- =========================================================================
-- المستوى 2: جداول تعتمد على المستويات السابقة (Level 2 Tables)
-- =========================================================================

CREATE TABLE Team (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    isDeleted BIT NOT NULL DEFAULT 0,
    departmentId INT NOT NULL,
    CONSTRAINT FK_Team_Department FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE CASCADE
);

CREATE TABLE WidgetField (
    id INT IDENTITY(1,1) PRIMARY KEY,
    widgetId INT NOT NULL,
    fieldName NVARCHAR(150) NOT NULL,
    fieldType NVARCHAR(100) NOT NULL,
    orderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_WidgetField_Widget FOREIGN KEY (widgetId) REFERENCES Widget(id) ON DELETE CASCADE
);

CREATE TABLE TemplateWidget (
    id INT IDENTITY(1,1) PRIMARY KEY,
    templateId INT NOT NULL,
    widgetId INT NOT NULL,
    orderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_TemplateWidget_Template FOREIGN KEY (templateId) REFERENCES UITemplate(id) ON DELETE CASCADE,
    CONSTRAINT FK_TemplateWidget_Widget FOREIGN KEY (widgetId) REFERENCES Widget(id) ON DELETE CASCADE,
    CONSTRAINT UQ_TemplateWidget UNIQUE (templateId, widgetId)
);

CREATE TABLE StatusSlaRule (
    id INT IDENTITY(1,1) PRIMARY KEY,
    stateId INT NOT NULL,
    categoryId INT NULL,
    maxDurationMins INT NOT NULL,
    escalationLevel INT NOT NULL DEFAULT 1,
    actionType NVARCHAR(50) NOT NULL DEFAULT 'NOTIFY',
    isActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_SlaRule_State FOREIGN KEY (stateId) REFERENCES TicketState(id) ON DELETE CASCADE,
    CONSTRAINT FK_SlaRule_Category FOREIGN KEY (categoryId) REFERENCES IssueCategory(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE Asset (
    id INT IDENTITY(1,1) PRIMARY KEY,
    assetName NVARCHAR(255) NOT NULL,
    assetTag NVARCHAR(100) NOT NULL UNIQUE,
    assetType NVARCHAR(100) NOT NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
    parentId INT NULL,
    departmentId INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Asset_Parent FOREIGN KEY (parentId) REFERENCES Asset(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Asset_Department FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- =========================================================================
-- المستوى 3: إدارة المستخدمين وحوكمة الصلاحيات (Level 3 Tables)
-- =========================================================================

CREATE TABLE [User] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(150) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NULL,
    fullName NVARCHAR(255) NOT NULL,
    isActive BIT NOT NULL DEFAULT 1,
    isVip BIT NOT NULL DEFAULT 0,
    preferredLang NVARCHAR(10) NOT NULL DEFAULT 'ar',
    mfaEnabled BIT NOT NULL DEFAULT 0,
    mfaSecret NVARCHAR(255) NULL,
    isAvailable BIT NOT NULL DEFAULT 1,
    delegatedUserId INT NULL,
    managerId INT NULL,
    failedAttempts INT NOT NULL DEFAULT 0,
    lockoutEnd DATETIME2 NULL,
    resetToken NVARCHAR(255) NULL UNIQUE,
    resetTokenExpires DATETIME2 NULL,
    totalStorageUsedBytes BIGINT NOT NULL DEFAULT 0,
    isDeleted BIT NOT NULL DEFAULT 0,
    deletedAt DATETIME2 NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL,
    roleId INT NOT NULL,
    defaultLocationId INT NULL,
    departmentId INT NULL,
    CONSTRAINT FK_User_Role FOREIGN KEY (roleId) REFERENCES [Role](id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_User_DefaultLocation FOREIGN KEY (defaultLocationId) REFERENCES Location(id) ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT FK_User_Department FOREIGN KEY (departmentId) REFERENCES Department(id) ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT FK_User_Manager FOREIGN KEY (managerId) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_User_DelegatedUser FOREIGN KEY (delegatedUserId) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE TransferPermission (
    id INT IDENTITY(1,1) PRIMARY KEY,
    roleId INT NOT NULL,
    targetDeptId INT NULL,
    targetTeamId INT NULL,
    canViewInternal BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_TransferPerm_Role FOREIGN KEY (roleId) REFERENCES [Role](id) ON DELETE CASCADE,
    CONSTRAINT FK_TransferPerm_Dept FOREIGN KEY (targetDeptId) REFERENCES Department(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_TransferPerm_Team FOREIGN KEY (targetTeamId) REFERENCES Team(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT UQ_TransferPermission UNIQUE (roleId, targetDeptId, targetTeamId)
);

CREATE TABLE WidgetAction (
    id INT IDENTITY(1,1) PRIMARY KEY,
    widgetId INT NOT NULL,
    actionId INT NOT NULL,
    roleId INT NOT NULL,
    orderIndex INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_WidgetAction_Widget FOREIGN KEY (widgetId) REFERENCES Widget(id) ON DELETE CASCADE,
    CONSTRAINT FK_WidgetAction_Action FOREIGN KEY (actionId) REFERENCES [Action](id) ON DELETE CASCADE,
    CONSTRAINT FK_WidgetAction_Role FOREIGN KEY (roleId) REFERENCES [Role](id) ON DELETE CASCADE
);

-- =========================================================================
-- المستوى 4: الجداول الوسيطة والعمليات المرتبطة بالمستخدمين (Level 4 Tables)
-- =========================================================================

CREATE TABLE UserTeam (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    teamId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_UserTeam_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
    CONSTRAINT FK_UserTeam_Team FOREIGN KEY (teamId) REFERENCES Team(id) ON DELETE CASCADE,
    CONSTRAINT UQ_UserTeam UNIQUE (userId, teamId)
);

CREATE TABLE KnowledgeArticle (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    isPublished BIT NOT NULL DEFAULT 0,
    viewCount INT NOT NULL DEFAULT 0,
    categoryId INT NOT NULL,
    authorId INT NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL,
    CONSTRAINT FK_Article_Category FOREIGN KEY (categoryId) REFERENCES IssueCategory(id) ON DELETE CASCADE,
    CONSTRAINT FK_Article_Author FOREIGN KEY (authorId) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- =========================================================================
-- المستوى 5: التذاكر والعمليات التشغيلية الأساسية (Level 5 Tables)
-- =========================================================================

CREATE TABLE Ticket (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    ticketType NVARCHAR(100) NOT NULL DEFAULT 'TECHNICAL',
    channel NVARCHAR(100) NOT NULL DEFAULT 'PORTAL',
    isVip BIT NOT NULL DEFAULT 0,
    urgency NVARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    impact NVARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    priority NVARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    firstResponseTimeMins INT NULL,
    version INT NOT NULL DEFAULT 0,
    closureCodeId INT NULL,
    resolutionNotes NVARCHAR(MAX) NULL,
    locationId INT NULL,
    stateId INT NOT NULL,
    categoryId INT NOT NULL,
    parentId INT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL,
    isDeleted BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Ticket_ClosureCode FOREIGN KEY (closureCodeId) REFERENCES ClosureCode(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Ticket_Location FOREIGN KEY (locationId) REFERENCES Location(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Ticket_State FOREIGN KEY (stateId) REFERENCES TicketState(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Ticket_Category FOREIGN KEY (categoryId) REFERENCES IssueCategory(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Ticket_Parent FOREIGN KEY (parentId) REFERENCES Ticket(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- =========================================================================
-- المستوى 6: ملحقات التذاكر والتفاصيل التشغيلية (Level 6 Tables)
-- =========================================================================

CREATE TABLE TicketRelation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sourceTicketId INT NOT NULL,
    targetTicketId INT NOT NULL,
    relationType NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_Relation_Source FOREIGN KEY (sourceTicketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Relation_Target FOREIGN KEY (targetTicketId) REFERENCES Ticket(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT UQ_TicketRelation UNIQUE (sourceTicketId, targetTicketId)
);

CREATE TABLE TicketVendorEscalation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    vendorId INT NOT NULL,
    vendorTicketRef NVARCHAR(255) NULL,
    status NVARCHAR(50) NOT NULL DEFAULT 'OPEN',
    notes NVARCHAR(MAX) NULL,
    escalatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    resolvedAt DATETIME2 NULL,
    CONSTRAINT FK_Escalation_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Escalation_Vendor FOREIGN KEY (vendorId) REFERENCES Vendor(id) ON DELETE CASCADE
);

CREATE TABLE TicketAsset (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    assetId INT NOT NULL,
    CONSTRAINT FK_TicketAsset_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_TicketAsset_Asset FOREIGN KEY (assetId) REFERENCES Asset(id) ON DELETE CASCADE,
    CONSTRAINT UQ_TicketAsset UNIQUE (ticketId, assetId)
);

CREATE TABLE TicketTag (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    tagId INT NOT NULL,
    CONSTRAINT FK_TicketTag_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_TicketTag_Tag FOREIGN KEY (tagId) REFERENCES Tag(id) ON DELETE CASCADE,
    CONSTRAINT UQ_TicketTag UNIQUE (ticketId, tagId)
);

CREATE TABLE TicketEvaluation (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    userId INT NOT NULL,
    rating INT NULL,
    feedback NVARCHAR(MAX) NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Evaluation_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Evaluation_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE TicketComment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    userId INT NULL,
    commentText NVARCHAR(MAX) NOT NULL,
    isInternal BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Comment_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Comment_User FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE TABLE WorkflowApproval (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    approvedById INT NOT NULL,
    stageName NVARCHAR(150) NOT NULL,
    status NVARCHAR(100) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Approval_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Approval_User FOREIGN KEY (approvedById) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE TicketAssignment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    assignedTeamId INT NULL,
    assignedTechId INT NULL,
    assignedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    isCurrentActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Assignment_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Assignment_Team FOREIGN KEY (assignedTeamId) REFERENCES Team(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT FK_Assignment_Tech FOREIGN KEY (assignedTechId) REFERENCES [User](id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE TicketStatusSlaTracker (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    slaRuleId INT NOT NULL,
    slaStatus NVARCHAR(50) NOT NULL DEFAULT 'COMPLIANT',
    deadlineDateTime DATETIME2 NOT NULL,
    breachedAt DATETIME2 NULL,
    isPaused BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Tracker_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Tracker_Rule FOREIGN KEY (slaRuleId) REFERENCES StatusSlaRule(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE TicketLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    action NVARCHAR(255) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_TicketLog_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE
);

-- =========================================================================
-- المستوى 7: المرفقات وتاريخ إيقاف الـ SLA (Level 7 Tables)
-- =========================================================================

CREATE TABLE TicketAttachment (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    commentId INT NULL,
    fileChecksum NVARCHAR(255) NOT NULL UNIQUE,
    fileName NVARCHAR(255) NOT NULL,
    fileUrl NVARCHAR(1000) NOT NULL,
    uploadedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Attachment_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_Attachment_Comment FOREIGN KEY (commentId) REFERENCES TicketComment(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE TABLE SlaPauseLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    trackerId INT NOT NULL,
    isDuringBusinessHours BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_PauseLog_Tracker FOREIGN KEY (trackerId) REFERENCES TicketStatusSlaTracker(id) ON DELETE CASCADE
);

CREATE TABLE StatusSlaNotificationLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    trackerId INT NOT NULL,
    sentToRole NVARCHAR(100) NOT NULL,
    sentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_NotifLog_Tracker FOREIGN KEY (trackerId) REFERENCES TicketStatusSlaTracker(id) ON DELETE CASCADE
);

-- =========================================================================
-- المستوى 8: حقول البيانات الديناميكية للتذاكر (Level 8 - Field Data)
-- =========================================================================

CREATE TABLE TicketFieldData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticketId INT NOT NULL,
    fieldId INT NOT NULL,
    fieldValue NVARCHAR(MAX) NOT NULL,
    attachmentId INT NULL,
    CONSTRAINT FK_FieldData_Ticket FOREIGN KEY (ticketId) REFERENCES Ticket(id) ON DELETE CASCADE,
    CONSTRAINT FK_FieldData_Field FOREIGN KEY (fieldId) REFERENCES WidgetField(id) ON DELETE CASCADE,
    CONSTRAINT FK_FieldData_Attachment FOREIGN KEY (attachmentId) REFERENCES TicketAttachment(id) ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT UQ_TicketFieldData UNIQUE (ticketId, fieldId)
);
GO

-- =========================================================================
-- الفهارس المخصصة لضمان الأداء العالي وتجنب الـ Table Scans
-- =========================================================================

-- 1. الفهارس الهيكلية المطلوبة افتراضياً
CREATE INDEX IX_Ticket_ParentId ON Ticket(parentId);
CREATE INDEX IX_Ticket_StateId ON Ticket(stateId);
CREATE INDEX IX_Ticket_CreatedAt ON Ticket(createdAt);
CREATE INDEX IX_TicketFieldData_TicketId ON TicketFieldData(ticketId);
CREATE INDEX IX_TicketComment_TicketId ON TicketComment(ticketId);
CREATE NONCLUSTERED INDEX IX_TicketAssignment_Tech_Active ON TicketAssignment(assignedTechId, isCurrentActive);

-- 2. فهارس المفاتيح الخارجية لمنع بطء الـ JOINs في الشاشات الرئيسية والتقارير
CREATE NONCLUSTERED INDEX IX_User_RoleId ON [User](roleId);
CREATE NONCLUSTERED INDEX IX_User_DepartmentId ON [User](departmentId);
CREATE NONCLUSTERED INDEX IX_Department_DivisionId ON Department(divisionId);
CREATE NONCLUSTERED INDEX IX_Team_DepartmentId ON Team(departmentId);
CREATE NONCLUSTERED INDEX IX_UserTeam_TeamId ON UserTeam(teamId);
CREATE NONCLUSTERED INDEX IX_TransferPerm_Role ON TransferPermission(roleId);
CREATE NONCLUSTERED INDEX IX_WidgetField_WidgetId ON WidgetField(widgetId);
CREATE NONCLUSTERED INDEX IX_TemplateWidget_WidgetId ON TemplateWidget(widgetId);
CREATE NONCLUSTERED INDEX IX_WidgetAction_RoleId ON WidgetAction(roleId);
CREATE NONCLUSTERED INDEX IX_Asset_DepartmentId ON Asset(departmentId);
CREATE NONCLUSTERED INDEX IX_Asset_ParentId ON Asset(parentId);
CREATE NONCLUSTERED INDEX IX_KnowledgeArticle_CategoryId ON KnowledgeArticle(categoryId);
CREATE NONCLUSTERED INDEX IX_KnowledgeArticle_AuthorId ON KnowledgeArticle(authorId);
CREATE NONCLUSTERED INDEX IX_Ticket_CategoryId ON Ticket(categoryId);
CREATE NONCLUSTERED INDEX IX_Ticket_LocationId ON Ticket(locationId);
CREATE NONCLUSTERED INDEX IX_TicketAssignment_TicketId ON TicketAssignment(ticketId);
CREATE NONCLUSTERED INDEX IX_TicketAssignment_TeamId ON TicketAssignment(assignedTeamId);
CREATE NONCLUSTERED INDEX IX_TicketStatusSlaTracker_SlaRuleId ON TicketStatusSlaTracker(slaRuleId);
CREATE NONCLUSTERED INDEX IX_StatusSlaRule_StateId ON StatusSlaRule(stateId);
CREATE NONCLUSTERED INDEX IX_StatusSlaRule_CategoryId ON StatusSlaRule(categoryId);
CREATE NONCLUSTERED INDEX IX_TicketVendorEscalation_TicketId ON TicketVendorEscalation(ticketId);
CREATE NONCLUSTERED INDEX IX_TicketVendorEscalation_VendorId ON TicketVendorEscalation(vendorId);
CREATE NONCLUSTERED INDEX IX_WorkflowApproval_TicketId ON WorkflowApproval(ticketId);
CREATE NONCLUSTERED INDEX IX_WorkflowApproval_ApprovedById ON WorkflowApproval(approvedById);
CREATE NONCLUSTERED INDEX IX_TicketEvaluation_UserId ON TicketEvaluation(userId);
CREATE NONCLUSTERED INDEX IX_TicketComment_UserId ON TicketComment(userId);
GO

-- =========================================================================
-- المستوى 9: نظام الإشعارات الديناميكي وSLA (Level 9 - Notifications)
-- =========================================================================

CREATE TABLE [dbo].[NotificationEvents] (
    [EventId] NVARCHAR(50) PRIMARY KEY,
    [Label] NVARCHAR(255) NOT NULL,
    [IsSLASetting] BIT DEFAULT 0,
    [IsHighPriority] BIT DEFAULT 0
);

INSERT INTO [dbo].[NotificationEvents] ([EventId], [Label], [IsSLASetting], [IsHighPriority])
VALUES 
('TKT_COMPLETED', N'إكمال التذكرة', 0, 0),
('TKT_REASSIGNED', N'إعادة التعيين والتوجيه', 0, 0),
('DEPT_TRANSFER', N'التحويل بين الأقسام', 0, 1),
('SUB_TICKET', N'إنشاء تذاكر فرعية', 0, 0),
('SLA_NOT_OPENED', N'تأخر المهندس في فتح التذكرة', 1, 1),
('SLA_RESOLUTION_DELAY', N'تأخر المهندس في الحل', 1, 0);

CREATE TABLE [dbo].[UserNotificationPreferences] (
    [PreferenceId] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    [UserId] INT NOT NULL,
    [EventId] NVARCHAR(50) NOT NULL,
    [NotifyInApp] BIT DEFAULT 1,
    [NotifyEmail] BIT DEFAULT 1,
    [NotifyWhatsapp] BIT DEFAULT 0,
    [SLA_ThresholdMinutes] INT NULL,
    [UpdatedAt] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_Preferences_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Preferences_Event] FOREIGN KEY ([EventId]) REFERENCES [dbo].[NotificationEvents]([EventId]) ON DELETE CASCADE,
    CONSTRAINT [UQ_User_Event] UNIQUE ([UserId], [EventId])
);

CREATE TABLE [dbo].[SystemNotificationSettings] (
    [SettingId] INT PRIMARY KEY IDENTITY(1,1),
    [ForceWhatsappCritical] BIT DEFAULT 1,
    [LockSLAThresholds] BIT DEFAULT 0,
    [LastUpdatedBy] INT NOT NULL,
    [UpdatedAt] DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT [FK_SysNotif_User] FOREIGN KEY ([LastUpdatedBy]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
);

INSERT INTO [dbo].[SystemNotificationSettings] ([ForceWhatsappCritical], [LockSLAThresholds], [LastUpdatedBy])
VALUES (1, 0, 1); -- Assuming Admin User ID 1 exists
GO
