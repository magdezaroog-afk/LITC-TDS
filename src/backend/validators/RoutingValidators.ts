import { z } from 'zod';

// ─── Dynamic Field Option ─────────────────────────────────────────────────────
const dynamicFieldOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  isActive: z.boolean().default(true),
  customInputs: z.array(z.any()).optional(),
}).passthrough();

// ─── Child Field Binding ───────────────────────────────────────────────────────
const childFieldBindingSchema = z.object({
  childFieldId: z.string().min(1),
  triggerValue: z.string().min(1),
}).passthrough();

// ─── Dynamic Custom Field (stored globally, referenced by routes) ──────────────
const dynamicCustomFieldSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  options: z.array(dynamicFieldOptionSchema),
  childBindings: z.array(childFieldBindingSchema).optional(),
}).passthrough();

// ─── Save Dynamic Fields ──────────────────────────────────────────────────────
export const saveDynamicFieldsSchema = z.object({
  fields: z.array(dynamicCustomFieldSchema),
}).passthrough();

// ─── Route Form Config ────────────────────────────────────────────────────────
const routeFormConfigSchema = z.object({
  showBuildingField: z.boolean().optional().default(false),
  mandatoryBuilding: z.boolean().optional().default(false),
  showDepartmentField: z.boolean().optional().default(false),
  mandatoryDepartment: z.boolean().optional().default(false),
  departmentSelectionLevel: z.enum(['DEPT_ONLY', 'DEPT_AND_DIV', 'FULL_HIERARCHY']).optional().default('DEPT_ONLY'),
  mandatoryDivision: z.boolean().optional().default(false),
  mandatoryTeam: z.boolean().optional().default(false),
  showDescription: z.boolean().default(true),
  mandatoryDescription: z.boolean().default(true),
  showAttachments: z.boolean().default(true),
  mandatoryAttachments: z.boolean().default(false),
  attachmentTypes: z.array(z.string()).default(['PDF', 'PNG', 'JPG']),
  maxAttachmentMB: z.number().int().min(1).max(500).default(5),
  taxonomy: z.array(z.any()).default([]),
  customFieldIds: z.array(z.string()).default([]),
  routeDynamicFields: z.array(
    z.object({
      fieldId: z.string(),
      isRequired: z.boolean().default(true),
    })
  ).default([]),
  optionBehaviorRules: z.record(z.string(), z.object({
    attachmentRule: z.enum(['REQUIRED', 'OPTIONAL', 'HIDDEN']).optional(),
    descriptionRule: z.enum(['REQUIRED', 'OPTIONAL', 'HIDDEN']).optional(),
    scheduleRule: z.enum(['DATE_RANGE', 'DISCRETE_DAYS', 'HOURLY_WINDOW', 'DEFAULT']).optional(),
  })).optional().default({}),
  // ─── Smart Time & Scheduling Engine (نظام الجدولة والوقت الذكي) ───
  showScheduleEngine: z.boolean().optional().default(false),
  mandatorySchedule: z.boolean().optional().default(false),
  scheduleLabel: z.string().optional().default('الجدولة الزمنية / فترة الطلب'),
  scheduleMode: z.enum(['ANY', 'DATE_RANGE', 'DISCRETE_DAYS', 'HOURLY_WINDOW', 'SINGLE_DATE']).optional().default('ANY'),

  // ─── Delegate Colleague (الموظف البديل / تسليم المهام) ───
  showDelegateUser: z.boolean().optional().default(false),
  mandatoryDelegateUser: z.boolean().optional().default(false),
  delegateUserLabel: z.string().optional().default('الموظف البديل / تسليم المهام'),
  delegateScope: z.enum(['ALL_COMPANY_USERS', 'SAME_DEPARTMENT']).optional().default('ALL_COMPANY_USERS'),
  delegateTriggerMode: z.enum(['ONLY_ON_ASSIGNMENT', 'ALWAYS']).optional().default('ONLY_ON_ASSIGNMENT'),
  delegateTriggerOptionLabel: z.string().optional().default('تكليف'),

  // ─── Compatibility Fields ───
  showDateRange: z.boolean().optional().default(false),
  mandatoryDateRange: z.boolean().optional().default(false),
  dateRangeType: z.string().optional().default('DATE_ONLY'),
  dateRangeLabel: z.string().optional().default('الفترة الزمنية / التاريخ'),
  showVehicleField: z.boolean().optional().default(false),
  mandatoryVehicle: z.boolean().optional().default(false),
  vehicleFieldLabel: z.string().optional().default(''),
  showAmountField: z.boolean().optional().default(false),
  mandatoryAmount: z.boolean().optional().default(false),
  amountFieldLabel: z.string().optional().default(''),
  showHealthField: z.boolean().optional().default(false),
  mandatoryHealth: z.boolean().optional().default(false),
  healthFieldLabel: z.string().optional().default(''),
  allowMultipleOpenTickets: z.boolean().optional().default(true),
  maxConcurrentOpenTickets: z.number().int().min(0).optional().default(0),
  maxUnratedTicketsAllowed: z.number().int().min(0).optional().default(0),
  requireRatingBeforeNewTicket: z.boolean().optional().default(false),
}).passthrough();

// ─── Ticket Route Definition (بنية Frontend الحقيقية) ───────────────────────
export const routeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Route name is required'),
  description: z.string().default(''),
  icon: z.string().default('ClipboardList'),
  color: z.string().default('#007AFF'),
  routeCategory: z.enum(['OPERATIONAL', 'TIME_OFF', 'FINANCIAL', 'GENERAL']).optional().default('OPERATIONAL'),
  targetDepartmentId: z.union([z.string(), z.number()]).transform(v => String(v)),
  targetDepartmentName: z.string().default(''),
  targetDivisionId: z.union([z.string(), z.number()]).optional().transform(v => v !== undefined && v !== null ? String(v) : ''),
  targetDivisionName: z.string().optional().default(''),
  targetTeamId: z.union([z.string(), z.number()]).optional().transform(v => v !== undefined && v !== null ? String(v) : ''),
  targetTeamName: z.string().optional().default(''),
  managerId: z.union([z.string(), z.number()]).optional().nullable().transform(v => v !== undefined && v !== null && v !== '' ? String(v) : undefined),
  managerName: z.string().optional().nullable().default(''),
  formConfig: routeFormConfigSchema.default(() => routeFormConfigSchema.parse({})),
  isActive: z.boolean().default(true),
  captured_historical_data: z.any().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

// ─── Save Routes Snapshot ─────────────────────────────────────────────────────
export const saveRoutesSnapshotSchema = z.object({
  routes: z.array(routeSchema),
});

// ─── Ticket Submission (POST /api/v1/tickets) ──────────────────────────────────
export const ticketSubmitSchema = z.object({
  routeId: z.string().min(1, 'routeId مطلوب'),
  title: z.string().min(1, 'عنوان الطلب مطلوب'),
  description: z.string().optional().default(''),
  taxonomyMain: z.string().optional(),
  taxonomySub: z.string().optional(),
  buildingId: z.string().optional(),
  departmentId: z.union([z.string(), z.number()]).optional(),
  fields: z.record(z.string(), z.any()).optional(),
});
