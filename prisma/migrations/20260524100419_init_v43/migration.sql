BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Location] (
    [id] INT NOT NULL IDENTITY(1,1),
    [building] NVARCHAR(1000) NOT NULL,
    [floor] NVARCHAR(1000),
    [office] NVARCHAR(1000),
    CONSTRAINT [Location_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000),
    [fullName] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [isVip] BIT NOT NULL CONSTRAINT [User_isVip_df] DEFAULT 0,
    [preferredLang] NVARCHAR(1000) NOT NULL CONSTRAINT [User_preferredLang_df] DEFAULT 'ar',
    [mfaEnabled] BIT NOT NULL CONSTRAINT [User_mfaEnabled_df] DEFAULT 0,
    [mfaSecret] NVARCHAR(1000),
    [isAvailable] BIT NOT NULL CONSTRAINT [User_isAvailable_df] DEFAULT 1,
    [delegatedUserId] INT,
    [managerId] INT,
    [failedAttempts] INT NOT NULL CONSTRAINT [User_failedAttempts_df] DEFAULT 0,
    [lockoutEnd] DATETIME2,
    [resetToken] NVARCHAR(1000),
    [resetTokenExpires] DATETIME2,
    [totalStorageUsedBytes] BIGINT NOT NULL CONSTRAINT [User_totalStorageUsedBytes_df] DEFAULT 0,
    [isDeleted] BIT NOT NULL CONSTRAINT [User_isDeleted_df] DEFAULT 0,
    [deletedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [roleId] INT NOT NULL,
    [defaultLocationId] INT,
    [departmentId] INT,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [User_resetToken_key] UNIQUE NONCLUSTERED ([resetToken])
);

-- CreateTable
CREATE TABLE [dbo].[Role] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [templateId] INT,
    [defaultCanViewInternal] BIT NOT NULL CONSTRAINT [Role_defaultCanViewInternal_df] DEFAULT 0,
    CONSTRAINT [Role_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Role_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[CompanyDivision] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CompanyDivision_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CompanyDivision_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Department] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [isDeleted] BIT NOT NULL CONSTRAINT [Department_isDeleted_df] DEFAULT 0,
    [assignmentMode] NVARCHAR(1000) NOT NULL CONSTRAINT [Department_assignmentMode_df] DEFAULT 'PULL',
    [divisionId] INT NOT NULL,
    CONSTRAINT [Department_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Department_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Team] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [isDeleted] BIT NOT NULL CONSTRAINT [Team_isDeleted_df] DEFAULT 0,
    [departmentId] INT NOT NULL,
    CONSTRAINT [Team_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[UserTeam] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [teamId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserTeam_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [UserTeam_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserTeam_userId_teamId_key] UNIQUE NONCLUSTERED ([userId],[teamId])
);

-- CreateTable
CREATE TABLE [dbo].[TransferPermission] (
    [id] INT NOT NULL IDENTITY(1,1),
    [roleId] INT NOT NULL,
    [targetDeptId] INT,
    [targetTeamId] INT,
    [canViewInternal] BIT NOT NULL CONSTRAINT [TransferPermission_canViewInternal_df] DEFAULT 0,
    CONSTRAINT [TransferPermission_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TransferPermission_roleId_targetDeptId_targetTeamId_key] UNIQUE NONCLUSTERED ([roleId],[targetDeptId],[targetTeamId])
);

-- CreateTable
CREATE TABLE [dbo].[SystemSetting] (
    [id] INT NOT NULL IDENTITY(1,1),
    [settingKey] NVARCHAR(1000) NOT NULL,
    [settingValue] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [SystemSetting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SystemSetting_settingKey_key] UNIQUE NONCLUSTERED ([settingKey])
);

-- CreateTable
CREATE TABLE [dbo].[SystemTranslation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [langCode] NVARCHAR(1000) NOT NULL,
    [tableKey] NVARCHAR(1000) NOT NULL,
    [recordId] INT NOT NULL,
    [fieldKey] NVARCHAR(1000) NOT NULL,
    [textValue] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [SystemTranslation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SystemTranslation_langCode_tableKey_recordId_fieldKey_key] UNIQUE NONCLUSTERED ([langCode],[tableKey],[recordId],[fieldKey])
);

-- CreateTable
CREATE TABLE [dbo].[SystemExtension] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [version] NVARCHAR(1000) NOT NULL,
    [metadataJson] NVARCHAR(1000) NOT NULL,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [SystemExtension_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [checksum] NVARCHAR(1000) NOT NULL,
    [isVerified] BIT NOT NULL CONSTRAINT [SystemExtension_isVerified_df] DEFAULT 0,
    CONSTRAINT [SystemExtension_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [SystemExtension_name_key] UNIQUE NONCLUSTERED ([name]),
    CONSTRAINT [SystemExtension_checksum_key] UNIQUE NONCLUSTERED ([checksum])
);

-- CreateTable
CREATE TABLE [dbo].[UITheme] (
    [id] INT NOT NULL IDENTITY(1,1),
    [themeName] NVARCHAR(1000) NOT NULL,
    [primaryColor] NVARCHAR(1000) NOT NULL,
    [secondaryColor] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [UITheme_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UITheme_themeName_key] UNIQUE NONCLUSTERED ([themeName])
);

-- CreateTable
CREATE TABLE [dbo].[UITemplate] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [themeId] INT,
    CONSTRAINT [UITemplate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UITemplate_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[Widget] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [extensionId] INT,
    CONSTRAINT [Widget_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TemplateWidget] (
    [id] INT NOT NULL IDENTITY(1,1),
    [templateId] INT NOT NULL,
    [widgetId] INT NOT NULL,
    [orderIndex] INT NOT NULL CONSTRAINT [TemplateWidget_orderIndex_df] DEFAULT 0,
    CONSTRAINT [TemplateWidget_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TemplateWidget_templateId_widgetId_key] UNIQUE NONCLUSTERED ([templateId],[widgetId])
);

-- CreateTable
CREATE TABLE [dbo].[WidgetField] (
    [id] INT NOT NULL IDENTITY(1,1),
    [widgetId] INT NOT NULL,
    [fieldName] NVARCHAR(1000) NOT NULL,
    [fieldType] NVARCHAR(1000) NOT NULL,
    [orderIndex] INT NOT NULL CONSTRAINT [WidgetField_orderIndex_df] DEFAULT 0,
    CONSTRAINT [WidgetField_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WidgetAction] (
    [id] INT NOT NULL IDENTITY(1,1),
    [widgetId] INT NOT NULL,
    [actionId] INT NOT NULL,
    [roleId] INT NOT NULL,
    [orderIndex] INT NOT NULL CONSTRAINT [WidgetAction_orderIndex_df] DEFAULT 0,
    CONSTRAINT [WidgetAction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Action] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [apiEndpoint] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Action_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Asset] (
    [id] INT NOT NULL IDENTITY(1,1),
    [assetName] NVARCHAR(1000) NOT NULL,
    [assetTag] NVARCHAR(1000) NOT NULL,
    [assetType] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Asset_status_df] DEFAULT 'OPERATIONAL',
    [parentId] INT,
    [departmentId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Asset_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Asset_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Asset_assetTag_key] UNIQUE NONCLUSTERED ([assetTag])
);

-- CreateTable
CREATE TABLE [dbo].[TicketAsset] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [assetId] INT NOT NULL,
    CONSTRAINT [TicketAsset_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketAsset_ticketId_assetId_key] UNIQUE NONCLUSTERED ([ticketId],[assetId])
);

-- CreateTable
CREATE TABLE [dbo].[MaintenanceWindow] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [startTime] DATETIME2 NOT NULL,
    [endTime] DATETIME2 NOT NULL,
    [affectedSystem] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [MaintenanceWindow_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [MaintenanceWindow_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [MaintenanceWindow_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Vendor] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [contactEmail] NVARCHAR(1000),
    [contactPhone] NVARCHAR(1000),
    [slaAgreement] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Vendor_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Vendor_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Vendor_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[PriorityMatrix] (
    [id] INT NOT NULL IDENTITY(1,1),
    [impact] NVARCHAR(1000) NOT NULL,
    [urgency] NVARCHAR(1000) NOT NULL,
    [priority] NVARCHAR(1000) NOT NULL,
    [slaMultiplier] FLOAT(53) NOT NULL CONSTRAINT [PriorityMatrix_slaMultiplier_df] DEFAULT 1.0,
    CONSTRAINT [PriorityMatrix_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [PriorityMatrix_impact_urgency_key] UNIQUE NONCLUSTERED ([impact],[urgency])
);

-- CreateTable
CREATE TABLE [dbo].[KnowledgeArticle] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [isPublished] BIT NOT NULL CONSTRAINT [KnowledgeArticle_isPublished_df] DEFAULT 0,
    [viewCount] INT NOT NULL CONSTRAINT [KnowledgeArticle_viewCount_df] DEFAULT 0,
    [categoryId] INT NOT NULL,
    [authorId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [KnowledgeArticle_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [KnowledgeArticle_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Tag] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [colorCode] NVARCHAR(1000),
    CONSTRAINT [Tag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Tag_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[TicketTag] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [tagId] INT NOT NULL,
    CONSTRAINT [TicketTag_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketTag_ticketId_tagId_key] UNIQUE NONCLUSTERED ([ticketId],[tagId])
);

-- CreateTable
CREATE TABLE [dbo].[ClosureCode] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ClosureCode_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ClosureCode_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[IssueCategory] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [isDeleted] BIT NOT NULL CONSTRAINT [IssueCategory_isDeleted_df] DEFAULT 0,
    [parentId] INT,
    CONSTRAINT [IssueCategory_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketState] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TicketState_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketState_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[TicketStateTransition] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fromStateId] INT NOT NULL,
    [toStateId] INT NOT NULL,
    [roleId] INT,
    [triggerEndpoint] NVARCHAR(1000),
    CONSTRAINT [TicketStateTransition_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketStateTransition_fromStateId_toStateId_roleId_key] UNIQUE NONCLUSTERED ([fromStateId],[toStateId],[roleId])
);

-- CreateTable
CREATE TABLE [dbo].[TicketRelation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [sourceTicketId] INT NOT NULL,
    [targetTicketId] INT NOT NULL,
    [relationType] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [TicketRelation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketRelation_sourceTicketId_targetTicketId_key] UNIQUE NONCLUSTERED ([sourceTicketId],[targetTicketId])
);

-- CreateTable
CREATE TABLE [dbo].[TicketVendorEscalation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [vendorId] INT NOT NULL,
    [vendorTicketRef] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [TicketVendorEscalation_status_df] DEFAULT 'OPEN',
    [notes] NVARCHAR(1000),
    [escalatedAt] DATETIME2 NOT NULL CONSTRAINT [TicketVendorEscalation_escalatedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [resolvedAt] DATETIME2,
    CONSTRAINT [TicketVendorEscalation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Ticket] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [ticketType] NVARCHAR(1000) NOT NULL CONSTRAINT [Ticket_ticketType_df] DEFAULT 'TECHNICAL',
    [channel] NVARCHAR(1000) NOT NULL CONSTRAINT [Ticket_channel_df] DEFAULT 'PORTAL',
    [isVip] BIT NOT NULL CONSTRAINT [Ticket_isVip_df] DEFAULT 0,
    [urgency] NVARCHAR(1000) NOT NULL CONSTRAINT [Ticket_urgency_df] DEFAULT 'MEDIUM',
    [impact] NVARCHAR(1000) NOT NULL CONSTRAINT [Ticket_impact_df] DEFAULT 'MEDIUM',
    [priority] NVARCHAR(1000) NOT NULL CONSTRAINT [Ticket_priority_df] DEFAULT 'MEDIUM',
    [firstResponseTimeMins] INT,
    [version] INT NOT NULL CONSTRAINT [Ticket_version_df] DEFAULT 0,
    [closureCodeId] INT,
    [resolutionNotes] NVARCHAR(1000),
    [locationId] INT,
    [stateId] INT NOT NULL,
    [categoryId] INT NOT NULL,
    [parentId] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ticket_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [isDeleted] BIT NOT NULL CONSTRAINT [Ticket_isDeleted_df] DEFAULT 0,
    CONSTRAINT [Ticket_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketEvaluation] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [userId] INT NOT NULL,
    [rating] INT,
    [feedback] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketEvaluation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketEvaluation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketFieldData] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [fieldId] INT NOT NULL,
    [fieldValue] NVARCHAR(1000) NOT NULL,
    [attachmentId] INT,
    CONSTRAINT [TicketFieldData_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketFieldData_ticketId_fieldId_key] UNIQUE NONCLUSTERED ([ticketId],[fieldId])
);

-- CreateTable
CREATE TABLE [dbo].[TicketAttachment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [commentId] INT,
    [fileChecksum] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [fileUrl] NVARCHAR(1000) NOT NULL,
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [TicketAttachment_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketAttachment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TicketAttachment_fileChecksum_key] UNIQUE NONCLUSTERED ([fileChecksum])
);

-- CreateTable
CREATE TABLE [dbo].[TicketComment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [userId] INT,
    [commentText] NVARCHAR(1000) NOT NULL,
    [isInternal] BIT NOT NULL CONSTRAINT [TicketComment_isInternal_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketComment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketComment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[WorkflowApproval] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [approvedById] INT NOT NULL,
    [stageName] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [WorkflowApproval_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [WorkflowApproval_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketAssignment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [assignedTeamId] INT,
    [assignedTechId] INT,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [TicketAssignment_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [isCurrentActive] BIT NOT NULL CONSTRAINT [TicketAssignment_isCurrentActive_df] DEFAULT 1,
    CONSTRAINT [TicketAssignment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[NotificationQueue] (
    [id] INT NOT NULL IDENTITY(1,1),
    [type] NVARCHAR(1000) NOT NULL,
    [recipient] NVARCHAR(1000) NOT NULL,
    [subject] NVARCHAR(1000),
    [body] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [NotificationQueue_status_df] DEFAULT 'PENDING',
    [scheduledFor] DATETIME2,
    [sentAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [NotificationQueue_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [NotificationQueue_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[BusinessHours] (
    [id] INT NOT NULL IDENTITY(1,1),
    [dayOfWeek] INT NOT NULL,
    [startTime] NVARCHAR(1000) NOT NULL,
    [endTime] NVARCHAR(1000) NOT NULL,
    [isWorkDay] BIT NOT NULL CONSTRAINT [BusinessHours_isWorkDay_df] DEFAULT 1,
    CONSTRAINT [BusinessHours_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Holiday] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [holidayDate] DATETIME2 NOT NULL,
    CONSTRAINT [Holiday_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Holiday_holidayDate_key] UNIQUE NONCLUSTERED ([holidayDate])
);

-- CreateTable
CREATE TABLE [dbo].[StatusSlaRule] (
    [id] INT NOT NULL IDENTITY(1,1),
    [stateId] INT NOT NULL,
    [categoryId] INT,
    [maxDurationMins] INT NOT NULL,
    [escalationLevel] INT NOT NULL CONSTRAINT [StatusSlaRule_escalationLevel_df] DEFAULT 1,
    [actionType] NVARCHAR(1000) NOT NULL CONSTRAINT [StatusSlaRule_actionType_df] DEFAULT 'NOTIFY',
    [isActive] BIT NOT NULL CONSTRAINT [StatusSlaRule_isActive_df] DEFAULT 1,
    CONSTRAINT [StatusSlaRule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketStatusSlaTracker] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [slaRuleId] INT NOT NULL,
    [slaStatus] NVARCHAR(1000) NOT NULL CONSTRAINT [TicketStatusSlaTracker_slaStatus_df] DEFAULT 'COMPLIANT',
    [deadlineDateTime] DATETIME2 NOT NULL,
    [breachedAt] DATETIME2,
    [isPaused] BIT NOT NULL CONSTRAINT [TicketStatusSlaTracker_isPaused_df] DEFAULT 0,
    CONSTRAINT [TicketStatusSlaTracker_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[SlaPauseLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [trackerId] INT NOT NULL,
    [isDuringBusinessHours] BIT NOT NULL CONSTRAINT [SlaPauseLog_isDuringBusinessHours_df] DEFAULT 1,
    CONSTRAINT [SlaPauseLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StatusSlaNotificationLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [trackerId] INT NOT NULL,
    [sentToRole] NVARCHAR(1000) NOT NULL,
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [StatusSlaNotificationLog_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [StatusSlaNotificationLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[TicketLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [ticketId] INT NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TicketLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [TicketLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[AuditLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [entity] NVARCHAR(1000) NOT NULL,
    [entityId] INT NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [changedBy] INT NOT NULL,
    [changes] NVARCHAR(1000) NOT NULL,
    [ipAddress] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AuditLog_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AuditLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_parentId_idx] ON [dbo].[Ticket]([parentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_stateId_idx] ON [dbo].[Ticket]([stateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Ticket_createdAt_idx] ON [dbo].[Ticket]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketFieldData_ticketId_idx] ON [dbo].[TicketFieldData]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketComment_ticketId_idx] ON [dbo].[TicketComment]([ticketId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [TicketAssignment_assignedTechId_isCurrentActive_idx] ON [dbo].[TicketAssignment]([assignedTechId], [isCurrentActive]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_managerId_fkey] FOREIGN KEY ([managerId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_defaultLocationId_fkey] FOREIGN KEY ([defaultLocationId]) REFERENCES [dbo].[Location]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_delegatedUserId_fkey] FOREIGN KEY ([delegatedUserId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Role] ADD CONSTRAINT [Role_templateId_fkey] FOREIGN KEY ([templateId]) REFERENCES [dbo].[UITemplate]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Department] ADD CONSTRAINT [Department_divisionId_fkey] FOREIGN KEY ([divisionId]) REFERENCES [dbo].[CompanyDivision]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Team] ADD CONSTRAINT [Team_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserTeam] ADD CONSTRAINT [UserTeam_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UserTeam] ADD CONSTRAINT [UserTeam_teamId_fkey] FOREIGN KEY ([teamId]) REFERENCES [dbo].[Team]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TransferPermission] ADD CONSTRAINT [TransferPermission_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TransferPermission] ADD CONSTRAINT [TransferPermission_targetDeptId_fkey] FOREIGN KEY ([targetDeptId]) REFERENCES [dbo].[Department]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TransferPermission] ADD CONSTRAINT [TransferPermission_targetTeamId_fkey] FOREIGN KEY ([targetTeamId]) REFERENCES [dbo].[Team]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[UITemplate] ADD CONSTRAINT [UITemplate_themeId_fkey] FOREIGN KEY ([themeId]) REFERENCES [dbo].[UITheme]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Widget] ADD CONSTRAINT [Widget_extensionId_fkey] FOREIGN KEY ([extensionId]) REFERENCES [dbo].[SystemExtension]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TemplateWidget] ADD CONSTRAINT [TemplateWidget_templateId_fkey] FOREIGN KEY ([templateId]) REFERENCES [dbo].[UITemplate]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TemplateWidget] ADD CONSTRAINT [TemplateWidget_widgetId_fkey] FOREIGN KEY ([widgetId]) REFERENCES [dbo].[Widget]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WidgetField] ADD CONSTRAINT [WidgetField_widgetId_fkey] FOREIGN KEY ([widgetId]) REFERENCES [dbo].[Widget]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WidgetAction] ADD CONSTRAINT [WidgetAction_widgetId_fkey] FOREIGN KEY ([widgetId]) REFERENCES [dbo].[Widget]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WidgetAction] ADD CONSTRAINT [WidgetAction_actionId_fkey] FOREIGN KEY ([actionId]) REFERENCES [dbo].[Action]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WidgetAction] ADD CONSTRAINT [WidgetAction_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Asset] ADD CONSTRAINT [Asset_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Asset]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Asset] ADD CONSTRAINT [Asset_departmentId_fkey] FOREIGN KEY ([departmentId]) REFERENCES [dbo].[Department]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAsset] ADD CONSTRAINT [TicketAsset_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAsset] ADD CONSTRAINT [TicketAsset_assetId_fkey] FOREIGN KEY ([assetId]) REFERENCES [dbo].[Asset]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[KnowledgeArticle] ADD CONSTRAINT [KnowledgeArticle_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[IssueCategory]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[KnowledgeArticle] ADD CONSTRAINT [KnowledgeArticle_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketTag] ADD CONSTRAINT [TicketTag_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketTag] ADD CONSTRAINT [TicketTag_tagId_fkey] FOREIGN KEY ([tagId]) REFERENCES [dbo].[Tag]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[IssueCategory] ADD CONSTRAINT [IssueCategory_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[IssueCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketStateTransition] ADD CONSTRAINT [TicketStateTransition_fromStateId_fkey] FOREIGN KEY ([fromStateId]) REFERENCES [dbo].[TicketState]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketStateTransition] ADD CONSTRAINT [TicketStateTransition_toStateId_fkey] FOREIGN KEY ([toStateId]) REFERENCES [dbo].[TicketState]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketStateTransition] ADD CONSTRAINT [TicketStateTransition_roleId_fkey] FOREIGN KEY ([roleId]) REFERENCES [dbo].[Role]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketRelation] ADD CONSTRAINT [TicketRelation_sourceTicketId_fkey] FOREIGN KEY ([sourceTicketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketRelation] ADD CONSTRAINT [TicketRelation_targetTicketId_fkey] FOREIGN KEY ([targetTicketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketVendorEscalation] ADD CONSTRAINT [TicketVendorEscalation_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketVendorEscalation] ADD CONSTRAINT [TicketVendorEscalation_vendorId_fkey] FOREIGN KEY ([vendorId]) REFERENCES [dbo].[Vendor]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_closureCodeId_fkey] FOREIGN KEY ([closureCodeId]) REFERENCES [dbo].[ClosureCode]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_locationId_fkey] FOREIGN KEY ([locationId]) REFERENCES [dbo].[Location]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_stateId_fkey] FOREIGN KEY ([stateId]) REFERENCES [dbo].[TicketState]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[IssueCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Ticket] ADD CONSTRAINT [Ticket_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketEvaluation] ADD CONSTRAINT [TicketEvaluation_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketEvaluation] ADD CONSTRAINT [TicketEvaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketFieldData] ADD CONSTRAINT [TicketFieldData_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketFieldData] ADD CONSTRAINT [TicketFieldData_fieldId_fkey] FOREIGN KEY ([fieldId]) REFERENCES [dbo].[WidgetField]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketFieldData] ADD CONSTRAINT [TicketFieldData_attachmentId_fkey] FOREIGN KEY ([attachmentId]) REFERENCES [dbo].[TicketAttachment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAttachment] ADD CONSTRAINT [TicketAttachment_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAttachment] ADD CONSTRAINT [TicketAttachment_commentId_fkey] FOREIGN KEY ([commentId]) REFERENCES [dbo].[TicketComment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketComment] ADD CONSTRAINT [TicketComment_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketComment] ADD CONSTRAINT [TicketComment_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[WorkflowApproval] ADD CONSTRAINT [WorkflowApproval_approvedById_fkey] FOREIGN KEY ([approvedById]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_assignedTeamId_fkey] FOREIGN KEY ([assignedTeamId]) REFERENCES [dbo].[Team]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketAssignment] ADD CONSTRAINT [TicketAssignment_assignedTechId_fkey] FOREIGN KEY ([assignedTechId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StatusSlaRule] ADD CONSTRAINT [StatusSlaRule_stateId_fkey] FOREIGN KEY ([stateId]) REFERENCES [dbo].[TicketState]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StatusSlaRule] ADD CONSTRAINT [StatusSlaRule_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[IssueCategory]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[TicketStatusSlaTracker] ADD CONSTRAINT [TicketStatusSlaTracker_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketStatusSlaTracker] ADD CONSTRAINT [TicketStatusSlaTracker_slaRuleId_fkey] FOREIGN KEY ([slaRuleId]) REFERENCES [dbo].[StatusSlaRule]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SlaPauseLog] ADD CONSTRAINT [SlaPauseLog_trackerId_fkey] FOREIGN KEY ([trackerId]) REFERENCES [dbo].[TicketStatusSlaTracker]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StatusSlaNotificationLog] ADD CONSTRAINT [StatusSlaNotificationLog_trackerId_fkey] FOREIGN KEY ([trackerId]) REFERENCES [dbo].[TicketStatusSlaTracker]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[TicketLog] ADD CONSTRAINT [TicketLog_ticketId_fkey] FOREIGN KEY ([ticketId]) REFERENCES [dbo].[Ticket]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
