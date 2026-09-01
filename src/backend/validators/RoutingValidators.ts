import { z } from 'zod';

// Routing Rules
export const routeSchema = z.object({
  id: z.string().optional(),
  ruleName: z.string().min(1, 'Rule name is required'),
  conditionField: z.string().min(1, 'Condition field is required'),
  conditionOperator: z.enum(['EQUALS', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH', 'GREATER_THAN', 'LESS_THAN', 'IN']),
  conditionValue: z.string().min(1, 'Condition value is required'),
  targetDepartment: z.number().int().positive('Target Department ID is required'),
  priority: z.number().int().optional()
});

export const saveRoutesSnapshotSchema = z.object({
  routes: z.array(routeSchema)
});

// Dynamic Fields
export const saveDynamicFieldsSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string().min(1, 'Field ID is required'),
      name: z.string().min(1, 'Field name is required'),
      type: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO']),
      label: z.string().min(1, 'Field label is required'),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional()
    })
  )
});
