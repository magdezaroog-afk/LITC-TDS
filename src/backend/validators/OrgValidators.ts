import { z } from 'zod';

// Buildings
export const saveBuildingsSchema = z.object({
  buildings: z.array(
    z.object({
      id: z.string().optional(),
      globalId: z.string().optional(),
      name: z.string().min(1, 'Name is required'),
      type: z.enum(['BUILDING', 'LOCATION'])
    })
  )
});

// Legacy Departments
export const saveLegacyDepartmentsSchema = z.object({
  departments: z.array(z.any()).optional(),
  orgTree: z.any().optional()
}).refine(data => data.departments || data.orgTree, {
  message: 'Either departments array or orgTree is required'
});

// Institutional Org Tree
export const saveOrgTreeSchema = z.object({
  tree: z.record(z.any(), z.any()) // Allow any object for the full tree
});

// Departments
export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  routingStrategy: z.string().optional(),
  isDelegated: z.boolean().optional()
});

export const departmentsSnapshotSchema = z.object({
  departments: z.array(z.any())
});

// Teams
export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  departmentId: z.number().int().positive('Department ID must be a positive integer')
});

// Users
export const assignUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  departmentId: z.number().int().positive().optional().nullable(),
  teamId: z.number().int().positive().optional().nullable(),
  roleId: z.number().int().positive().optional().nullable()
});

// UI Layout Engine Assignment
export const assignLayoutSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  interfaceId: z.number().int().positive('Interface ID is required'),
  interfaceConfig: z.record(z.string(), z.any()).optional()
});
