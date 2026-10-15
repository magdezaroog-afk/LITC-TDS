import { z } from 'zod';

// ─── Recursive Org Node Schema ────────────────────────────────────────────────
// يُعرِّف بنية كل عقدة في الشجرة المؤسسية بشكل صارم
const orgNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id:       z.string().min(1, 'Node ID is required'),
    name:     z.string().min(1, 'Node name is required'),
    type:     z.string().min(1, 'Node type is required'),
    children: z.array(orgNodeSchema).optional().default([]),
    icon:        z.string().optional(),
    description: z.string().optional(),
    color:       z.string().optional(),
    shape:       z.string().optional(),
  }).passthrough()
);

// ─── Buildings ────────────────────────────────────────────────────────────────
export const saveBuildingsSchema = z.object({
  buildings: z.array(
    z.object({
      id:       z.union([z.number(), z.string()]).optional(),
      globalId: z.string().optional(),
      name:     z.string().min(1, 'Name is required'),
      type:     z.string().optional().default('BUILDING')
    }).passthrough()
  ).min(0)
});

// ─── Legacy Departments ───────────────────────────────────────────────────────
export const saveLegacyDepartmentsSchema = z.object({
  departments: z.array(
    z.object({
      id:              z.union([z.number(), z.string()]).optional(),
      name:            z.string().min(1),
      routingStrategy: z.string().optional(),
      isDelegated:     z.boolean().optional(),
      teams:           z.array(z.object({
        id:   z.union([z.number(), z.string()]).optional(),
        name: z.string().min(1)
      })).optional().default([])
    })
  ).optional(),
  orgTree: orgNodeSchema.optional()
}).refine(data => data.departments || data.orgTree, {
  message: 'Either departments array or orgTree is required'
});

// ─── Institutional Org Tree ───────────────────────────────────────────────────
export const saveOrgTreeSchema = z.object({
  tree: orgNodeSchema
});

// ─── Departments ──────────────────────────────────────────────────────────────
export const departmentSchema = z.object({
  name:            z.string().min(1, 'Department name is required'),
  routingStrategy: z.string().optional(),
  isDelegated:     z.boolean().optional()
});

export const departmentsSnapshotSchema = z.object({
  departments: z.array(z.any())
});

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teamSchema = z.object({
  name:         z.string().min(1, 'Team name is required'),
  departmentId: z.number().int().positive('Department ID must be a positive integer')
});

// ─── Users ────────────────────────────────────────────────────────────────────
export const assignUserSchema = z.object({
  userId:       z.union([z.string(), z.number()]),
  departmentId: z.union([z.string(), z.number()]).optional().nullable(),
  teamId:       z.union([z.string(), z.number()]).optional().nullable(),
  roleId:       z.union([z.string(), z.number()]).optional().nullable()
});

// ─── UI Layout Engine ─────────────────────────────────────────────────────────
export const assignLayoutSchema = z.object({
  userId:          z.string().min(1, 'User ID is required'),
  interfaceId:     z.number().int().positive('Interface ID is required'),
  interfaceConfig: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});
