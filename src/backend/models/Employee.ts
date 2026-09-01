// src/backend/models/Employee.ts

/**
 * Employee entity representing a staff member within the hierarchical organization.
 * Used by the StaffHierarchy component and related backend services.
 */
export interface Employee {
  /** Primary key – UUID */
  id: string;

  /** Full name of the employee (Arabic/English). */
  name: string;

  /** Role within the organization (e.g., OPERATIONAL_MANAGER, SECTION_HEAD, TEAM_LEAD, ENGINEER). */
  role: string;

  /** Optional reference to the department this employee belongs to. */
  departmentId?: string;

  /** Optional reference to the team (sub‑department) this employee belongs to. */
  teamId?: string;

  /** Direct manager/superior (self‑referencing). */
  managerId?: string;

  /** URL to the avatar image (for UI side‑drawer). */
  avatarUrl?: string;

  /** Record timestamps. */
  createdAt: string;
  updatedAt: string;
}
