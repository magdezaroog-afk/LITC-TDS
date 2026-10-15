import React, { useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Core Roles & Org Structure Interfaces ───
export type CoreRole = 'END_USER' | 'OPERATIONAL_USER' | 'TEAM_LEADER' | 'SECTION_HEAD' | 'OPERATIONAL_MANAGER' | 'SYSTEM_ADMIN' | 'IT_ADMIN';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: CoreRole;
  positionTitle?: string;
  departmentId?: string;
  divisionId?: string;
  teamId?: string;
  assignedSubmissionTemplateId?: string;
}

export interface GovernanceSettings {
  isLockedByParent?: boolean; // حق الفيتو ومنع التعديل من المستويات الأدنى
  inheritedInterfaceId?: string; // المعرف الموروث من المستوى الأعلى
  customInterfaceId?: string; // المعرف المخصص في حال الـ Override
}

export interface OrgTeam {
  id: string;
  name: string;
  leaderId?: string;
  assignedInterfaceId?: string;
  governance?: GovernanceSettings;
  users: OrgUser[];
  expanded?: boolean;
}

export interface OrgDivision {
  id: string;
  name: string;
  headId?: string;
  assignedInterfaceId?: string;
  governance?: GovernanceSettings;
  teams: OrgTeam[];
  unassignedUsers: OrgUser[];
  isIndependent: boolean;
  expanded?: boolean;
}

export interface OrgDepartment {
  id: string;
  name: string;
  managerId?: string;
  assignedInterfaceId?: string;
  governance?: GovernanceSettings;
  divisions: OrgDivision[];
  teams?: OrgTeam[];
  unassignedUsers?: OrgUser[];
  expanded?: boolean;
}

// ─── Mock Data for Interfaces (UI Engine) ───
export interface AvailableUI {
  id: string;
  name: string;
  roleType: CoreRole;
}
const mockAvailableInterfaces: AvailableUI[] = [
  { id: 'ui_dept_mgr', name: 'لوحة التحكم المركزية للإدارة', roleType: 'OPERATIONAL_MANAGER' },
  { id: 'ui_div_head', name: 'واجهة رؤساء الأقسام', roleType: 'OPERATIONAL_MANAGER' },
  { id: 'ui_team_lead', name: 'شاشة قادة الفرق', roleType: 'OPERATIONAL_USER' },
];

// ─── Governance Resolution Engine ───
export interface ResolutionResult {
  effectiveInterfaceId: string | undefined;
  isLocked: boolean;
  source: 'LOCAL' | 'PARENT' | 'GRANDPARENT';
}

export const resolveEffectiveSettings = (
  node: any, 
  parent?: any, 
  grandparent?: any 
): ResolutionResult => {
  // 1. Strict Override (Veto) from Top (Grandparent)
  if (grandparent && grandparent.governance?.isLockedByParent) {
    const id = grandparent.governance.customInterfaceId || grandparent.assignedInterfaceId;
    if (id) return { effectiveInterfaceId: id, isLocked: true, source: 'GRANDPARENT' };
  }
  
  // 2. Strict Override (Veto) from Parent
  if (parent && parent.governance?.isLockedByParent) {
    const id = parent.governance.customInterfaceId || parent.assignedInterfaceId;
    if (id) return { effectiveInterfaceId: id, isLocked: true, source: 'PARENT' };
    
    // Fallback if parent is locked but empty (inherits up)
    const fallbackId = grandparent?.governance?.customInterfaceId || grandparent?.assignedInterfaceId;
    if (fallbackId) return { effectiveInterfaceId: fallbackId, isLocked: true, source: 'GRANDPARENT' };
  }

  // 3. No Veto. Local Custom takes precedence
  const localId = node.governance?.customInterfaceId || node.assignedInterfaceId;
  if (localId) {
    return { effectiveInterfaceId: localId, isLocked: false, source: 'LOCAL' };
  }

  // 4. Normal Cascading (Inherit upwards if local is empty)
  const parentId = parent?.governance?.customInterfaceId || parent?.assignedInterfaceId;
  if (parentId) return { effectiveInterfaceId: parentId, isLocked: false, source: 'PARENT' };

  const gpId = grandparent?.governance?.customInterfaceId || grandparent?.assignedInterfaceId;
  return { effectiveInterfaceId: gpId, isLocked: false, source: 'GRANDPARENT' };
};

import { AdminAPI } from '../../../services/admin.api';
import { OrgNode } from './orgStructureTypes';

// ─── نوع عقدة الشجرة المؤسسية المتاحة (Institutional Node) ───
interface InstitutionalNode { id: string; name: string; type: string; }
interface InstitutionalNodes { departments: InstitutionalNode[]; divisions: InstitutionalNode[]; teams: InstitutionalNode[]; }

export const OperationalStructureTab: React.FC<{ orgTree: OrgNode }> = ({ orgTree }) => {
  const [operationalUsers, setOperationalUsers] = useState<OrgUser[]>([]);
  const [departments, setDepartments] = useState<OrgDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // عقد الشجرة المؤسسية المتاحة محملة مباشرةً من الباكند
  const [institutionalNodes, setInstitutionalNodes] = useState<InstitutionalNodes>({ departments: [], divisions: [], teams: [] });

  // Ref: tracks if departments were just loaded from API vs. modified by user action.
  // Prevents saving snapshot immediately after load (which would overwrite user-modified data).
  const isDeptLoadedFromAPI = React.useRef(false);
  // Ref for auto-save debounce timer
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    Promise.all([
      AdminAPI.getUserPool().catch(() => ({ users: [] })),
      AdminAPI.getOperationalDepartments().catch(() => ({ departments: [] })),
      AdminAPI.getInstitutionalNodes().catch(() => ({ departments: [], divisions: [], teams: [] }))
    ]).then(([poolRes, deptRes, nodesRes]) => {
      // ─── User Pool ───
      if (poolRes.users && Array.isArray(poolRes.users)) {
        const mappedUsers: OrgUser[] = poolRes.users
          .filter((u: any) => u.role?.name !== 'System_Admin' && u.role?.name !== 'IT_Admin' && u.username !== 'admin')
          .map((u: any) => ({
            id: String(u.id),
            name: u.fullName || u.username,
            email: u.email,
            employeeId: `EMP-${u.id}`,
            role: (u.role?.name === 'Employee' ? 'OPERATIONAL_USER' : (u.role?.name || 'OPERATIONAL_USER')) as CoreRole,
            departmentId: u.departmentId ? String(u.departmentId) : undefined,
            positionTitle: u.jobTitle
          }));
        setOperationalUsers(mappedUsers);
      } else {
        setOperationalUsers([]);
      }

      // ─── Operational Departments ───
      if (deptRes.departments && Array.isArray(deptRes.departments) && deptRes.departments.length > 0) {
        const sanitized = deptRes.departments.map((dept: any) => ({
          ...dept,
          divisions: (dept.divisions || []).map((div: any) => ({
            ...div,
            teams: div.teams || [],
            unassignedUsers: div.unassignedUsers || [],
            users: div.users || []
          })),
          unassignedUsers: dept.unassignedUsers || [],
          teams: dept.teams || []
        }));
        // Mark as API-loaded so the auto-save effect skips this specific state change
        isDeptLoadedFromAPI.current = true;
        setDepartments(sanitized);
      } else {
        setDepartments([]);
      }

      // ─── Institutional Nodes (from DB, not from prop) ───
      if (nodesRes && (nodesRes.departments || nodesRes.divisions || nodesRes.teams)) {
        setInstitutionalNodes({
          departments: nodesRes.departments || [],
          divisions: nodesRes.divisions || [],
          teams: nodesRes.teams || []
        });
      }
    }).finally(() => setIsLoading(false));
  }, []);

  // Auto-save snapshot ONLY when departments are modified by the user — NOT on initial API load.
  // Uses a debounce (1.5s) to avoid rapid consecutive saves during drag/drop or rapid edits.
  React.useEffect(() => {
    if (isLoading) return;
    if (isDeptLoadedFromAPI.current) {
      isDeptLoadedFromAPI.current = false;
      return;
    }
    if (departments.length > 0) {
      // Cancel any pending save
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      // Schedule save with debounce to avoid race conditions
      autoSaveTimer.current = setTimeout(() => {
        AdminAPI.saveDepartmentsSnapshot(departments).catch(err =>
          console.error('[OperationalStructure] Auto-save snapshot failed:', err)
        );
      }, 1500);
    }
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [departments, isLoading]);
  
  // --- Org Structure Advanced V2 States ---
  const [poolSearchQuery, setPoolSearchQuery] = useState<string>('');
  const [poolFilterStatus, setPoolFilterStatus] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [selectedPoolUsers, setSelectedPoolUsers] = useState<string[]>([]);
  const [profileModalUser, setProfileModalUser] = useState<any>(null);

  const [filterAssignedDeptId, setFilterAssignedDeptId] = useState<string>('');
  const [filterAssignedDivId, setFilterAssignedDivId] = useState<string>('');
  const [filterAssignedTeamId, setFilterAssignedTeamId] = useState<string>('');

  const [profileEditData, setProfileEditData] = useState<any>({});
  const handleOpenProfile = (u: any) => {
     // Legacy profile logic removed
  };

  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState<boolean>(false);
  
  // --- Universal Edit Entity Modal States ---
  const [addEntityModalOpen, setAddEntityModalOpen] = useState<{ type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', parentId?: string, parentName?: string, availableNodes: any[] } | null>(null);
  const [addEntitySelectedNode, setAddEntitySelectedNode] = useState<any>(null);
  const [selectedAddDivisionIds, setSelectedAddDivisionIds] = useState<string[]>([]);
  const [addEntityCategoryFilter, setAddEntityCategoryFilter] = useState<'ALL' | 'إدارة عليا' | 'إدارة' | 'مكتب'>('ALL');
  const [addEntityCascadeMode, setAddEntityCascadeMode] = useState<'ENTITY_ONLY' | 'WITH_CASCADE'>('WITH_CASCADE');
  const [selectedCascadeDivisionIds, setSelectedCascadeDivisionIds] = useState<string[]>([]);
  const [selectedCascadeTeamIds, setSelectedCascadeTeamIds] = useState<string[]>([]);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editEntityType, setEditEntityType] = useState<'DEPARTMENT' | 'DIVISION' | 'TEAM' | null>(null);
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [editEntityName, setEditEntityName] = useState<string>('');
  const [editEntityLeaderId, setEditEntityLeaderId] = useState<string>('');
  const [editEntityUiId, setEditEntityUiId] = useState<string>('');
  const [editResolution, setEditResolution] = useState<ResolutionResult | null>(null);
  const [availableUIs, setAvailableUIs] = useState<AvailableUI[]>(mockAvailableInterfaces);
  
  // Advanced Dropdown & Warning States
  const [editEntityLeaderSearchTerm, setEditEntityLeaderSearchTerm] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [pendingReassignment, setPendingReassignment] = useState<{ userId: string, oldRoleName: string, newRoleName: string } | null>(null);

  // --- Advanced Delete Team States ---
  const [deleteTeamModalOpen, setDeleteTeamModalOpen] = useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);
  const [divisionOfTeamToDelete, setDivisionOfTeamToDelete] = useState<any>(null);
  const [deleteTeamAction, setDeleteTeamAction] = useState<'UNASSIGN' | 'MOVE_TO_DIVISION' | 'MERGE'>('MOVE_TO_DIVISION');
  const [deleteTeamTargetId, setDeleteTeamTargetId] = useState<string>('');

  // --- Universal Delete Confirmation Modal State ---
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string, name: string } | null>(null);
// --- Advanced Universal Assignment States ---
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictUsersList, setConflictUsersList] = useState<OrgUser[]>([]);
  
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState<boolean>(false);
  const [bulkAssignUsers, setBulkAssignUsers] = useState<string[]>([]);
  
  const [singleMoveModalOpen, setSingleMoveModalOpen] = useState<boolean>(false);
  const [singleMoveUser, setSingleMoveUser] = useState<OrgUser | null>(null);

  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [targetDivId, setTargetDivId] = useState<string>('');
  const [targetTeamId, setTargetTeamId] = useState<string>('');

  // --- Dedicated Team Assignment Modal States ---
  const [teamAssignTarget, setTeamAssignTarget] = useState<{
    dept: OrgDepartment;
    div: OrgDivision;
    team: OrgTeam;
  } | null>(null);
  const [selectedTeamCandidateIds, setSelectedTeamCandidateIds] = useState<string[]>([]);
  const [teamCandidateSearch, setTeamCandidateSearch] = useState<string>('');
  const [teamAssignPoolSource, setTeamAssignPoolSource] = useState<'DIVISION' | 'DEPARTMENT'>('DIVISION');
  const [teamAssignSuccessToast, setTeamAssignSuccessToast] = useState<string | null>(null);

  // --- Universal User Assignment Resolver ---
  const getUserAssignmentInfo = React.useCallback((user: OrgUser) => {
    for (const dept of departments) {
      if (dept.managerId && String(dept.managerId) === String(user.id)) {
        return { isAssigned: true, text: `مدير: ${dept.name}`, role: 'مسؤول تشغيلي', deptId: String(dept.id), divId: '', teamId: '' };
      }
      for (const div of dept.divisions || []) {
        if (div.headId && String(div.headId) === String(user.id)) {
          return { isAssigned: true, text: `رئيس قسم: ${dept.name} - ${div.name}`, role: 'رئيس قسم', deptId: String(dept.id), divId: String(div.id), teamId: '' };
        }
        for (const team of div.teams || []) {
          if (team.leaderId && String(team.leaderId) === String(user.id)) {
            return { isAssigned: true, text: `قائد فريق: ${dept.name} - ${team.name}`, role: 'رئيس فريق', deptId: String(dept.id), divId: String(div.id), teamId: String(team.id) };
          }
          if ((team.users || []).some((u: any) => String(u.id) === String(user.id))) {
            return { isAssigned: true, text: `${dept.name} - ${div.name} (${team.name})`, role: 'عضو فريق', deptId: String(dept.id), divId: String(div.id), teamId: String(team.id) };
          }
        }
        if ((div.unassignedUsers || []).some((u: any) => String(u.id) === String(user.id))) {
          return { isAssigned: true, text: `${dept.name} - ${div.name}`, role: 'عضو قسم', deptId: String(dept.id), divId: String(div.id), teamId: '' };
        }
      }
      if ((dept.unassignedUsers || []).some((u: any) => String(u.id) === String(user.id))) {
        return { isAssigned: true, text: `${dept.name}`, role: 'كادر الإدارة', deptId: String(dept.id), divId: '', teamId: '' };
      }
      if (user.departmentId && String(user.departmentId) === String(dept.id)) {
        if (user.divisionId) {
          const div = dept.divisions?.find(dv => String(dv.id) === String(user.divisionId));
          return { isAssigned: true, text: `${dept.name} - ${div?.name || ''}`, role: 'مستخدم تشغيلي', deptId: String(dept.id), divId: String(div?.id || ''), teamId: '' };
        }
        return { isAssigned: true, text: `${dept.name}`, role: 'مستخدم تشغيلي', deptId: String(dept.id), divId: '', teamId: '' };
      }
    }

    if (user.departmentId) {
      const dept = departments.find(d => String(d.id) === String(user.departmentId));
      return { isAssigned: true, text: dept?.name || `إدارة #${user.departmentId}`, role: 'مستخدم تشغيلي', deptId: String(user.departmentId), divId: '', teamId: '' };
    }

    return { isAssigned: false, text: 'غير منسب', role: 'مستخدم تشغيلي', deptId: '', divId: '', teamId: '' };
  }, [departments]);

  // --- Computed Pool Data ---
  const filteredPool = operationalUsers.filter(u => {
    if (poolSearchQuery.trim() !== '') {
      const q = poolSearchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    const info = getUserAssignmentInfo(u);
    const isAssigned = info.isAssigned;
    if (poolFilterStatus === 'ASSIGNED' && !isAssigned) return false;
    if (poolFilterStatus === 'UNASSIGNED' && isAssigned) return false;

    let matchesHierarchy = true;
    if (poolFilterStatus === 'ASSIGNED') {
       if (filterAssignedDeptId && String(info.deptId) !== String(filterAssignedDeptId)) matchesHierarchy = false;
       if (filterAssignedDivId && String(info.divId) !== String(filterAssignedDivId)) matchesHierarchy = false;
       if (filterAssignedTeamId && String(info.teamId) !== String(filterAssignedTeamId)) matchesHierarchy = false;
    }

    return matchesHierarchy;
  });

  // --- Handlers ---
  const handleOpenEditModal = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', entity: any, parent?: any, grandparent?: any) => {
    setEditEntityType(type);
    setEditEntityId(entity.id);
    setEditEntityName(entity.name);
    
    const leaderId = entity.managerId || entity.headId || entity.leaderId || '';
    setEditEntityLeaderId(leaderId);
    setEditEntityUiId(entity.assignedInterfaceId || '');
    setEditResolution(resolveEffectiveSettings(entity, parent, grandparent));
    
    setEditEntityLeaderSearchTerm('');
    if (leaderId) {
      const u = operationalUsers.find(x => x.id === leaderId);
      if (u) setEditEntityLeaderSearchTerm(u.name);
    }
    setDropdownOpen(false);
    setPendingReassignment(null);
    setEditModalOpen(true);
  };

  const executeSaveEntity = (leaderIdToSave: string) => {
    setDepartments(prev => {
      // Deep clone to strip old leader
      const next = JSON.parse(JSON.stringify(prev)) as OrgDepartment[];
      
      // Clear old leader if it exists somewhere else
      if (leaderIdToSave) {
        next.forEach(d => {
          if (d.managerId === leaderIdToSave && (editEntityType !== 'DEPARTMENT' || d.id !== editEntityId)) d.managerId = undefined;
          if (d.unassignedUsers) d.unassignedUsers = d.unassignedUsers.filter(u => u.id !== leaderIdToSave);
          d.divisions.forEach(dv => {
            if (dv.headId === leaderIdToSave && (editEntityType !== 'DIVISION' || dv.id !== editEntityId)) dv.headId = undefined;
            dv.unassignedUsers = dv.unassignedUsers.filter(u => u.id !== leaderIdToSave);
            dv.teams.forEach(t => {
              if (t.leaderId === leaderIdToSave && (editEntityType !== 'TEAM' || t.id !== editEntityId)) t.leaderId = undefined;
              t.users = t.users.filter(u => u.id !== leaderIdToSave);
            });
          });
        });
      }

      // Now set it in the new place
      let parentDeptId: string | undefined;
      const updated = next.map(dept => {
        if (editEntityType === 'DEPARTMENT' && dept.id === editEntityId) {
          parentDeptId = String(dept.id);
          return { ...dept, name: editEntityName, managerId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
        }
        if (editEntityType === 'DIVISION' || editEntityType === 'TEAM') {
          return {
            ...dept,
            divisions: dept.divisions.map(div => {
              if (editEntityType === 'DIVISION' && div.id === editEntityId) {
                parentDeptId = String(dept.id);
                return { ...div, name: editEntityName, headId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
              }
              if (editEntityType === 'TEAM') {
                return {
                  ...div,
                  teams: div.teams.map(team => {
                    if (team.id === editEntityId) {
                      parentDeptId = String(dept.id);
                      return { ...team, name: editEntityName, leaderId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
                    }
                    return team;
                  })
                };
              }
              return div;
            })
          };
        }
        return dept;
      });

      // Update leader in DB and local state
      if (leaderIdToSave) {
        const newRoleId = editEntityType === 'DEPARTMENT' ? 23 : (editEntityType === 'DIVISION' ? 24 : 25);
        const newRoleName = editEntityType === 'DEPARTMENT' ? 'OPERATIONAL_MANAGER' : (editEntityType === 'DIVISION' ? 'SECTION_HEAD' : 'TEAM_LEADER');
        
        setOperationalUsers(users => users.map(u => {
          if (String(u.id) === String(leaderIdToSave)) {
            return {
              ...u,
              role: newRoleName as CoreRole,
              departmentId: parentDeptId || u.departmentId
            };
          }
          return u;
        }));

        const numDept = parentDeptId && !isNaN(Number(parentDeptId)) ? Number(parentDeptId) : undefined;
        AdminAPI.assignUser(parseInt(leaderIdToSave), numDept || parentDeptId as any, undefined, newRoleId).catch(e => console.error(e));
      }

      return updated;
    });
    setPendingReassignment(null);
    setEditModalOpen(false);
  };

  const handleSaveEntity = () => {
    if (!editEntityLeaderId) {
      executeSaveEntity('');
      return;
    }

    // Check if the chosen leader is already holding a role somewhere else
    let conflictRoleName = '';
    
    departments.forEach(d => {
      if (d.managerId === editEntityLeaderId && (editEntityType !== 'DEPARTMENT' || d.id !== editEntityId)) {
        conflictRoleName = `مدير إدارة التابعة لـ (${d.name})`;
      }
      d.divisions.forEach(dv => {
        if (dv.headId === editEntityLeaderId && (editEntityType !== 'DIVISION' || dv.id !== editEntityId)) {
          conflictRoleName = `رئيس قسم التابعة لـ (${dv.name})`;
        }
        if (dv.unassignedUsers.some(u => u.id === editEntityLeaderId) && conflictRoleName === '') {
           // Might be just unassigned in division
           const uRole = dv.unassignedUsers.find(u => u.id === editEntityLeaderId)?.role;
           if (uRole === 'OPERATIONAL_USER') conflictRoleName = `عضو فريق غير منسب التابعة لـ (${dv.name})`;
        }
        dv.teams.forEach(t => {
          if (t.leaderId === editEntityLeaderId && (editEntityType !== 'TEAM' || t.id !== editEntityId)) {
            conflictRoleName = `قائد فريق التابعة لـ (${t.name})`;
          }
          if (t.users.some(u => u.id === editEntityLeaderId) && conflictRoleName === '') {
             conflictRoleName = `عضو فريق التابعة لـ (${t.name})`;
          }
        });
      });
    });

    if (conflictRoleName) {
      const targetRole = editEntityType === 'DEPARTMENT' ? 'مدير إدارة' : editEntityType === 'DIVISION' ? 'رئيس قسم' : 'قائد فريق';
      setPendingReassignment({
        userId: editEntityLeaderId,
        oldRoleName: conflictRoleName,
        newRoleName: `${targetRole} (${editEntityName})`
      });
    } else {
      executeSaveEntity(editEntityLeaderId);
    }
  };

  const handleCreateNewUI = () => {
    const newUiId = 'ui_custom_' + Date.now();
    const roleTypeMap: Record<string, CoreRole> = {
      'DEPARTMENT': 'OPERATIONAL_MANAGER',
      'DIVISION': 'OPERATIONAL_MANAGER',
      'TEAM': 'OPERATIONAL_USER'
    };
    
    setAvailableUIs(prev => [...prev, {
      id: newUiId,
      name: `واجهة ${editEntityName} (جديدة)`,
      roleType: roleTypeMap[editEntityType!] || 'OPERATIONAL_USER'
    }]);
    setEditEntityUiId(newUiId);
    
    // Cross-tab Routing Event to move to UILayoutEngineTab using DOM manipulation (respecting the strict no-touch shell rule)
    setEditModalOpen(false);
    
    // Slight delay to ensure state updates
    setTimeout(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      // Find the tab that contains "UI Layout Engine"
      const uiTab = allDivs.find(div => div.textContent && div.textContent.includes('UI Layout Engine') && div.onclick == null && div.style.cursor === 'pointer');
      
      if (uiTab) {
        (uiTab as HTMLElement).click();
      } else {
        // Fallback broad search
        const fallbackTab = allDivs.find(div => div.textContent && div.textContent.includes('UI Layout Engine'));
        if (fallbackTab) (fallbackTab as HTMLElement).click();
      }
    }, 100);
  };



  const handleOpenDeleteTeamModal = (team: any, division: any) => {
    if (team.users.length === 0 && !team.leaderId) {
       handleDeleteEntity('TEAM', team.id, team.name);
       return;
    }
    setTeamToDelete(team);
    setDivisionOfTeamToDelete(division);
    setDeleteTeamAction('MOVE_TO_DIVISION');
    setDeleteTeamTargetId('');
    setDeleteTeamModalOpen(true);
  };


  const executeUniversalMove = (usersToMoveIds: string[], action: 'UNASSIGN' | 'ASSIGN', destDeptId?: string, destDivId?: string, destTeamId?: string) => {
     setDepartments(prev => {
       let next = JSON.parse(JSON.stringify(prev)) as OrgDepartment[];
       
       next.forEach(dept => {
          if (dept.managerId && usersToMoveIds.includes(dept.managerId)) dept.managerId = undefined;
          if (dept.unassignedUsers) {
             dept.unassignedUsers = dept.unassignedUsers.filter((u: any) => !usersToMoveIds.includes(u.id));
          }
          dept.divisions.forEach(div => {
             if (div.headId && usersToMoveIds.includes(div.headId)) div.headId = undefined;
             div.unassignedUsers = div.unassignedUsers.filter((u: any) => !usersToMoveIds.includes(u.id));
             div.teams.forEach(team => {
                if (team.leaderId && usersToMoveIds.includes(team.leaderId)) team.leaderId = undefined;
                team.users = team.users.filter((u: any) => !usersToMoveIds.includes(u.id));
             });
          });
       });

       if (action === 'ASSIGN' && destDeptId) {
          const usersObjs = operationalUsers.filter(u => usersToMoveIds.includes(u.id)).map(u => ({
            ...u,
            role: 'OPERATIONAL_USER' as CoreRole,
            departmentId: destDeptId,
            divisionId: destDivId || undefined,
            teamId: destTeamId || undefined
          }));
          const dept = next.find(d => String(d.id) === String(destDeptId));
          if (dept) {
             if (destDivId) {
                const div = dept.divisions.find(d => String(d.id) === String(destDivId));
                if (div) {
                   if (destTeamId) {
                      const team = div.teams.find(t => String(t.id) === String(destTeamId));
                      if (team) team.users.push(...usersObjs);
                   } else {
                      div.unassignedUsers.push(...usersObjs);
                   }
                }
             } else {
                if (!dept.unassignedUsers) dept.unassignedUsers = [];
                dept.unassignedUsers.push(...usersObjs);
             }
          }
       }
       return next;
     });

     setOperationalUsers(prev => prev.map(u => {
        if (usersToMoveIds.includes(u.id)) {
           if (action === 'UNASSIGN') {
              return { ...u, role: 'OPERATIONAL_USER', departmentId: undefined, divisionId: undefined, teamId: undefined, positionTitle: undefined };
           } else {
              return { ...u, role: 'OPERATIONAL_USER', departmentId: destDeptId, divisionId: destDivId || undefined, teamId: destTeamId || undefined, positionTitle: undefined };
           }
        }
        return u;
     }));

     // Persist in backend DB for each user
     usersToMoveIds.forEach(uid => {
        if (action === 'UNASSIGN') {
           AdminAPI.unassignUser(parseInt(uid)).catch(err => console.error('Failed to unassign user in DB', err));
        } else {
           const numDept = destDeptId && !isNaN(Number(destDeptId)) ? Number(destDeptId) : undefined;
           const numTeam = destTeamId && !isNaN(Number(destTeamId)) ? Number(destTeamId) : undefined;
           AdminAPI.assignUser(parseInt(uid), numDept || destDeptId as any, numTeam, 26).catch(err => console.error('Failed to assign user in DB', err));
        }
     });
  };

  const handleBulkAssignClick = () => {
     const conflicts = operationalUsers.filter(u => selectedPoolUsers.includes(u.id) && !!u.departmentId);
     if (conflicts.length > 0) {
        setConflictUsersList(conflicts);
        setConflictModalOpen(true);
     } else {
        setBulkAssignUsers(selectedPoolUsers);
        setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
        setBulkAssignModalOpen(true);
     }
  };

  const handleBulkUnassignClick = () => {
     if (window.confirm('هل أنت متأكد من إرجاع المحددين كمستخدمين عاديين وتجريدهم من انتمائهم الحالي؟')) {
        executeUniversalMove(selectedPoolUsers, 'UNASSIGN');
        setSelectedPoolUsers([]);
     }
  };

  const executeAdvancedDeleteTeam = () => {
    const usersToMove: any[] = [...teamToDelete.users];
    
    let leaderObj = null;
    if (teamToDelete.leaderId) {
       leaderObj = operationalUsers.find(u => u.id === teamToDelete.leaderId);
    }

    setDepartments(prev => {
      return prev.map(dept => {
        return {
          ...dept,
          divisions: dept.divisions.map(div => {
            if (div.id === divisionOfTeamToDelete.id) {
               const newDiv = { ...div };
               
               if (deleteTeamAction === 'UNASSIGN') {
                  // They become unassigned globally, removed from structure
               } 
               else if (deleteTeamAction === 'MOVE_TO_DIVISION') {
                  newDiv.unassignedUsers = [...newDiv.unassignedUsers, ...usersToMove.map(u => ({...u, role: 'OPERATIONAL_USER', teamId: undefined}))];
                  if (leaderObj && !newDiv.unassignedUsers.some((u: any) => u.id === leaderObj.id)) {
                     newDiv.unassignedUsers.push({...leaderObj, role: 'OPERATIONAL_USER', teamId: undefined});
                  }
               }
               else if (deleteTeamAction === 'MERGE') {
                  newDiv.teams = newDiv.teams.map((t: any) => {
                     if (t.id === deleteTeamTargetId) {
                        const tUsers = [...t.users, ...usersToMove.map(u => ({...u, teamId: t.id}))];
                        if (leaderObj && !tUsers.some((u:any) => u.id === leaderObj.id)) {
                           tUsers.push({...leaderObj, role: 'OPERATIONAL_USER', teamId: t.id});
                        }
                        return { ...t, users: tUsers };
                     }
                     return t;
                  });
               }
               newDiv.teams = newDiv.teams.filter((t: any) => t.id !== teamToDelete.id);
               return newDiv;
            }
            return div;
          })
        };
      });
    });

    setOperationalUsers(prev => prev.map(u => {
      const isMember = usersToMove.some((mu: any) => mu.id === u.id);
      const isLeader = leaderObj && leaderObj.id === u.id;
      
      if (isMember || isLeader) {
         if (deleteTeamAction === 'UNASSIGN') {
            return { ...u, departmentId: undefined, divisionId: undefined, teamId: undefined, role: 'OPERATIONAL_USER', positionTitle: undefined };
         }
         if (deleteTeamAction === 'MOVE_TO_DIVISION') {
            return { ...u, teamId: undefined, role: 'OPERATIONAL_USER' };
         }
         if (deleteTeamAction === 'MERGE') {
            return { ...u, teamId: deleteTeamTargetId, role: 'OPERATIONAL_USER' };
         }
      }
      return u;
    }));

    setDeleteTeamModalOpen(false);
  };

  const handleDeleteEntity = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string, name: string) => {
    // فتح نافذة التأكيد الاحترافية بدلاً من نافذة المتصفح البدائية window.confirm
    setDeleteConfirmTarget({ type, id, name });
  };

  const executeDeleteEntity = async () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;
    setDeleteConfirmTarget(null);

    if (type === 'DEPARTMENT') {
      try {
        const numId = Number(id);
        if (!isNaN(numId)) {
          await AdminAPI.deleteOperationalDepartment(String(numId));
        }
      } catch (err) {
        console.error('Failed to soft delete department from backend:', err);
      }

      setDepartments(prev => {
        const updated = prev.filter(d => String(d.id) !== String(id));
        AdminAPI.saveDepartmentsSnapshot(updated).catch(e => console.error('Snapshot sync error:', e));
        return updated;
      });

      // Free any users assigned to this department to pool
      setOperationalUsers(prev => prev.map(u => {
        if (String(u.departmentId) === String(id)) {
          return { ...u, departmentId: undefined, divisionId: undefined, teamId: undefined, role: 'OPERATIONAL_USER', positionTitle: undefined };
        }
        return u;
      }));
      return;
    }

    setDepartments(prev => {
      const updated = prev.map(dept => {
        if (type === 'DIVISION') {
          return { ...dept, divisions: dept.divisions.filter(dv => String(dv.id) !== String(id)) };
        }
        if (type === 'TEAM') {
          return {
            ...dept,
            divisions: dept.divisions.map(div => ({
              ...div,
              teams: div.teams.filter(t => String(t.id) !== String(id))
            })),
            teams: (dept.teams || []).filter(t => String(t.id) !== String(id))
          };
        }
        return dept;
      });
      AdminAPI.saveDepartmentsSnapshot(updated).catch(e => console.error('Snapshot sync error:', e));
      return updated;
    });
  };

  const OA = {
    text: '#1D1D1F', textSub: '#6E6E73', textTer: '#AEAEB2',
    surface: '#FFFFFF', bg: '#F5F5F7', sep: 'rgba(0,0,0,0.08)', sepStr: 'rgba(0,0,0,0.12)',
    radius: '14px', radiusSm: '10px', shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
    blue: '#007AFF', green: '#34C759', red: '#FF3B30', amber: '#FF9500', indigo: '#5856D6', purple: '#AF52DE',
    font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
  };


  // ─── Institutional Node Lookup Helpers (Hierarchical binding to Institutional Tree) ───
  const findNodeInTree = (root: OrgNode | null | undefined, name: string): OrgNode | null => {
    if (!root) return null;
    const target = name.trim().toLowerCase();
    if (root.name && root.name.trim().toLowerCase() === target) return root;
    if (root.children && Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = findNodeInTree(child, name);
        if (found) return found;
      }
    }
    return null;
  };

  interface InstitutionalEntityOption {
    id: string;
    name: string;
    type: string;
    parentName?: string;
    childrenCount: number;
    subUnitsCount: number;
    children?: { id: string; name: string; type: string; children?: { id: string; name: string; type: string }[] }[];
  }

  const getEntityMeta = (type: string) => {
    switch (type) {
      case 'إدارة عليا':
        return {
          label: 'إدارة عليا',
          icon: '👑',
          color: '#6d28d9',
          bg: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.22)',
          badgeBg: '#f3e8ff'
        };
      case 'إدارة':
        return {
          label: 'إدارة تنفيذية',
          icon: '🏢',
          color: '#0284c7',
          bg: 'rgba(2, 132, 199, 0.08)',
          border: '1px solid rgba(2, 132, 199, 0.22)',
          badgeBg: '#e0f2fe'
        };
      case 'مكتب':
        return {
          label: 'مكتب مستقل',
          icon: '📑',
          color: '#d97706',
          bg: 'rgba(217, 119, 6, 0.08)',
          border: '1px solid rgba(217, 119, 6, 0.22)',
          badgeBg: '#fef3c7'
        };
      case 'قسم':
        return {
          label: 'قسم',
          icon: '📁',
          color: '#4f46e5',
          bg: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.22)',
          badgeBg: '#eef2ff'
        };
      case 'وحدة':
      case 'فريق':
      default:
        return {
          label: type || 'وحدة',
          icon: '👥',
          color: '#059669',
          bg: 'rgba(5, 150, 105, 0.08)',
          border: '1px solid rgba(5, 150, 105, 0.22)',
          badgeBg: '#ecfdf5'
        };
    }
  };

  const getAvailableDepartments = (): InstitutionalEntityOption[] => {
    const existingNames = departments.map(d => d.name.trim().toLowerCase());
    const DEPT_TYPES = ['إدارة', 'مكتب', 'إدارة عليا'];

    function extractNodes(node: OrgNode | null | undefined, parentName = ''): InstitutionalEntityOption[] {
      if (!node) return [];
      let list: InstitutionalEntityOption[] = [];
      const isCandidate = DEPT_TYPES.includes(node.type || '') && !existingNames.includes(node.name.trim().toLowerCase());

      const directChildren = (node.children || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || 'قسم',
        children: (c.children || []).map(s => ({
          id: s.id,
          name: s.name,
          type: s.type || 'وحدة'
        }))
      }));

      let totalUnits = 0;
      directChildren.forEach(c => {
        totalUnits += (c.children || []).length;
      });

      if (isCandidate) {
        list.push({
          id: node.id,
          name: node.name,
          type: node.type || 'إدارة',
          parentName: parentName || 'على قمة الهيكل المؤسسي',
          childrenCount: directChildren.length,
          subUnitsCount: totalUnits,
          children: directChildren
        });
      }

      if (node.children) {
        for (const child of node.children) {
          list = list.concat(extractNodes(child, node.name));
        }
      }
      return list;
    }

    return extractNodes(orgTree);
  };

  const getAvailableDivisions = (deptName: string): InstitutionalEntityOption[] => {
    const dept = departments.find(d => d.name.trim().toLowerCase() === deptName.trim().toLowerCase());
    const existingDivNames = dept ? dept.divisions.map(dv => dv.name.trim().toLowerCase()) : [];

    const deptNode = findNodeInTree(orgTree, deptName);
    if (!deptNode || !Array.isArray(deptNode.children)) return [];

    return deptNode.children
      .filter(c => c.name && !existingDivNames.includes(c.name.trim().toLowerCase()))
      .map(c => {
        const childUnits = (c.children || []).map(s => ({
          id: s.id,
          name: s.name,
          type: s.type || 'وحدة'
        }));
        return {
          id: c.id,
          name: c.name,
          type: c.type || 'قسم',
          parentName: deptName,
          childrenCount: childUnits.length,
          subUnitsCount: childUnits.length,
          children: childUnits
        };
      });
  };

  const getAvailableTeams = (divName: string): InstitutionalEntityOption[] => {
    let existingTeamNames: string[] = [];
    for (const dept of departments) {
      const div = dept.divisions.find(dv => dv.name.trim().toLowerCase() === divName.trim().toLowerCase());
      if (div) { existingTeamNames = (div.teams || []).map(t => t.name.trim().toLowerCase()); break; }
    }

    const divNode = findNodeInTree(orgTree, divName);
    if (!divNode || !Array.isArray(divNode.children)) return [];

    return divNode.children
      .filter(c => c.name && !existingTeamNames.includes(c.name.trim().toLowerCase()))
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || 'وحدة',
        parentName: divName,
        childrenCount: 0,
        subUnitsCount: 0
      }));
  };

  // ─── دوال استخراج التدرج الهرمي المتاح للاستيراد (Smart Cascade Extraction) ───
  interface CascadeDivision {
    id: string;
    name: string;
    type: string;
    teams: { id: string; name: string; type: string }[];
  }

  interface CascadeHierarchy {
    divisions: CascadeDivision[];
    teams?: { id: string; name: string; type: string }[];
  }

  const getCascadeHierarchyForNode = (nodeName: string, modalType: 'DEPARTMENT' | 'DIVISION' | 'TEAM'): CascadeHierarchy => {
    if (!nodeName) return { divisions: [], teams: [] };
    const instNode = findNodeInTree(orgTree, nodeName);
    if (!instNode || !instNode.children || instNode.children.length === 0) {
      return { divisions: [], teams: [] };
    }

    if (modalType === 'DEPARTMENT') {
      const divisions: CascadeDivision[] = [];

      for (const child of instNode.children) {
        const childTeams: { id: string; name: string; type: string }[] = [];
        if (child.children && Array.isArray(child.children)) {
          for (const sub of child.children) {
            childTeams.push({
              id: sub.id,
              name: sub.name,
              type: sub.type || 'وحدة'
            });
          }
        }

        divisions.push({
          id: child.id,
          name: child.name,
          type: child.type || 'قسم',
          teams: childTeams
        });
      }

      return { divisions };
    }

    if (modalType === 'DIVISION') {
      const teams = (instNode.children || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type || 'فريق'
      }));
      return { divisions: [], teams };
    }

    return { divisions: [], teams: [] };
  };

  const initCascadeForNode = (node: any, modalType: 'DEPARTMENT' | 'DIVISION' | 'TEAM') => {
    if (!node) {
      setSelectedCascadeDivisionIds([]);
      setSelectedCascadeTeamIds([]);
      setAddEntityCascadeMode('ENTITY_ONLY');
      return;
    }
    const hierarchy = getCascadeHierarchyForNode(node.name, modalType);
    const divIds = hierarchy.divisions.map(d => d.id);
    const teamIds: string[] = [];
    hierarchy.divisions.forEach(d => {
      d.teams?.forEach(t => teamIds.push(t.id));
    });
    if (modalType === 'DIVISION' && hierarchy.teams) {
      hierarchy.teams.forEach(t => teamIds.push(t.id));
    }

    setSelectedCascadeDivisionIds(divIds);
    setSelectedCascadeTeamIds(teamIds);
    setAddEntityCascadeMode(divIds.length > 0 || teamIds.length > 0 ? 'WITH_CASCADE' : 'ENTITY_ONLY');
  };

  const toggleCascadeDivision = (divId: string, divTeams: { id: string }[]) => {
    const isCurrentlySelected = selectedCascadeDivisionIds.includes(divId);
    if (isCurrentlySelected) {
      setSelectedCascadeDivisionIds(prev => prev.filter(id => id !== divId));
      const teamIdList = divTeams.map(t => t.id);
      setSelectedCascadeTeamIds(prev => prev.filter(id => !teamIdList.includes(id)));
    } else {
      setSelectedCascadeDivisionIds(prev => [...prev, divId]);
      const teamIdList = divTeams.map(t => t.id);
      setSelectedCascadeTeamIds(prev => Array.from(new Set([...prev, ...teamIdList])));
    }
  };

  const toggleCascadeTeam = (teamId: string, parentDivId: string) => {
    const isCurrentlySelected = selectedCascadeTeamIds.includes(teamId);
    if (isCurrentlySelected) {
      setSelectedCascadeTeamIds(prev => prev.filter(id => id !== teamId));
    } else {
      setSelectedCascadeTeamIds(prev => [...prev, teamId]);
      if (!selectedCascadeDivisionIds.includes(parentDivId)) {
        setSelectedCascadeDivisionIds(prev => [...prev, parentDivId]);
      }
    }
  };

  // ─── دوال التحديد المتعدد للأقسام المتاحة للإضافة ───
  const toggleSelectDivisionNode = (divNode: any) => {
    const isCurrentlySelected = selectedAddDivisionIds.includes(divNode.id);
    const hierarchy = getCascadeHierarchyForNode(divNode.name, 'DIVISION');
    const divTeamIds = (hierarchy.teams || []).map(t => t.id);

    if (isCurrentlySelected) {
      setSelectedAddDivisionIds(prev => prev.filter(id => id !== divNode.id));
      setSelectedCascadeTeamIds(prev => prev.filter(id => !divTeamIds.includes(id)));
    } else {
      setSelectedAddDivisionIds(prev => [...prev, divNode.id]);
      setSelectedCascadeTeamIds(prev => Array.from(new Set([...prev, ...divTeamIds])));
    }
  };

  const selectAllDivisionNodes = (nodes: any[]) => {
    const allDivIds = nodes.map(n => n.id);
    const allTeamIds: string[] = [];
    nodes.forEach(n => {
      const hierarchy = getCascadeHierarchyForNode(n.name, 'DIVISION');
      (hierarchy.teams || []).forEach(t => allTeamIds.push(t.id));
    });
    setSelectedAddDivisionIds(allDivIds);
    setSelectedCascadeTeamIds(allTeamIds);
  };

  const deselectAllDivisionNodes = () => {
    setSelectedAddDivisionIds([]);
    setSelectedCascadeTeamIds([]);
  };

  // لا وجود لأي إدخال حر: الاختيار من الهيكل المؤسسي حصراً
  const handleAddDepartment = () => {
    const availableNodes = getAvailableDepartments();
    const firstNode = availableNodes.length > 0 ? availableNodes[0] : null;
    setAddEntityCategoryFilter('ALL');
    setAddEntityModalOpen({ type: 'DEPARTMENT', availableNodes });
    setAddEntitySelectedNode(firstNode);
    initCascadeForNode(firstNode, 'DEPARTMENT');
  };

  const commitAddEntity = async () => {
    if (!addEntityModalOpen) return;
    
    // في حالة إضافة الأقسام، نعتمد على التحديد المتعدد selectedAddDivisionIds
    if (addEntityModalOpen.type === 'DIVISION' && addEntityModalOpen.parentId) {
      const deptId = addEntityModalOpen.parentId;
      const selectedDivNodes = addEntityModalOpen.availableNodes.filter(n => selectedAddDivisionIds.includes(n.id));

      if (selectedDivNodes.length === 0) {
        alert('يرجى تحديد قسم واحد على الأقل للإضافة');
        return;
      }

      const newDivisions: OrgDivision[] = [];
      let totalTeamsCreated = 0;

      for (const divNode of selectedDivNodes) {
        const subTeams: OrgTeam[] = [];
        if (addEntityCascadeMode === 'WITH_CASCADE') {
          const hierarchy = getCascadeHierarchyForNode(divNode.name, 'DIVISION');
          if (hierarchy.teams) {
            for (const teamNode of hierarchy.teams) {
              if (selectedCascadeTeamIds.includes(teamNode.id)) {
                subTeams.push({
                  id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  name: teamNode.name,
                  users: [],
                  expanded: true
                });
              }
            }
          }
        }
        totalTeamsCreated += subTeams.length;
        newDivisions.push({
          id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: divNode.name,
          isIndependent: false,
          teams: subTeams,
          unassignedUsers: [],
          expanded: true
        });
      }

      setDepartments(prev => {
        const updated = prev.map(d => {
          if (String(d.id) === String(deptId)) {
            return {
              ...d,
              divisions: [...d.divisions, ...newDivisions]
            };
          }
          return d;
        });
        AdminAPI.saveDepartmentsSnapshot(updated).catch(e => console.error('Snapshot sync error:', e));
        return updated;
      });

      const successMsg = selectedDivNodes.length === 1
        ? `تمت إضافة قسم "${selectedDivNodes[0].name}" بنجاح${totalTeamsCreated > 0 ? ` مع (${totalTeamsCreated}) وحدات` : ''}!`
        : `تمت إضافة (${selectedDivNodes.length}) أقسام بنجاح${totalTeamsCreated > 0 ? ` مع (${totalTeamsCreated}) وحدات` : ''}!`;

      setTeamAssignSuccessToast(successMsg);
      setAddEntityModalOpen(null);
      setAddEntitySelectedNode(null);
      setSelectedAddDivisionIds([]);
      return;
    }

    // الاسم يأتي دائماً من العقدة المحددة من الهيكل المؤسسي
    const chosenName = (addEntitySelectedNode?.name || '').trim();

    if (!chosenName) {
      alert('يرجى تحديد كيان من الهيكل المؤسسي أولاً');
      return;
    }
    
    if (addEntityModalOpen.type === 'DEPARTMENT') {
      try {
        const result = await AdminAPI.createOperationalDepartment(chosenName);
        const realId = result.department?.id ?? `dept_${Date.now()}`;

        // استيراد الأقسام والفرق المحددة وفق تدرج الإضافة
        const subDivisions: OrgDivision[] = [];
        if (addEntityCascadeMode === 'WITH_CASCADE') {
          const hierarchy = getCascadeHierarchyForNode(chosenName, 'DEPARTMENT');
          for (const divNode of hierarchy.divisions) {
            if (selectedCascadeDivisionIds.includes(divNode.id)) {
              const divTeams: OrgTeam[] = [];
              if (divNode.teams) {
                for (const teamNode of divNode.teams) {
                  if (selectedCascadeTeamIds.includes(teamNode.id)) {
                    divTeams.push({
                      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                      name: teamNode.name,
                      users: [],
                      expanded: true
                    });
                  }
                }
              }
              subDivisions.push({
                id: `div_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: divNode.name,
                isIndependent: false,
                teams: divTeams,
                unassignedUsers: [],
                expanded: true
              });
            }
          }
        }

        const newDept: OrgDepartment = {
          id: String(realId),
          name: chosenName,
          divisions: subDivisions,
          unassignedUsers: [],
          teams: [],
          expanded: true
        };

        const updated = [...departments, newDept];
        setDepartments(updated);
        await AdminAPI.saveDepartmentsSnapshot(updated);

        const totalDivs = subDivisions.length;
        const totalTeams = subDivisions.reduce((acc, d) => acc + (d.teams?.length || 0), 0);
        let successMsg = `تمت إضافة "${chosenName}" بنجاح!`;
        if (totalDivs > 0) {
          successMsg = `تمت إضافة "${chosenName}" بنجاح مع استيراد (${totalDivs}) أقسام و (${totalTeams}) وحدات!`;
        }
        setTeamAssignSuccessToast(successMsg);
      } catch (err: any) {
        alert(`فشل إنشاء الإدارة: ${err?.message || 'حدث خطأ'}`);
        return;
      }
    } else if (addEntityModalOpen.type === 'TEAM' && addEntityModalOpen.parentId) {
      const divId = addEntityModalOpen.parentId;
      let parentDeptId: number | undefined;
      for (const d of departments) {
        if (d.divisions.some(dv => String(dv.id) === String(divId))) {
          const numId = Number(d.id);
          if (!isNaN(numId)) parentDeptId = numId;
          break;
        }
      }

      let realTeamId = `team_${Date.now()}`;
      if (parentDeptId) {
        try {
          const res = await AdminAPI.createTeam(chosenName, parentDeptId);
          if (res?.team?.id) realTeamId = String(res.team.id);
        } catch (e) {
          console.warn('Could not pre-create team in SQL, will be synced on snapshot save:', e);
        }
      }

      setDepartments(prev => {
        const updated = prev.map(d => ({
          ...d,
          divisions: d.divisions.map(dv => {
            if (String(dv.id) === String(divId)) {
              return {
                ...dv,
                teams: [...(dv.teams || []), {
                  id: realTeamId,
                  name: chosenName,
                  users: [],
                  expanded: true
                }]
              };
            }
            return dv;
          })
        }));
        AdminAPI.saveDepartmentsSnapshot(updated).catch(e => console.error('Snapshot sync error:', e));
        return updated;
      });
      setTeamAssignSuccessToast(`تمت إضافة فريق "${chosenName}" بنجاح!`);
    }
    
    setAddEntityModalOpen(null);
    setAddEntitySelectedNode(null);
  };

  const handleAddDivision = (deptId: string, deptName: string) => {
    const dept = departments.find(d => String(d.id) === String(deptId));
    if (!dept) return;

    const availableNodes = getAvailableDivisions(deptName);
    const firstNode = availableNodes.length > 0 ? availableNodes[0] : null;
    const initialDivIds = availableNodes.map(n => n.id);

    const allTeamIds: string[] = [];
    availableNodes.forEach(node => {
      const hierarchy = getCascadeHierarchyForNode(node.name, 'DIVISION');
      if (hierarchy.teams) {
        hierarchy.teams.forEach(t => allTeamIds.push(t.id));
      }
    });

    setAddEntityCategoryFilter('ALL');
    setAddEntityModalOpen({ type: 'DIVISION', parentId: deptId, parentName: deptName, availableNodes });
    setAddEntitySelectedNode(firstNode);
    setSelectedAddDivisionIds(initialDivIds);
    setSelectedCascadeTeamIds(allTeamIds);
    setAddEntityCascadeMode(allTeamIds.length > 0 ? 'WITH_CASCADE' : 'ENTITY_ONLY');
  };

  const handleAddTeam = (deptId: string, divId: string, divName: string) => {
    const dept = departments.find(d => String(d.id) === String(deptId));
    if (!dept) return;
    const div = dept.divisions.find(d => String(d.id) === String(divId));
    if (!div) return;

    const availableNodes = getAvailableTeams(divName);
    setAddEntityCategoryFilter('ALL');
    setAddEntityModalOpen({ type: 'TEAM', parentId: divId, parentName: divName, availableNodes });
    setAddEntitySelectedNode(availableNodes.length > 0 ? availableNodes[0] : null);
    initCascadeForNode(null, 'TEAM');
  };

  const ModalBackdrop: React.FC<{
    children: React.ReactNode;
    onClose?: () => void;
  }> = ({ children, onClose }) => {
    return createPortal(
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100000,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          // Use overflow-y: auto on the wrapper itself, so the modal
          // scrolls within the viewport rather than being clipped below taskbar.
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'max(5vh, 24px) 16px',
          boxSizing: 'border-box',
          direction: 'rtl'
        }}
      >
        {children}
      </div>,
      document.body
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', textAlign: 'start', fontFamily: OA.font, color: OA.text }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '4px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: OA.text, margin: '0 0 6px', letterSpacing: '-0.4px' }}>الهيكل التشغيلي</h2>
        <p style={{ color: OA.textSub, fontSize: '14px', margin: 0 }}>المصفوفة التنظيمية المتقدمة لتعيين وتوزيع المهندسين والموظفين التشغيليين.</p>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflow: 'hidden' }}>
        
        {/* Org Tree Panel */}
        <div style={{ flex: '1.2', background: OA.surface, border: `1px solid ${OA.sep}`, borderRadius: OA.radius, padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: OA.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${OA.sep}`, paddingBottom: '14px' }}>
            <h3 style={{ color: OA.text, fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span style={{ background: `${OA.blue}15`, color: OA.blue, width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '15px' }}>⬡</span>
              شجرة الإدارات التشغيلية
            </h3>
            <button onClick={handleAddDepartment} style={{ background: OA.blue, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', boxShadow: `0 2px 8px ${OA.blue}40`, fontFamily: OA.font }}>+ إضافة إدارة جديدة</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }} className="admin-scroll">
            {departments.map(dept => (
              <div key={dept.id} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.bg, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${OA.sep}` }} onClick={() => {
                  setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, expanded: !d.expanded } : d));
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', transform: dept.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: OA.blue, display: 'inline-block' }}>▶</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${OA.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🏢</div>
                    <span style={{ fontWeight: '700', fontSize: '15px', color: OA.text }}>{dept.name}</span>
                    {dept.managerId && (
                      <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === dept.managerId) || null); }} style={{ fontSize: '11px', background: `${OA.blue}12`, color: OA.blue, padding: '3px 8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${OA.blue}20` }}>
                        {operationalUsers.find(u => u.id === dept.managerId)?.name}
                      </span>
                    )}
                    {dept.unassignedUsers && dept.unassignedUsers.length > 0 && (
                      <span style={{ fontSize: '11px', background: 'rgba(0, 122, 255, 0.1)', color: OA.blue, padding: '2px 8px', borderRadius: '6px', fontWeight: '600', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                        {dept.unassignedUsers.length} كادر مباشر بالإدارة
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenEditModal('DEPARTMENT', dept)} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '5px 10px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontWeight: '600', fontFamily: OA.font }}>تعديل</button>
                    <button onClick={() => handleDeleteEntity('DEPARTMENT', dept.id, dept.name)} style={{ background: `${OA.red}10`, border: `1px solid ${OA.red}20`, color: OA.red, padding: '5px 10px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', fontWeight: '600', fontFamily: OA.font }}>حذف</button>
                  </div>
                </div>
                
                {dept.expanded && (
                  <div style={{ paddingInlineStart: '24px', marginTop: '8px', borderInlineStart: `2px solid ${OA.sep}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dept.unassignedUsers && dept.unassignedUsers.length > 0 && (
                      <div style={{ padding: '10px 14px', background: 'rgba(0, 122, 255, 0.04)', borderRadius: '10px', border: '1px dashed rgba(0, 122, 255, 0.25)', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>🏢</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: OA.text }}>المنسبون للإدارة مباشرة (غير مفرزين لأقسام):</span>
                            <span style={{ fontSize: '11px', background: 'rgba(0, 122, 255, 0.15)', color: OA.blue, padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{dept.unassignedUsers.length}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {dept.unassignedUsers.map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.surface, padding: '7px 12px', borderRadius: '7px', border: `1px solid ${OA.sep}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${OA.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: OA.blue, fontWeight: '700' }}>{u.name[0]}</div>
                                <span style={{ fontSize: '12px', color: OA.text, fontWeight: '500', cursor: 'pointer' }} onClick={() => handleOpenProfile(u)}>{u.name}</span>
                                <span style={{ fontSize: '10px', color: OA.textTer }}>{u.employeeId}</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(u); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '3px 7px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer', fontFamily: OA.font }}>نقل / فرز</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {dept.divisions.map(div => (
                      <div key={div.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.surface, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', border: `1px solid ${OA.sep}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }} onClick={() => {
                          setDepartments(prev => prev.map(d => d.id === dept.id ? {
                            ...d, divisions: d.divisions.map(dv => dv.id === div.id ? { ...dv, expanded: !dv.expanded } : dv)
                          } : d));
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', transform: div.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: OA.indigo, display: 'inline-block' }}>▶</span>
                            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: `${OA.indigo}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📂</div>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: OA.text }}>{div.name}</span>
                            {div.headId && (
                              <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === div.headId) || null); }} style={{ fontSize: '11px', background: `${OA.indigo}10`, color: OA.indigo, padding: '2px 7px', borderRadius: '5px', cursor: 'pointer', border: `1px solid ${OA.indigo}18` }}>
                                {operationalUsers.find(u => u.id === div.headId)?.name}
                              </span>
                            )}
                            {div.isIndependent && <span style={{ fontSize: '10px', background: `${OA.amber}12`, color: OA.amber, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${OA.amber}20`, fontWeight: '600' }}>مستقل</span>}
                            {div.unassignedUsers && div.unassignedUsers.length > 0 && (
                              <span style={{ 
                                fontSize: '11px', 
                                background: 'rgba(245, 158, 11, 0.12)', 
                                color: '#d97706', 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                border: '1px solid rgba(245, 158, 11, 0.25)', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d97706' }} />
                                {div.unassignedUsers.length} كادر غير موزع
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                             <button onClick={() => handleOpenEditModal('DIVISION', div, dept)} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: OA.font }}>تعديل</button>
                             <button onClick={() => handleAddTeam(dept.id, div.id, div.name)} style={{ background: `${OA.green}10`, border: `1px solid ${OA.green}20`, color: OA.green, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: OA.font }}>+ فريق</button>
                             <button onClick={() => handleDeleteEntity('DIVISION', div.id, div.name)} style={{ background: `${OA.red}10`, border: `1px solid ${OA.red}20`, color: OA.red, padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: OA.font }}>حذف</button>
                          </div>
                        </div>
                        
                        {div.expanded && (
                          <div style={{ paddingRight: '30px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {div.teams.map(team => (
                              <div key={team.id}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.bg, padding: '9px 12px', borderRadius: '8px', border: `1px solid ${OA.sep}`, cursor: 'pointer' }} onClick={() => {
                                  setDepartments(prev => prev.map(d => d.id === dept.id ? {
                                    ...d, divisions: d.divisions.map(dv => dv.id === div.id ? {
                                      ...dv, teams: dv.teams.map(t => t.id === team.id ? { ...t, expanded: !t.expanded } : t)
                                    } : dv)
                                  } : d));
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '9px', transform: team.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: OA.purple, display: 'inline-block' }}>▶</span>
                                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: `${OA.purple}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>👥</div>
                                    <span style={{ fontSize: '13px', color: OA.text, fontWeight: '600' }}>{team.name}</span>
                                    <span style={{ fontSize: '11px', color: OA.textTer, background: OA.bg, padding: '1px 6px', borderRadius: '5px', border: `1px solid ${OA.sep}` }}>{team.users.length} أعضاء</span>
                                    {team.leaderId && (
                                      <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === team.leaderId) || null); }} style={{ fontSize: '11px', background: `${OA.purple}10`, color: OA.purple, padding: '2px 7px', borderRadius: '5px', cursor: 'pointer', border: `1px solid ${OA.purple}18` }}>
                                        {operationalUsers.find(u => u.id === team.leaderId)?.name}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                     <button 
                                       onClick={() => {
                                         setTeamAssignTarget({ dept, div, team });
                                         setSelectedTeamCandidateIds([]);
                                         setTeamCandidateSearch('');
                                         setTeamAssignPoolSource('DIVISION');
                                       }}
                                       style={{
                                         background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12), rgba(99, 102, 241, 0.16))',
                                         border: '1px solid rgba(0, 122, 255, 0.35)',
                                         color: '#007AFF',
                                         padding: '4px 10px',
                                         borderRadius: '6px',
                                         fontSize: '11px',
                                         fontWeight: '700',
                                         cursor: 'pointer',
                                         display: 'inline-flex',
                                         alignItems: 'center',
                                         gap: '5px',
                                         boxShadow: '0 1px 3px rgba(0, 122, 255, 0.1)',
                                         transition: 'all 0.15s ease'
                                       }}
                                       title="تنسيب أعضاء من كوادر هذا القسم للفريق"
                                     >
                                       <span style={{ fontSize: '11px' }}>➕</span>
                                       <span>تنسيب للفريق</span>
                                       {div.unassignedUsers && div.unassignedUsers.length > 0 && (
                                         <span style={{
                                           background: '#007AFF',
                                           color: '#ffffff',
                                           fontSize: '10px',
                                           padding: '1px 5px',
                                           borderRadius: '10px',
                                           fontWeight: 'bold'
                                         }}>
                                           {div.unassignedUsers.length}
                                         </span>
                                       )}
                                     </button>
                                     <button onClick={() => handleOpenEditModal('TEAM', team, div, dept)} style={{ background: OA.surface, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '4px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontFamily: OA.font }}>تعديل</button>
                                     <button onClick={() => handleOpenDeleteTeamModal(team, div)} style={{ background: `${OA.red}10`, border: `1px solid ${OA.red}20`, color: OA.red, padding: '4px 8px', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontFamily: OA.font }}>حذف</button>
                                  </div>
                                </div>
                                {team.expanded && (
                                  <div style={{ paddingInlineStart: '20px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', borderInlineStart: `1px solid ${OA.sep}` }}>
                                    {team.users.map(u => (
                                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.surface, padding: '7px 12px', borderRadius: '7px', border: `1px solid ${OA.sep}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                           <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${OA.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: OA.blue, fontWeight: '700' }}>{u.name[0]}</div>
                                           <span style={{ fontSize: '12px', color: OA.text, cursor: 'pointer', fontWeight: '500' }} onClick={() => handleOpenProfile(u)}>{u.name}</span>
                                           <span style={{ fontSize: '10px', color: OA.textTer }}>{u.employeeId}</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(u); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '3px 7px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer', fontFamily: OA.font }}>إدارة</button>
                                      </div>
                                    ))}
                                    {team.users.length === 0 && <div style={{ fontSize: '11px', color: OA.textTer, padding: '5px 10px' }}>لا يوجد أعضاء في هذا الفريق.</div>}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {div.unassignedUsers && div.unassignedUsers.length > 0 && (
                              <div style={{ marginTop: '10px', padding: '12px 14px', background: 'rgba(245, 158, 11, 0.04)', borderRadius: '10px', border: '1px dashed rgba(245, 158, 11, 0.35)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '13px' }}>📋</span>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: OA.text }}>المنسبون للقسم (بانتظار التوزيع على الفرق):</span>
                                    <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '1px 7px', borderRadius: '10px', fontWeight: 'bold' }}>
                                      {div.unassignedUsers.length}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '11px', color: OA.textSub }}>اضغط على "تنسيب للفريق" عند أي فريق لإدراجهم مباشرة</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {div.unassignedUsers.map(u => (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: OA.surface, padding: '7px 12px', borderRadius: '7px', border: `1px solid ${OA.sep}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                         <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.35))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#b45309', fontWeight: '700' }}>{u.name[0]}</div>
                                         <span style={{ fontSize: '12px', color: OA.text, fontWeight: '600', cursor: 'pointer' }} onClick={() => handleOpenProfile(u)}>{u.name}</span>
                                         <span style={{ fontSize: '10px', color: OA.textTer }}>{u.employeeId}</span>
                                         <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '1px 5px', borderRadius: '4px' }}>منسب للقسم</span>
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(u); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '3px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer', fontFamily: OA.font }}>خيارات النقل</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {div.teams.length === 0 && div.unassignedUsers.length === 0 && <div style={{ fontSize: '12px', color: OA.textTer, padding: '5px 10px' }}>لا توجد بيانات تابعة.</div>}
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={() => handleAddDivision(dept.id, dept.name)} style={{ alignSelf: 'flex-start', background: `${OA.blue}10`, border: `1px dashed ${OA.blue}40`, color: OA.blue, padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: OA.font }}>+ إضافة قسم فرعي</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* User Pool Panel */}
        <div style={{ flex: '1', background: OA.surface, border: `1px solid ${OA.sep}`, borderRadius: OA.radius, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: OA.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${OA.sep}`, background: OA.surface, flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ color: OA.text, fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span style={{ background: `${OA.blue}12`, color: OA.blue, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '7px', fontSize: '13px' }}>👥</span>
              دليل الكوادر التشغيلية
            </h3>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="بحث بالاسم أو الرقم الوظيفي..." 
                value={poolSearchQuery}
                onChange={e => setPoolSearchQuery(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${OA.sepStr}`, background: OA.bg, color: OA.text, fontSize: '13px', width: '220px', outline: 'none', fontFamily: OA.font }}
              />
              <select 
                value={poolFilterStatus}
                onChange={e => setPoolFilterStatus(e.target.value as any)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${OA.sepStr}`, background: OA.bg, color: OA.text, fontSize: '13px', outline: 'none', cursor: 'pointer', fontFamily: OA.font }}
              >
                <option value="ALL">الكل</option>
                <option value="ASSIGNED">المنسبون</option>
                <option value="UNASSIGNED">غير المنسبين</option>
              </select>
              {poolFilterStatus === 'ASSIGNED' && (
                 <>
                   <select value={filterAssignedDeptId} onChange={e => { setFilterAssignedDeptId(e.target.value); setFilterAssignedDivId(''); setFilterAssignedTeamId(''); }} style={{ padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, fontSize: '13px' }}>
                     <option value="">-- الفلترة بالإدارة --</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                   {filterAssignedDeptId && (
                     <select value={filterAssignedDivId} onChange={e => { setFilterAssignedDivId(e.target.value); setFilterAssignedTeamId(''); }} style={{ padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, fontSize: '13px' }}>
                       <option value="">-- الفلترة بالقسم --</option>
                       {departments.find(d => d.id === filterAssignedDeptId)?.divisions.map(dv => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                     </select>
                   )}
                   {filterAssignedDivId && (
                     <select value={filterAssignedTeamId} onChange={e => setFilterAssignedTeamId(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, fontSize: '13px' }}>
                       <option value="">-- الفلترة بالفريق --</option>
                       {departments.find(d => d.id === filterAssignedDeptId)?.divisions.find(dv => dv.id === filterAssignedDivId)?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                   )}
                 </>
              )}
              
              {selectedPoolUsers.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                  <button style={{ background: OA.green, color: OA.text, border: 'none', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleBulkAssignClick}>
                    تنسيب المحددين ({selectedPoolUsers.length})
                  </button>
                  <button onClick={handleBulkUnassignClick} style={{ background: `${OA.red}15`, color: OA.red, border: `1px solid ${OA.red}30`, padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    إرجاع كمستخدمين عاديين
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="scrollbar-thin">
            <table style={{ width: '100%', borderCollapse: 'collapse', color: OA.text }}>
              <thead style={{ background: OA.bg }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: `1px solid ${OA.sep}` }}>
                    <input type="checkbox" onChange={e => {
                      if (e.target.checked) setSelectedPoolUsers(filteredPool.map(u => u.id));
                      else setSelectedPoolUsers([]);
                    }} checked={selectedPoolUsers.length === filteredPool.length && filteredPool.length > 0} />
                  </th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>الرقم الوظيفي</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>الاسم</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>البريد الإلكتروني</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>الرتبة والدور</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>حالة التنسيب</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontSize: '13px', color: OA.textSub, borderBottom: `1px solid ${OA.sep}` }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPool.map(user => {
                  const assignmentInfo = getUserAssignmentInfo(user);
                  const isAssigned = assignmentInfo.isAssigned;
                  const assignmentText = assignmentInfo.text;
                  const roleBadge = assignmentInfo.role;
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${OA.sep}`, background: selectedPoolUsers.includes(user.id) ? `${OA.blue}10` : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 15px' }}>
                        <input type="checkbox" checked={selectedPoolUsers.includes(user.id)} onChange={e => {
                          if (e.target.checked) setSelectedPoolUsers(prev => [...prev, user.id]);
                          else setSelectedPoolUsers(prev => prev.filter(id => id !== user.id));
                        }} />
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', color: OA.textSub }}>{user.employeeId}</td>
                      <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', color: OA.text, cursor: 'pointer' }} onClick={() => handleOpenProfile(user)}>{user.name}</td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', color: OA.textSub }}>{user.email}</td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>
                        <span style={{ background: isAssigned ? 'rgba(139, 92, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: OA.text, padding: '4px 8px', borderRadius: '4px', border: isAssigned ? '1px solid #8b5cf6' : '1px solid #94a3b8' }}>
                          {roleBadge}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>
                        {isAssigned ? (
                          <span style={{ color: OA.green, display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>✓ {assignmentText}</span>
                        ) : (
                          <span style={{ color: OA.textSub }}>- غير منسب -</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(user); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>🔄 نقل</button>
                          </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPool.length === 0 && <div style={{ textAlign: 'center', color: OA.textSub, fontSize: '14px', padding: '40px' }}>لا يوجد مستخدمين يطابقون شروط البحث الحالية.</div>}
          </div>
        </div>
      </div>

      {/* --- MODALS (PORTAL RENDERED & CENTERED) --- */}
      {/* 🪪 Killer Super Profile Modal */}
      {profileModalUser && (
        <ModalBackdrop onClose={() => setProfileModalUser(null)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '520px', maxWidth: 'min(95vw, 520px)', maxHeight: 'min(86vh, 720px)', overflowY: 'auto', border: profileEditData.status === 'BLOCKED' ? '2px solid rgba(239, 68, 68, 0.5)' : `1px solid ${OA.sep}`, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', paddingBottom: '20px', borderBottom: `1px dashed ${OA.sep}` }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', border: '3px solid rgba(255,255,255,0.1)' }}>
                  👤
                </div>
                {profileEditData.status === 'BLOCKED' && (
                  <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#ef4444', color: 'white', borderRadius: '50%', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid #0f172a' }}>🚫</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: OA.text, fontSize: '22px', margin: '0 0 5px 0' }}>{profileModalUser.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <span style={{ color: OA.textSub, fontSize: '13px', background: OA.bg, padding: '3px 8px', borderRadius: '4px' }}>{profileModalUser.employeeId}</span>
                   {profileModalUser.departmentId && <span style={{ color: OA.green, fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>منسب للهيكل</span>}
                </div>
              </div>
            </div>
            
            {/* SSO Read-Only Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '15px', background: 'rgba(9, 30, 66, 0.03)', borderRadius: '8px', border: `1px solid ${OA.sep}` }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: OA.textSub, marginBottom: '5px' }}>🔒 بيانات الدخول الموحد (SSO) - للقراءة فقط</div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 45%' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>معرف SSO:</span> <span style={{ fontSize: '12px', fontWeight: 'bold', color: OA.text }}>{profileModalUser.ssoId || 'غير متوفر'}</span></div>
                <div style={{ flex: '1 1 45%' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>معرف المنظمة:</span> <span style={{ fontSize: '12px', fontWeight: 'bold', color: OA.text }}>{profileModalUser.tenantId || 'غير متوفر'}</span></div>
                <div style={{ flex: '1 1 45%' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>المسمى الوظيفي:</span> <span style={{ fontSize: '12px', fontWeight: 'bold', color: OA.text }}>{profileModalUser.jobTitle || 'غير متوفر'}</span></div>
                <div style={{ flex: '1 1 45%' }}><span style={{ fontSize: '11px', color: '#6b7280' }}>الدور التنظيمي:</span> <span style={{ fontSize: '12px', fontWeight: 'bold', color: OA.text }}>{profileModalUser.ssoRole || 'EMPLOYEE'}</span></div>
              </div>
            </div>

            {/* Role-Based Dynamic View */}
            {profileModalUser.ssoRole === 'OPERATOR' && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#10b981', marginBottom: '10px' }}>🟢 حالة التوافر (Availability Status)</div>
                <select 
                  value={profileEditData.availabilityStatus || 'AVAILABLE'} 
                  onChange={e => setProfileEditData({...profileEditData, availabilityStatus: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(255,255,255,0.8)', color: '#0f172a', fontSize: '13px' }}
                >
                  <option value="AVAILABLE">متاح (Available)</option>
                  <option value="BUSY">مشغول (Busy)</option>
                  <option value="ON_LEAVE">في إجازة (On-Leave)</option>
                </select>
              </div>
            )}
            
            {profileModalUser.ssoRole === 'LEADERSHIP' && (
              <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0284c7', marginBottom: '10px' }}>👑 نطاق القيادة (Command Scope)</div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  يتم عرض الهيكل التنظيمي للموظفين التابعين له هنا (يتطلب ربط مع API الاستعلام عن التابعين).
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
               <div>
                  <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>الاسم الكامل</label>
                  <input type="text" value={profileEditData.name} onChange={e => setProfileEditData({...profileEditData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(241,245,249,0.9)', border: `1px solid ${OA.sep}`, color: OA.text, fontSize: '14px' }} />
               </div>
               <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>البريد الإلكتروني</label>
                     <input type="email" value={profileEditData.email} onChange={e => setProfileEditData({...profileEditData, email: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(241,245,249,0.9)', border: `1px solid ${OA.sep}`, color: OA.text, fontSize: '14px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>رقم الهاتف</label>
                     <input type="text" value={profileEditData.phone} onChange={e => setProfileEditData({...profileEditData, phone: e.target.value})} placeholder="09X XXX XXXX" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(241,245,249,0.9)', border: `1px solid ${OA.sep}`, color: OA.text, fontSize: '14px' }} />
                  </div>
               </div>
               <div>
                  <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>واجهة النظام التشغيلية الافتراضية</label>
                  <select value={profileEditData.activeUI || ''} onChange={e => setProfileEditData({...profileEditData, activeUI: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(241,245,249,0.9)', border: `1px solid ${OA.sep}`, color: OA.text, fontSize: '14px', marginBottom: '15px' }}>
                     <option value="ticket_create">Ticket Create (إنشاء تذاكر)</option>
                     <option value="inbound_tickets">Inbound Hub (استقبال التذاكر)</option>
                     <option value="analytics_dashboard">Analytics Dashboard (لوحة التحليلات)</option>
                  </select>
               </div>
               <div>
                  <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>تخصيص قالب إرسال الموظف (تجاوز الافتراضي)</label>
                  <select value={profileEditData.assignedSubmissionTemplateId || ''} onChange={e => setProfileEditData({...profileEditData, assignedSubmissionTemplateId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(241,245,249,0.9)', border: `1px solid ${OA.sep}`, color: OA.text, fontSize: '14px' }}>
                     <option value="">-- القالب الافتراضي للدور --</option>
                     {(() => {
                        try {
                           const st = localStorage.getItem('SUBMISSION_TEMPLATES_SCHEMA');
                           if (st) {
                              return JSON.parse(st).map((t: any) => (
                                 <option key={t.id} value={t.id}>{t.name}</option>
                              ));
                           }
                        } catch(e) {}
                        return null;
                     })()}
                  </select>
               </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => setProfileEditData({...profileEditData, status: profileEditData.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED'})} style={{ background: profileEditData.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: profileEditData.status === 'BLOCKED' ? '#10b981' : '#fca5a5', border: profileEditData.status === 'BLOCKED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   {profileEditData.status === 'BLOCKED' ? '✅ فك الحظر' : '🚫 حظر المستخدم'}
                 </button>

                 <button onClick={() => {
                    setProfileModalUser(null);
                    setSingleMoveUser(profileModalUser); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true);
                 }} style={{ background: OA.bg, border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '10px 15px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   🔄 نقل وإدارة
                 </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => setProfileModalUser(null)} style={{ background: 'transparent', border: 'none', color: OA.textSub, padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
                 <button onClick={() => {
                    setOperationalUsers(prev => prev.map(u => u.id === profileModalUser.id ? { ...u, ...profileEditData } : u));
                    setProfileModalUser(null);
                 }} style={{ background: '#6366f1', color: OA.text, border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)' }}>
                    💾 حفظ التعديلات
                 </button>
              </div>

            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Universal Add Entity Modal — مواءمة واضحة ومنظمة مع الهيكل المؤسسي وتدرج الإضافة المتقدم */}
      {addEntityModalOpen && (
        <ModalBackdrop onClose={() => setAddEntityModalOpen(null)}>
          <div style={{
            background: '#ffffff',
            padding: '26px 30px',
            borderRadius: '20px',
            width: '640px',
            maxWidth: 'min(95vw, 640px)',
            maxHeight: 'min(90vh, 780px)',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)',
            textAlign: 'right',
            direction: 'rtl',
            margin: 'auto',
            border: `1px solid ${OA.sep}`
          }} className="admin-scroll">

            {/* رأس النافذة */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: OA.text, fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>
                    {addEntityModalOpen.type === 'DEPARTMENT' ? '🏛️ إضافة كيان معتمد للهيكل التشغيلي' :
                     addEntityModalOpen.type === 'DIVISION' ? '📁 إضافة قسم / مكتب تشغيلي معتمد' :
                     '👥 إضافة وحدة / فريق معتمد'}
                  </span>
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: OA.textSub }}>
                  {addEntityModalOpen.type === 'DEPARTMENT' ? 'اختر الإدارة أو الإدارة العليا أو المكتب المعتمد من الهيكل المؤسسي لتفعيله تشغيلياً' :
                   addEntityModalOpen.type === 'DIVISION' ? `اختر القسم أو المكتب لإدراجه تحت (${addEntityModalOpen.parentName})` :
                   `اختر الوحدة أو الفريق لإدراجه تحت (${addEntityModalOpen.parentName})`}
                </p>
              </div>
              <button
                onClick={() => setAddEntityModalOpen(null)}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: OA.textSub,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px'
                }}
              >
                ✕
              </button>
            </div>

            {/* شريط الإشعار المؤسسي الأنيق */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.06), rgba(88, 86, 214, 0.06))',
              border: '1px solid rgba(0, 122, 255, 0.18)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '12px',
              color: '#0055b3',
              lineHeight: 1.6,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <div>
                <strong>الربط المؤسسي الصارم:</strong> الكيانات المعروضة مقيدة حصراً بما تم اعتماده في <strong>الهيكل المؤسسي</strong> منعاً للعشوائية أو ازدواجية المسميات.
              </div>
            </div>

            {addEntityModalOpen.availableNodes.length > 0 ? (
              <>
                {/* ─── تصنيفات التصفية (للإدارات والكيانات العليا والمكاتب) ─── */}
                {addEntityModalOpen.type === 'DEPARTMENT' && (() => {
                  const highMgtCount = addEntityModalOpen.availableNodes.filter(n => n.type === 'إدارة عليا').length;
                  const deptsCount = addEntityModalOpen.availableNodes.filter(n => n.type === 'إدارة').length;
                  const officesCount = addEntityModalOpen.availableNodes.filter(n => n.type === 'مكتب').length;

                  return (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setAddEntityCategoryFilter('ALL')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: addEntityCategoryFilter === 'ALL' ? '2px solid #007AFF' : `1px solid ${OA.sepStr}`,
                          background: addEntityCategoryFilter === 'ALL' ? 'rgba(0,122,255,0.08)' : '#ffffff',
                          color: addEntityCategoryFilter === 'ALL' ? '#007AFF' : OA.textSub,
                          fontWeight: '700',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        ✨ الكل ({addEntityModalOpen.availableNodes.length})
                      </button>

                      {highMgtCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setAddEntityCategoryFilter('إدارة عليا')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: addEntityCategoryFilter === 'إدارة عليا' ? '2px solid #7c3aed' : `1px solid ${OA.sepStr}`,
                            background: addEntityCategoryFilter === 'إدارة عليا' ? 'rgba(124,58,237,0.08)' : '#ffffff',
                            color: addEntityCategoryFilter === 'إدارة عليا' ? '#7c3aed' : OA.textSub,
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>👑</span>
                          <span>إدارة عليا ({highMgtCount})</span>
                        </button>
                      )}

                      {deptsCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setAddEntityCategoryFilter('إدارة')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: addEntityCategoryFilter === 'إدارة' ? '2px solid #0284c7' : `1px solid ${OA.sepStr}`,
                            background: addEntityCategoryFilter === 'إدارة' ? 'rgba(2,132,199,0.08)' : '#ffffff',
                            color: addEntityCategoryFilter === 'إدارة' ? '#0284c7' : OA.textSub,
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>🏢</span>
                          <span>إدارات تنفيذية ({deptsCount})</span>
                        </button>
                      )}

                      {officesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setAddEntityCategoryFilter('مكتب')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: addEntityCategoryFilter === 'مكتب' ? '2px solid #d97706' : `1px solid ${OA.sepStr}`,
                            background: addEntityCategoryFilter === 'مكتب' ? 'rgba(217,119,6,0.08)' : '#ffffff',
                            color: addEntityCategoryFilter === 'مكتب' ? '#d97706' : OA.textSub,
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>📑</span>
                          <span>مكاتب مستقلة ({officesCount})</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* ─── قائمة بطاقات الكيانات المعتمدة للاختيار (بطاقات تفاعلية أنيقة) ─── */}
                {(() => {
                  const isDivisionModal = addEntityModalOpen.type === 'DIVISION';
                  const filteredNodes = addEntityModalOpen.availableNodes
                    .filter((node: any) => addEntityCategoryFilter === 'ALL' || node.type === addEntityCategoryFilter);

                  return (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: OA.textSub, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isDivisionModal ? 'حدد الأقسام المراد إضافتها وتفعيلها:' : 'اختر الكيان المطلوب:'}</span>
                          {isDivisionModal && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: selectedAddDivisionIds.length > 0 ? 'rgba(0, 122, 255, 0.1)' : '#f1f5f9',
                              color: selectedAddDivisionIds.length > 0 ? '#007AFF' : OA.textTer
                            }}>
                              المحدد: {selectedAddDivisionIds.length} من {filteredNodes.length}
                            </span>
                          )}
                        </div>

                        {isDivisionModal && filteredNodes.length > 1 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => selectAllDivisionNodes(filteredNodes)}
                              style={{ background: 'transparent', border: 'none', color: '#007AFF', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                            >
                              ✓ تحديد الكل
                            </button>
                            <span style={{ color: OA.sepStr }}>|</span>
                            <button
                              type="button"
                              onClick={deselectAllDivisionNodes}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                            >
                              ✗ إلغاء التحديد
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{
                        maxHeight: '210px',
                        overflowY: 'auto',
                        border: `1px solid ${OA.sep}`,
                        borderRadius: '12px',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: '#fafbfc'
                      }} className="admin-scroll">
                        {filteredNodes.map((node: any) => {
                          const isSelected = isDivisionModal
                            ? selectedAddDivisionIds.includes(node.id)
                            : addEntitySelectedNode?.id === node.id;
                          const meta = getEntityMeta(node.type);

                          return (
                            <div
                              key={node.id}
                              onClick={() => {
                                if (isDivisionModal) {
                                  toggleSelectDivisionNode(node);
                                } else {
                                  setAddEntitySelectedNode(node);
                                  initCascadeForNode(node, addEntityModalOpen.type);
                                }
                              }}
                              style={{
                                border: isSelected ? '2px solid #007AFF' : `1px solid ${OA.sep}`,
                                background: isSelected ? 'rgba(0, 122, 255, 0.05)' : '#ffffff',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                                boxShadow: isSelected ? '0 2px 8px rgba(0, 122, 255, 0.12)' : 'none'
                              }}
                            >
                              {/* الجانب الأيمن: الأيقونة والاسم والتصنيف المؤسسي */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '8px',
                                  background: meta.bg,
                                  border: meta.border,
                                  color: meta.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px'
                                }}>
                                  {meta.icon}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '13px', color: OA.text }}>
                                      {node.name}
                                    </span>
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: '700',
                                      padding: '2px 7px',
                                      borderRadius: '5px',
                                      background: meta.bg,
                                      border: meta.border,
                                      color: meta.color
                                    }}>
                                      {meta.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: OA.textTer, marginTop: '2px' }}>
                                    الموقع المؤسسي: {node.parentName ? `تابع لـ (${node.parentName})` : 'على قمة الهيكل المؤسسي'}
                                  </div>
                                </div>
                              </div>

                              {/* الجانب الأيسر: عداد الفروع ومؤشر الاختيار */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {(node.childrenCount > 0 || node.subUnitsCount > 0) ? (
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(79, 70, 229, 0.08)',
                                    border: '1px solid rgba(79, 70, 229, 0.18)',
                                    color: '#4f46e5'
                                  }}>
                                    ⚡ يتفرع منه: {node.childrenCount || node.subUnitsCount} وحدة فرعية
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: '#f1f5f9',
                                    color: '#94a3b8'
                                  }}>
                                    📌 قسم مباشر
                                  </span>
                                )}

                                {isDivisionModal ? (
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    border: isSelected ? '2px solid #007AFF' : '2px solid #cbd5e1',
                                    background: isSelected ? '#007AFF' : '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    transition: 'all 0.15s ease'
                                  }}>
                                    {isSelected ? '✓' : ''}
                                  </div>
                                ) : (
                                  <div style={{
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '50%',
                                    border: isSelected ? '5px solid #007AFF' : '2px solid #cbd5e1',
                                    background: '#ffffff',
                                    transition: 'all 0.15s ease'
                                  }} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ─── لوحة التدرج الهرمي الذكية ─── */}
                {(() => {
                  if (addEntityModalOpen.type === 'DIVISION') {
                    const selectedDivNodes = addEntityModalOpen.availableNodes.filter((n: any) => selectedAddDivisionIds.includes(n.id));

                    if (selectedDivNodes.length === 0) {
                      return (
                        <div style={{
                          background: '#fef3c7',
                          border: '1px dashed #f59e0b',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          marginBottom: '20px',
                          fontSize: '12px',
                          color: '#92400e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '18px' }}>⚠️</span>
                          <span>يرجى تحديد قسم واحد على الأقل من القائمة أعلاه لمتابعة استيراد وتخصيص الوحدات التابعة.</span>
                        </div>
                      );
                    }

                    const divsWithTeams = selectedDivNodes.map((divNode: any) => ({
                      divNode,
                      teams: (getCascadeHierarchyForNode(divNode.name, 'DIVISION').teams || [])
                    })).filter((item: any) => item.teams.length > 0);

                    const totalAvailableTeams = divsWithTeams.reduce((sum: number, item: any) => sum + item.teams.length, 0);
                    const allTeamIdsInSelectedDivs: string[] = [];
                    divsWithTeams.forEach((item: any) => item.teams.forEach((t: any) => allTeamIdsInSelectedDivs.push(t.id)));

                    if (totalAvailableTeams === 0) {
                      return (
                        <div style={{
                          background: '#f8fafc',
                          border: `1px dashed ${OA.sepStr}`,
                          borderRadius: '12px',
                          padding: '12px 16px',
                          marginBottom: '20px',
                          fontSize: '12px',
                          color: OA.textSub,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '18px' }}>ℹ️</span>
                          <span>الأقسام المحددة لا تحتوي على وحدات أو فرق فرعية في الهيكل المؤسسي. سيتم إنشاء الأقسام مباشرة في الهيكل التشغيلي.</span>
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        marginBottom: '20px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '14px',
                        background: '#f8fafc',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}>
                        {/* ترويسة اللوحة ومحدد النمط */}
                        <div style={{ padding: '14px 18px', background: 'linear-gradient(180deg, #ffffff, #f1f5f9)', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '16px' }}>⚡</span>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: OA.text }}>
                              الوحدات والفرق التابعة للأقسام المحددة ({totalAvailableTeams} وحدة متاحة):
                            </span>
                          </div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: OA.textSub, lineHeight: 1.5 }}>
                            تحتوي بعض الأقسام المحددة على وحدات فرعية في الهيكل المؤسسي. يمكنك اختيار استيراد الأقسام فقط أو تفعيل الوحدات التابعة:
                          </p>

                          {/* مفاتيح التبديل */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAddEntityCascadeMode('ENTITY_ONLY');
                                setSelectedCascadeTeamIds([]);
                              }}
                              style={{
                                padding: '9px 14px',
                                borderRadius: '9px',
                                border: addEntityCascadeMode === 'ENTITY_ONLY' ? '2px solid #007AFF' : `1px solid ${OA.sepStr}`,
                                background: addEntityCascadeMode === 'ENTITY_ONLY' ? 'rgba(0,122,255,0.08)' : '#ffffff',
                                color: addEntityCascadeMode === 'ENTITY_ONLY' ? '#007AFF' : OA.textSub,
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>📁</span>
                              <span>إضافة الأقسام فقط</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAddEntityCascadeMode('WITH_CASCADE');
                                setSelectedCascadeTeamIds(allTeamIdsInSelectedDivs);
                              }}
                              style={{
                                padding: '9px 14px',
                                borderRadius: '9px',
                                border: addEntityCascadeMode === 'WITH_CASCADE' ? '2px solid #007AFF' : `1px solid ${OA.sepStr}`,
                                background: addEntityCascadeMode === 'WITH_CASCADE' ? 'rgba(0,122,255,0.08)' : '#ffffff',
                                color: addEntityCascadeMode === 'WITH_CASCADE' ? '#007AFF' : OA.textSub,
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span>⚡</span>
                              <span>استيراد وتخصيص الوحدات التابعة ({totalAvailableTeams})</span>
                            </button>
                          </div>
                        </div>

                        {/* قائمة الوحدات المندرجة تحت كل قسم */}
                        {addEntityCascadeMode === 'WITH_CASCADE' && (
                          <div style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: OA.textSub }}>
                                حدد الوحدات التابعة المراد استيرادها مع الأقسام:
                              </span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCascadeTeamIds(allTeamIdsInSelectedDivs)}
                                  style={{ background: 'transparent', border: 'none', color: '#007AFF', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                                >
                                  ✓ تحديد كل الوحدات
                                </button>
                                <span style={{ color: OA.sepStr }}>|</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedCascadeTeamIds([])}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                                >
                                  ✗ إلغاء تحديد الوحدات
                                </button>
                              </div>
                            </div>

                            <div style={{
                              maxHeight: '220px',
                              overflowY: 'auto',
                              border: `1px solid ${OA.sep}`,
                              borderRadius: '10px',
                              background: '#ffffff'
                            }} className="admin-scroll">
                              {divsWithTeams.map((item: any) => {
                                const divSelectedTeams = item.teams.filter((t: any) => selectedCascadeTeamIds.includes(t.id));
                                const isAllDivTeamsSelected = divSelectedTeams.length === item.teams.length;

                                return (
                                  <div key={item.divNode.id} style={{ borderBottom: `1px solid ${OA.sep}`, padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '14px' }}>📁</span>
                                        <span style={{ fontWeight: '800', fontSize: '13px', color: OA.text }}>{item.divNode.name}</span>
                                        <span style={{ fontSize: '11px', color: OA.textTer }}>
                                          ({divSelectedTeams.length}/{item.teams.length} وحدة محددة)
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const teamIds = item.teams.map((t: any) => t.id);
                                          if (isAllDivTeamsSelected) {
                                            setSelectedCascadeTeamIds(prev => prev.filter(id => !teamIds.includes(id)));
                                          } else {
                                            setSelectedCascadeTeamIds(prev => Array.from(new Set([...prev, ...teamIds])));
                                          }
                                        }}
                                        style={{
                                          background: 'transparent',
                                          border: 'none',
                                          color: isAllDivTeamsSelected ? '#ef4444' : '#007AFF',
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {isAllDivTeamsSelected ? 'إلغاء وحدات هذا القسم' : 'تحديد كل وحداته'}
                                      </button>
                                    </div>

                                    {/* الوحدات التابعة لهذا القسم */}
                                    <div style={{ paddingInlineStart: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      {item.teams.map((team: any) => {
                                        const isTeamSelected = selectedCascadeTeamIds.includes(team.id);
                                        const teamMeta = getEntityMeta(team.type);

                                        return (
                                          <label
                                            key={team.id}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '5px 10px',
                                              borderRadius: '6px',
                                              background: isTeamSelected ? 'rgba(5, 150, 105, 0.05)' : '#fafafa',
                                              border: isTeamSelected ? '1px solid rgba(5, 150, 105, 0.2)' : `1px solid ${OA.sep}`,
                                              cursor: 'pointer',
                                              fontSize: '12px'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <input
                                                type="checkbox"
                                                checked={isTeamSelected}
                                                onChange={() => {
                                                  setSelectedCascadeTeamIds(prev =>
                                                    prev.includes(team.id) ? prev.filter(id => id !== team.id) : [...prev, team.id]
                                                  );
                                                }}
                                                style={{ width: '13px', height: '13px', accentColor: '#059669', cursor: 'pointer' }}
                                              />
                                              <span style={{ color: OA.text, fontWeight: isTeamSelected ? '700' : 'normal' }}>
                                                {teamMeta.icon} {team.name}
                                              </span>
                                            </div>
                                            <span style={{
                                              fontSize: '9px',
                                              color: teamMeta.color,
                                              background: teamMeta.bg,
                                              border: teamMeta.border,
                                              padding: '1px 5px',
                                              borderRadius: '4px'
                                            }}>
                                              {team.type}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // بقية الكيانات (DEPARTMENT أو TEAM)
                  if (!addEntitySelectedNode) return null;
                  const hierarchy = getCascadeHierarchyForNode(addEntitySelectedNode.name, addEntityModalOpen.type);
                  const hasDivisions = hierarchy.divisions && hierarchy.divisions.length > 0;
                  const hasTeams = hierarchy.teams && hierarchy.teams.length > 0;

                  // حالة الكيان المستقل الذي ليس له فروع
                  if (!hasDivisions && !hasTeams) {
                    return (
                      <div style={{
                        background: '#f8fafc',
                        border: `1px dashed ${OA.sepStr}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        fontSize: '12px',
                        color: OA.textSub,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '18px' }}>ℹ️</span>
                        <span>لا توجد أقسام أو وحدات فرعية مسجلة تحت هذا الكيان في الهيكل المؤسسي. سيتم إنشاء الكيان مفرداً في الهيكل التشغيلي.</span>
                      </div>
                    );
                  }

                  const allDivIds = hierarchy.divisions.map(d => d.id);
                  const allTeamIds: string[] = [];
                  hierarchy.divisions.forEach(d => d.teams?.forEach(t => allTeamIds.push(t.id)));
                  if (hierarchy.teams) hierarchy.teams.forEach(t => allTeamIds.push(t.id));

                  return (
                    <div style={{
                      marginBottom: '20px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      background: '#f8fafc',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                    }}>
                      {/* ترويسة اللوحة ومحدد النمط */}
                      <div style={{ padding: '14px 18px', background: 'linear-gradient(180deg, #ffffff, #f1f5f9)', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '16px' }}>⚡</span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: OA.text }}>
                            تدرج الفروع والوحدات التابعة لـ ({addEntitySelectedNode.name}):
                          </span>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: OA.textSub, lineHeight: 1.5 }}>
                          يحتوي هذا الكيان في الهيكل المؤسسي على أقسام ووحدات فرعية. يمكنك استيراد الكيان مفرداً أو اختيار ما ترغب في استيراده وتفعيله تشغيلياً:
                        </p>

                        {/* مفاتيح التبديل */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setAddEntityCascadeMode('ENTITY_ONLY')}
                            style={{
                              padding: '9px 14px',
                              borderRadius: '9px',
                              border: addEntityCascadeMode === 'ENTITY_ONLY' ? '2px solid #007AFF' : `1px solid ${OA.sepStr}`,
                              background: addEntityCascadeMode === 'ENTITY_ONLY' ? 'rgba(0,122,255,0.08)' : '#ffffff',
                              color: addEntityCascadeMode === 'ENTITY_ONLY' ? '#007AFF' : OA.textSub,
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>🏢</span>
                            <span>إضافة الكيان فقط</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAddEntityCascadeMode('WITH_CASCADE');
                              setSelectedCascadeDivisionIds(allDivIds);
                              setSelectedCascadeTeamIds(allTeamIds);
                            }}
                            style={{
                              padding: '9px 14px',
                              borderRadius: '9px',
                              border: addEntityCascadeMode === 'WITH_CASCADE' ? '2px solid #007AFF' : `1px solid ${OA.sepStr}`,
                              background: addEntityCascadeMode === 'WITH_CASCADE' ? 'rgba(0,122,255,0.08)' : '#ffffff',
                              color: addEntityCascadeMode === 'WITH_CASCADE' ? '#007AFF' : OA.textSub,
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>⚡</span>
                            <span>استيراد وتخصيص التدرج الهرمي</span>
                          </button>
                        </div>
                      </div>

                      {/* شجرة التدرج الهرمي للإدارة */}
                      {addEntityCascadeMode === 'WITH_CASCADE' && (
                        <div style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: OA.textSub }}>
                              حدد الأقسام والوحدات التابعة المراد استيرادها:
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCascadeDivisionIds(allDivIds);
                                  setSelectedCascadeTeamIds(allTeamIds);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#007AFF', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                              >
                                ✓ تحديد الكل
                              </button>
                              <span style={{ color: OA.sepStr }}>|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCascadeDivisionIds([]);
                                  setSelectedCascadeTeamIds([]);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: '2px 4px' }}
                              >
                                ✗ إلغاء التحديد
                              </button>
                            </div>
                          </div>

                          <div style={{
                            maxHeight: '220px',
                            overflowY: 'auto',
                            border: `1px solid ${OA.sep}`,
                            borderRadius: '10px',
                            background: '#ffffff'
                          }} className="admin-scroll">
                            {hasDivisions && hierarchy.divisions.map((div: any) => {
                              const isDivSelected = selectedCascadeDivisionIds.includes(div.id);
                              const divMeta = getEntityMeta(div.type);

                              return (
                                <div key={div.id} style={{
                                  borderBottom: `1px solid ${OA.sep}`,
                                  padding: '10px 14px',
                                  background: isDivSelected ? 'rgba(0,122,255,0.02)' : 'transparent'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: OA.text }}>
                                      <input
                                        type="checkbox"
                                        checked={isDivSelected}
                                        onChange={() => toggleCascadeDivision(div.id, div.teams || [])}
                                        style={{ width: '15px', height: '15px', accentColor: '#007AFF', cursor: 'pointer' }}
                                      />
                                      <span>{divMeta.icon} {div.name}</span>
                                      <span style={{
                                        fontSize: '10px',
                                        color: divMeta.color,
                                        background: divMeta.bg,
                                        border: divMeta.border,
                                        padding: '1px 6px',
                                        borderRadius: '4px'
                                      }}>
                                        {div.type}
                                      </span>
                                    </label>
                                    {div.teams && div.teams.length > 0 && (
                                      <span style={{ fontSize: '11px', color: OA.textTer }}>
                                        ({div.teams.filter((t: any) => selectedCascadeTeamIds.includes(t.id)).length}/{div.teams.length} وحدة)
                                      </span>
                                    )}
                                  </div>

                                  {/* الوحدات التابعة للقسم */}
                                  {div.teams && div.teams.length > 0 && (
                                    <div style={{ paddingInlineStart: '28px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                      {div.teams.map((team: any) => {
                                        const isTeamSelected = selectedCascadeTeamIds.includes(team.id);
                                        const teamMeta = getEntityMeta(team.type);

                                        return (
                                          <label
                                            key={team.id}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '5px 10px',
                                              borderRadius: '6px',
                                              background: isTeamSelected ? 'rgba(5, 150, 105, 0.05)' : '#fafafa',
                                              border: isTeamSelected ? '1px solid rgba(5, 150, 105, 0.2)' : `1px solid ${OA.sep}`,
                                              cursor: 'pointer',
                                              fontSize: '12px'
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <input
                                                type="checkbox"
                                                checked={isTeamSelected}
                                                onChange={() => toggleCascadeTeam(team.id, div.id)}
                                                style={{ width: '13px', height: '13px', accentColor: '#059669', cursor: 'pointer' }}
                                              />
                                              <span style={{ color: OA.text, fontWeight: isTeamSelected ? '700' : 'normal' }}>
                                                {teamMeta.icon} {team.name}
                                              </span>
                                            </div>
                                            <span style={{
                                              fontSize: '9px',
                                              color: teamMeta.color,
                                              background: teamMeta.bg,
                                              border: teamMeta.border,
                                              padding: '1px 5px',
                                              borderRadius: '4px'
                                            }}>
                                              {team.type}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ─── أزرار الإجراء السفلية ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAddEntityModalOpen(null)}
                    style={{
                      flex: 1,
                      background: OA.bg,
                      color: OA.text,
                      border: `1px solid ${OA.sepStr}`,
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    disabled={addEntityModalOpen.type === 'DIVISION' && selectedAddDivisionIds.length === 0}
                    onClick={commitAddEntity}
                    style={{
                      flex: 1.8,
                      background: (addEntityModalOpen.type === 'DIVISION' && selectedAddDivisionIds.length === 0)
                        ? '#cbd5e1'
                        : 'linear-gradient(135deg, #007AFF, #5856D6)',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: (addEntityModalOpen.type === 'DIVISION' && selectedAddDivisionIds.length === 0) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      boxShadow: (addEntityModalOpen.type === 'DIVISION' && selectedAddDivisionIds.length === 0) ? 'none' : '0 4px 14px rgba(0,122,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✓</span>
                    <span>
                      {addEntityModalOpen.type === 'DEPARTMENT' ? (
                        addEntityCascadeMode === 'WITH_CASCADE' && (selectedCascadeDivisionIds.length > 0 || selectedCascadeTeamIds.length > 0)
                          ? `إضافة وتفعيل "${addEntitySelectedNode?.name || ''}" مع (${selectedCascadeDivisionIds.length > 0 ? `${selectedCascadeDivisionIds.length} قسم` : ''}${selectedCascadeDivisionIds.length > 0 && selectedCascadeTeamIds.length > 0 ? ' و ' : ''}${selectedCascadeTeamIds.length > 0 ? `${selectedCascadeTeamIds.length} وحدة` : ''})`
                          : `إضافة وتفعيل "${addEntitySelectedNode?.name || ''}" فقط`
                      ) : addEntityModalOpen.type === 'DIVISION' ? (
                        selectedAddDivisionIds.length === 0 ? (
                          'يرجى تحديد قسم واحد على الأقل'
                        ) : selectedAddDivisionIds.length === 1 ? (
                          addEntityCascadeMode === 'WITH_CASCADE' && selectedCascadeTeamIds.length > 0
                            ? `إضافة قسم "${addEntityModalOpen.availableNodes.find((n: any) => n.id === selectedAddDivisionIds[0])?.name || ''}" مع (${selectedCascadeTeamIds.length} وحدة)`
                            : `إضافة قسم "${addEntityModalOpen.availableNodes.find((n: any) => n.id === selectedAddDivisionIds[0])?.name || ''}" فقط`
                        ) : (
                          addEntityCascadeMode === 'WITH_CASCADE' && selectedCascadeTeamIds.length > 0
                            ? `إضافة وتفعيل (${selectedAddDivisionIds.length}) أقسام مع (${selectedCascadeTeamIds.length} وحدة)`
                            : `إضافة وتفعيل (${selectedAddDivisionIds.length}) أقسام فقط`
                        )
                      ) : (
                        `إضافة فريق "${addEntitySelectedNode?.name || ''}"`
                      )}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              /* لا توجد خيارات متاحة — توجيه الأدمن للهيكل المؤسسي */
              <>
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '12px', padding: '18px', marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏛️</div>
                  <p style={{ fontSize: '14px', color: '#92400e', fontWeight: 'bold', margin: '0 0 6px' }}>
                    لا توجد {addEntityModalOpen.type === 'DEPARTMENT' ? 'إدارات أو مكاتب' : addEntityModalOpen.type === 'DIVISION' ? 'أقسام أو مكاتب فرعية' : 'وحدات أو فرق'} متاحة للإضافة
                  </p>
                  <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: 1.7 }}>
                    جميع الكيانات المعتمدة في الهيكل المؤسسي تمت إضافتها بالفعل إلى الهيكل التشغيلي،
                    أو أنك بحاجة لإضافة كيانات جديدة في <strong>تبويب الهيكل المؤسسي</strong> أولاً ثم العودة هنا لتفعيلها تشغيلياً.
                  </p>
                </div>
                <button
                  onClick={() => setAddEntityModalOpen(null)}
                  style={{
                    width: '100%',
                    background: OA.bg,
                    color: OA.text,
                    border: `1px solid ${OA.sepStr}`,
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  حسناً، فهمت
                </button>
              </>
            )}
          </div>
        </ModalBackdrop>
      )}

      {/* Universal Delete Confirmation Modal — استبدال حوار المتصفح البدائي بحوار تطبيقي راقي */}
      {deleteConfirmTarget && (
        <ModalBackdrop onClose={() => setDeleteConfirmTarget(null)}>
          <div style={{
            background: '#ffffff',
            padding: '28px',
            borderRadius: '18px',
            width: '450px',
            maxWidth: 'min(95vw, 450px)',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
            direction: 'rtl',
            textAlign: 'right',
            margin: 'auto',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                🗑️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: OA.text }}>
                  تأكيد حذف {deleteConfirmTarget.type === 'DEPARTMENT' ? 'الإدارة التشغيلية' : deleteConfirmTarget.type === 'DIVISION' ? 'القسم' : 'الفريق'}
                </h3>
                <span style={{ fontSize: '13px', color: OA.textSub, fontWeight: '600' }}>
                  ({deleteConfirmTarget.name})
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.7, margin: '0 0 22px 0' }}>
              {deleteConfirmTarget.type === 'DEPARTMENT' 
                ? 'سيتم حذف هذه الإدارة التشغيلية وجميع الأقسام والفرق التابعة لها، وإلغاء تنسيب موظفيها لإعادتهم مباشرة إلى حوض الكوادر العام دون انتساب.'
                : deleteConfirmTarget.type === 'DIVISION'
                ? 'سيتم حذف هذا القسم وتجريد الكوادر المنسوبة له وإعادتهم لإدارة القسم مباشرة.'
                : 'سيتم حذف هذا الفريق وفك ارتباط أعضائه.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                style={{
                  background: OA.bg,
                  border: `1px solid ${OA.sepStr}`,
                  color: OA.text,
                  padding: '10px 18px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={executeDeleteEntity}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '9px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                }}
              >
                تأكيد الحذف نهائياً
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Universal Edit Entity Modal */}
      {editModalOpen && (
        <ModalBackdrop onClose={() => setEditModalOpen(false)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '520px', maxWidth: 'min(95vw, 520px)', maxHeight: 'min(86vh, 720px)', overflowY: 'auto', border: `1px solid ${OA.sep}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: OA.text, fontSize: '20px', marginBottom: '20px', borderBottom: `1px solid ${OA.sep}`, paddingBottom: '10px', fontWeight: 'bold' }}>
              ✏️ تعديل {editEntityType === 'DEPARTMENT' ? 'إدارة' : editEntityType === 'DIVISION' ? 'قسم' : 'فريق'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: OA.textSub, fontSize: '13px', fontWeight: 600 }}>الاسم والمسمى</label>
                <span style={{ fontSize: '11px', color: OA.blue, background: 'rgba(0,122,255,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,122,255,0.15)', fontWeight: '600' }}>🔒 معتمد ومقيد بالشجرة المؤسسية</span>
              </div>
              <input 
                type="text" 
                value={editEntityName}
                disabled
                title="لتعديل الاسم يرجى تعديله من تبويب الهيكل المؤسسي"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${OA.sep}`, background: '#f8fafc', color: OA.textSub, fontSize: '14px', outline: 'none', cursor: 'not-allowed' }}
              />
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: OA.textTer }}>
                * اسم الكيان معتمد رسمياً ومقيد بالهيكل المؤسسي. لتعديل الاسم، قم بتعديله من تبويب "الهيكل المؤسسي".
              </p>
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', color: OA.textSub, fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>الكوادر التشغيلية (تحديد المسؤول)</label>
              
              <div 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${OA.sep}`, background: OA.bg, color: OA.text, fontSize: '14px', cursor: 'text', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setDropdownOpen(true)}
              >
                <input 
                  type="text" 
                  value={editEntityLeaderSearchTerm}
                  onChange={e => {
                    setEditEntityLeaderSearchTerm(e.target.value);
                    setDropdownOpen(true);
                    if (e.target.value === '') setEditEntityLeaderId('');
                  }}
                  placeholder="ابحث عن مسؤول (بالاسم أو الرقم)..."
                  style={{ background: 'transparent', border: 'none', color: OA.text, width: '100%', outline: 'none', fontSize: '14px' }}
                />
                <span style={{ fontSize: '12px', color: OA.textSub }}>▼</span>
              </div>
              
              {dropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: `1px solid ${OA.sepStr}`, borderRadius: '8px', marginTop: '5px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                  <div 
                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: `1px solid ${OA.sep}`, color: OA.textSub, fontSize: '13px' }}
                    onClick={() => {
                      setEditEntityLeaderId('');
                      setEditEntityLeaderSearchTerm('');
                      setDropdownOpen(false);
                    }}
                  >
                    -- بدون مسؤول حالياً --
                  </div>
                  {operationalUsers
                    .filter(u => u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.employeeId.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                    .map(u => (
                      <div 
                        key={u.id} 
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: `1px solid ${OA.sep}`, color: editEntityLeaderId === u.id ? '#007AFF' : OA.text, background: editEntityLeaderId === u.id ? 'rgba(0,122,255,0.08)' : 'transparent', fontWeight: editEntityLeaderId === u.id ? 700 : 400 }}
                        onClick={() => {
                          setEditEntityLeaderId(u.id);
                          setEditEntityLeaderSearchTerm(u.name);
                          setDropdownOpen(false);
                        }}
                      >
                        {u.name} ({u.employeeId})
                      </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px', background: OA.bg, padding: '15px', borderRadius: '10px', border: `1px solid ${OA.sep}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ color: OA.textSub, fontSize: '13px', fontWeight: 'bold' }}>تخصيص الواجهة المخصصة لهذا المنصب</label>
                {editResolution && (
                  <div style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: editResolution.isLocked ? 'rgba(239, 68, 68, 0.1)' : editResolution.source === 'LOCAL' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: editResolution.isLocked ? '#ef4444' : editResolution.source === 'LOCAL' ? '#22c55e' : '#6366f1', fontWeight: 'bold' }}>
                    {editResolution.isLocked ? '🔒 موروث ومقفل من الإدارة العليا' : editResolution.source === 'LOCAL' ? '⚙️ تخصيص نشط - Override' : '🔗 موروث تلقائياً'}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '11px', color: OA.textSub, marginBottom: '10px' }}>الواجهة التي سيتم عرضها لهذا المسؤول بمجرد تسجيل دخوله</p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={editResolution?.isLocked ? editResolution.effectiveInterfaceId || '' : editEntityUiId}
                  onChange={e => setEditEntityUiId(e.target.value)}
                  disabled={editResolution?.isLocked}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${OA.sep}`, background: editResolution?.isLocked ? 'rgba(0,0,0,0.05)' : OA.surface, color: '#007AFF', fontSize: '13px', outline: 'none', fontWeight: 'bold', cursor: editResolution?.isLocked ? 'not-allowed' : 'pointer' }}
                >
                  <option value="">-- الواجهة الافتراضية --</option>
                  {availableUIs.map(ui => (
                    <option key={ui.id} value={ui.id}>🖥️ {ui.name}</option>
                  ))}
                </select>
                <button onClick={handleCreateNewUI} disabled={editResolution?.isLocked} style={{ background: `${OA.blue}15`, color: '#007AFF', border: `1px solid ${OA.blue}30`, padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: editResolution?.isLocked ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: editResolution?.isLocked ? 0.5 : 1 }}>
                  ➕ إنشاء واجهة جديدة
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${OA.sep}`, color: OA.textSub, padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
              <button onClick={handleSaveEntity} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0, 122, 255, 0.3)' }}>حفظ التعديلات</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Warning Modal for Reassignment */}
      {pendingReassignment && (
        <ModalBackdrop onClose={() => setPendingReassignment(null)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '460px', maxWidth: 'min(95vw, 460px)', maxHeight: 'min(86vh, 500px)', overflowY: 'auto', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.2)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: OA.red, fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: شاغر تشغيلي محتمل!
            </h3>
            <p style={{ color: OA.textSub, fontSize: '14px', lineHeight: '1.6', marginBottom: '25px' }}>
              المستخدم المحدد يشغل حالياً صفة <strong>{pendingReassignment.oldRoleName}</strong>. 
              <br/><br/>
              هل أنت متأكد أنك ستقوم بنقل هذا الاسم لصفة <strong>{pendingReassignment.newRoleName}</strong> داخل الهيكل التشغيلي؟
              <br/><br/>
              موافقتك ستعني نقله وإفراغ مكانه السابق.
              <br/><br/>
              هل أنت متأكد من رغبتك في إتمام النقل؟
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setPendingReassignment(null)} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء التعيين</button>
              <button onClick={() => executeSaveEntity(pendingReassignment.userId)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>نعم، أتمم النقل وأفرغ المنصب القديم</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Delete Team Advanced Modal */}
      {deleteTeamModalOpen && teamToDelete && divisionOfTeamToDelete && (
        <ModalBackdrop onClose={() => setDeleteTeamModalOpen(false)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '520px', maxWidth: 'min(95vw, 520px)', maxHeight: 'min(86vh, 700px)', overflowY: 'auto', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.2)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: OA.red, fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> خيارات حذف فريق ({teamToDelete.name})
            </h3>
            <p style={{ color: OA.textSub, fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              يحتوي هذا الفريق على <strong>{teamToDelete.users.length + (teamToDelete.leaderId ? 1 : 0)}</strong> مستخدمين (بما في ذلك قائد الفريق). يرجى تحديد مصير هؤلاء الكوادر التشغيلية قبل إتمام عملية الحذف.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'MOVE_TO_DIVISION' ? 'rgba(59, 130, 246, 0.1)' : OA.bg, padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'MOVE_TO_DIVISION' ? '1px solid #007AFF' : `1px solid ${OA.sep}` }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'MOVE_TO_DIVISION'} onChange={() => setDeleteTeamAction('MOVE_TO_DIVISION')} />
                <div>
                  <div style={{ color: OA.text, fontWeight: 'bold', fontSize: '14px' }}>إرجاعهم تحت القسم بدون فريق</div>
                  <div style={{ color: OA.textSub, fontSize: '12px' }}>سيصبحون أفراداً عاديين متاحين للتعيين تحت "{divisionOfTeamToDelete.name}"</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'MERGE' ? 'rgba(59, 130, 246, 0.1)' : OA.bg, padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'MERGE' ? '1px solid #007AFF' : `1px solid ${OA.sep}` }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'MERGE'} onChange={() => setDeleteTeamAction('MERGE')} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: OA.text, fontWeight: 'bold', fontSize: '14px' }}>نقلهم ودمجهم مع فريق آخر داخل القسم</div>
                  <div style={{ color: OA.textSub, fontSize: '12px' }}>سيتم نقلهم جميعاً كأعضاء عاديين للفريق المختار</div>
                  {deleteTeamAction === 'MERGE' && (
                     <select 
                       value={deleteTeamTargetId} 
                       onChange={e => setDeleteTeamTargetId(e.target.value)} 
                       style={{ marginTop: '10px', width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}` }}
                     >
                        <option value="">-- اختر الفريق الوجهة --</option>
                        {divisionOfTeamToDelete.teams.filter((t: any) => t.id !== teamToDelete.id).map((t: any) => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                  )}
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'UNASSIGN' ? 'rgba(239, 68, 68, 0.1)' : OA.bg, padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'UNASSIGN' ? '1px solid #ef4444' : `1px solid ${OA.sep}` }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'UNASSIGN'} onChange={() => setDeleteTeamAction('UNASSIGN')} />
                <div>
                  <div style={{ color: OA.red, fontWeight: 'bold', fontSize: '14px' }}>تسريح إلى دليل الكوادر (خارج الهيكل)</div>
                  <div style={{ color: OA.textSub, fontSize: '12px' }}>سيتم تجريدهم من انتمائهم بالكامل ونقلهم لحوض الموظفين غير المنسبين</div>
                </div>
              </label>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteTeamModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button disabled={deleteTeamAction === 'MERGE' && !deleteTeamTargetId} onClick={executeAdvancedDeleteTeam} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: deleteTeamAction === 'MERGE' && !deleteTeamTargetId ? 'not-allowed' : 'pointer', opacity: deleteTeamAction === 'MERGE' && !deleteTeamTargetId ? 0.5 : 1, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                 تنفيذ الإجراء والحذف
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ---------------- Advanced Assignment Modals ---------------- */}

      {/* Conflict Modal */}
      {conflictModalOpen && (
        <ModalBackdrop onClose={() => setConflictModalOpen(false)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '560px', maxWidth: 'min(95vw, 560px)', maxHeight: 'min(86vh, 700px)', overflowY: 'auto', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.25)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: '#d97706', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: ارتباطات تشغيلية متعارضة
            </h3>
            <p style={{ color: OA.textSub, fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
              بعض الأسماء المحددة تشغل بالفعل وظائف وتنسيبات داخل الهيكل التشغيلي:
            </p>
            <div style={{ background: OA.bg, padding: '10px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', border: `1px solid ${OA.sep}` }} className="scrollbar-thin">
               {conflictUsersList.map(u => {
                  let roleDesc = u.role === 'OPERATIONAL_MANAGER' ? 'مدير' : u.role === 'SECTION_HEAD' ? 'رئيس قسم' : u.role === 'TEAM_LEADER' ? 'قائد فريق' : 'عضو منسب';
                  let loc = departments.find(d => d.id === u.departmentId)?.name || '';
                  if (u.divisionId) loc += ` / ` + departments.find(d => d.id === u.departmentId)?.divisions.find(dv => dv.id === u.divisionId)?.name;
                  if (u.teamId) loc += ` / ` + departments.find(d => d.id === u.departmentId)?.divisions.find(dv => dv.id === u.divisionId)?.teams.find(t => t.id === u.teamId)?.name;
                  return (
                     <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: `1px solid ${OA.sep}` }}>
                        <span style={{ color: OA.text, fontWeight: 'bold', fontSize: '13px' }}>{u.name}</span>
                        <span style={{ color: OA.textSub, fontSize: '12px' }}>{roleDesc} في ({loc})</span>
                     </div>
                  )
               })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button onClick={() => setConflictModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء الإجراء</button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => {
                    const noConflicts = selectedPoolUsers.filter(id => !conflictUsersList.some(cu => cu.id === id));
                    if (noConflicts.length === 0) {
                       alert('لا يوجد أي مستخدم غير متعارض لنقله.');
                       setConflictModalOpen(false);
                    } else {
                       setBulkAssignUsers(noConflicts);
                       setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
                       setConflictModalOpen(false);
                       setBulkAssignModalOpen(true);
                    }
                 }} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #007AFF', color: '#007AFF', padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    استبعاد المتعارضين ونقل الباقي
                 </button>
                 <button onClick={() => {
                    setBulkAssignUsers(selectedPoolUsers);
                    setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
                    setConflictModalOpen(false);
                    setBulkAssignModalOpen(true);
                 }} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}>
                    تجاوز وإفراغ ونقل الجميع
                 </button>
              </div>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Bulk Assign Destination Modal */}
      {bulkAssignModalOpen && (
        <ModalBackdrop onClose={() => setBulkAssignModalOpen(false)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '520px', maxWidth: 'min(95vw, 520px)', maxHeight: 'min(86vh, 620px)', overflowY: 'auto', border: '1px solid rgba(0, 122, 255, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 122, 255, 0.2)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: '#007AFF', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎯</span> تحديد وجهة النقل لـ ({bulkAssignUsers.length}) مستخدم
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
               <div>
                  <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>الإدارة الوجهة</label>
                  <select value={targetDeptId} onChange={e => { setTargetDeptId(e.target.value); setTargetDivId(''); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}` }}>
                     <option value="">-- اختر الإدارة --</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>
               
               {targetDeptId && (
                  <div>
                     <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>القسم الوجهة (اختياري)</label>
                     <select value={targetDivId} onChange={e => { setTargetDivId(e.target.value); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}` }}>
                        <option value="">-- تنسيب مباشر بالإدارة (بدون قسم) --</option>
                        {departments.find(d => String(d.id) === String(targetDeptId))?.divisions.map(dv => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                     </select>
                  </div>
               )}

               {targetDivId && (
                  <div>
                     <label style={{ display: 'block', color: OA.textSub, fontSize: '12px', marginBottom: '5px' }}>الفريق الوجهة (اختياري)</label>
                     <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}` }}>
                        <option value="">-- تنسيب كعضو قسم بدون فريق --</option>
                        {departments.find(d => String(d.id) === String(targetDeptId))?.divisions.find(dv => String(dv.id) === String(targetDivId))?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setBulkAssignModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button disabled={!targetDeptId} onClick={() => {
                 executeUniversalMove(bulkAssignUsers, 'ASSIGN', targetDeptId, targetDivId, targetTeamId);
                 setBulkAssignModalOpen(false);
                 setSelectedPoolUsers([]);
              }} style={{ background: '#007AFF', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: (!targetDeptId) ? 'not-allowed' : 'pointer', opacity: (!targetDeptId) ? 0.5 : 1, boxShadow: '0 4px 15px rgba(0, 122, 255, 0.3)' }}>
                 تأكيد وتنسيب الجميع
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Single Move / Manage Modal for Division Unassigned */}
      {singleMoveModalOpen && singleMoveUser && (
        <ModalBackdrop onClose={() => setSingleMoveModalOpen(false)}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', width: '480px', maxWidth: 'min(95vw, 480px)', maxHeight: 'min(86vh, 650px)', overflowY: 'auto', border: `1px solid ${OA.sep}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)', direction: 'rtl', textAlign: 'right', margin: 'auto' }}>
            <h3 style={{ color: OA.text, fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚙️</span> خيارات العضو ({singleMoveUser.name})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
               <button onClick={() => {
                  executeUniversalMove([singleMoveUser.id], 'UNASSIGN');
                  setSingleMoveModalOpen(false);
               }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: `1px solid ${OA.red}30`, color: OA.red, padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'right', fontWeight: 'bold' }}>
                  تسريح وإرجاع لحوض الكوادر كمستخدم عادي
               </button>
               
               <div style={{ marginTop: '10px', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '15px' }}>
                  <div style={{ color: OA.textSub, fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>أو نقله إلى مكان آخر:</div>
                  <select value={targetDeptId} onChange={e => { setTargetDeptId(e.target.value); setTargetDivId(''); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, marginBottom: '10px' }}>
                     <option value="">-- اختر الإدارة --</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {targetDeptId && (
                     <select value={targetDivId} onChange={e => { setTargetDivId(e.target.value); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, marginBottom: '10px' }}>
                        <option value="">-- تنسيب مباشر بالإدارة (بدون قسم) --</option>
                        {departments.find(d => String(d.id) === String(targetDeptId))?.divisions.map(dv => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                     </select>
                  )}
                  {targetDivId && (
                     <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: OA.bg, color: OA.text, border: `1px solid ${OA.sep}`, marginBottom: '15px' }}>
                        <option value="">-- تنسيب كعضو قسم بدون فريق --</option>
                        {departments.find(d => String(d.id) === String(targetDeptId))?.divisions.find(dv => String(dv.id) === String(targetDivId))?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  )}
                  <button disabled={!targetDeptId} onClick={() => {
                     executeUniversalMove([singleMoveUser.id], 'ASSIGN', targetDeptId, targetDivId, targetTeamId);
                     setSingleMoveModalOpen(false);
                  }} style={{ width: '100%', background: '#007AFF', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: (!targetDeptId) ? 'not-allowed' : 'pointer', opacity: (!targetDeptId) ? 0.5 : 1 }}>
                     تنفيذ النقل
                  </button>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setSingleMoveModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${OA.sepStr}`, color: OA.textSub, padding: '8px 15px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إغلاق</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Team Specific Member Assignment Modal */}
      {teamAssignTarget && (() => {
        const { dept, div, team } = teamAssignTarget;
        const divCandidates = div.unassignedUsers || [];
        const deptCandidates = dept.unassignedUsers || [];
        const activePool = teamAssignPoolSource === 'DIVISION' ? divCandidates : deptCandidates;

        const filteredList = activePool.filter(u => {
          if (!teamCandidateSearch.trim()) return true;
          const q = teamCandidateSearch.toLowerCase();
          return u.name.toLowerCase().includes(q) || 
                 u.employeeId.toLowerCase().includes(q) || 
                 (u.email && u.email.toLowerCase().includes(q));
        });

        const isAllSelected = filteredList.length > 0 && filteredList.every(u => selectedTeamCandidateIds.includes(u.id));

        const handleToggleSelectAll = () => {
          if (isAllSelected) {
            setSelectedTeamCandidateIds(prev => prev.filter(id => !filteredList.some(c => c.id === id)));
          } else {
            const idsToAdd = filteredList.map(c => c.id);
            setSelectedTeamCandidateIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
          }
        };

        const handleToggleUser = (userId: string) => {
          setSelectedTeamCandidateIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
          );
        };

        const handleConfirmAssignment = () => {
          if (selectedTeamCandidateIds.length === 0) return;
          const count = selectedTeamCandidateIds.length;
          const teamName = team.name;

          executeUniversalMove(selectedTeamCandidateIds, 'ASSIGN', dept.id, div.id, team.id);

          // Auto-expand tree to the target team
          setDepartments(prev => prev.map(d => {
            if (d.id === dept.id) {
              return {
                ...d,
                expanded: true,
                divisions: d.divisions.map(dv => {
                  if (dv.id === div.id) {
                    return {
                      ...dv,
                      expanded: true,
                      teams: dv.teams.map(t => {
                        if (t.id === team.id) {
                          return { ...t, expanded: true };
                        }
                        return t;
                      })
                    };
                  }
                  return dv;
                })
              };
            }
            return d;
          }));

          setTeamAssignTarget(null);
          setSelectedTeamCandidateIds([]);
          setTeamCandidateSearch('');
          setTeamAssignSuccessToast(`تم بنجاح تنسيب ${count} كادر إلى فريق "${teamName}"`);
          setTimeout(() => {
            setTeamAssignSuccessToast(null);
          }, 4500);
        };

        return (
          <ModalBackdrop onClose={() => setTeamAssignTarget(null)}>
            <div style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '580px',
              maxWidth: 'min(95vw, 580px)',
              maxHeight: 'min(88vh, 700px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              direction: 'rtl',
              textAlign: 'right',
              margin: 'auto'
            }}>
              {/* Top Accent Line */}
              <div style={{ height: '4px', background: 'linear-gradient(90deg, #007AFF, #5856D6, #AF52DE)' }} />

              {/* Header */}
              <div style={{ padding: '22px 26px 16px', borderBottom: `1px solid ${OA.sep}`, background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.15), rgba(88, 86, 214, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#007AFF', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                      👥
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: OA.text, fontSize: '17px', fontWeight: '800', letterSpacing: '-0.3px' }}>
                        تنسيب أعضاء إلى الفريق
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span style={{ fontSize: '12px', color: OA.textSub }}>الفريق المستهدف:</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#007AFF', background: 'rgba(0, 122, 255, 0.08)', padding: '1px 8px', borderRadius: '6px', border: '1px solid rgba(0, 122, 255, 0.2)' }}>
                          {team.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTeamAssignTarget(null)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.04)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: OA.textSub,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      transition: 'all 0.15s ease'
                    }}
                    title="إغلاق"
                  >
                    ✕
                  </button>
                </div>

                {/* Breadcrumb Hierarchy */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: OA.textTer, background: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${OA.sep}` }}>
                  <span>🏢 {dept.name}</span>
                  <span>◂</span>
                  <span style={{ color: OA.textSub, fontWeight: '600' }}>📂 {div.name}</span>
                  <span>◂</span>
                  <span style={{ color: '#007AFF', fontWeight: '700' }}>👥 {team.name}</span>
                </div>

                {/* Pool Source Selection Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => { setTeamAssignPoolSource('DIVISION'); setSelectedTeamCandidateIds([]); }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: teamAssignPoolSource === 'DIVISION' ? '1px solid #007AFF' : `1px solid ${OA.sep}`,
                      background: teamAssignPoolSource === 'DIVISION' ? 'rgba(0, 122, 255, 0.1)' : '#ffffff',
                      color: teamAssignPoolSource === 'DIVISION' ? '#007AFF' : OA.textSub,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>منسوبو القسم ({div.name})</span>
                    <span style={{
                      background: teamAssignPoolSource === 'DIVISION' ? '#007AFF' : 'rgba(0,0,0,0.08)',
                      color: teamAssignPoolSource === 'DIVISION' ? '#ffffff' : OA.textSub,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '11px'
                    }}>
                      {divCandidates.length}
                    </span>
                  </button>

                  {deptCandidates.length > 0 && (
                    <button
                      onClick={() => { setTeamAssignPoolSource('DEPARTMENT'); setSelectedTeamCandidateIds([]); }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: teamAssignPoolSource === 'DEPARTMENT' ? '1px solid #007AFF' : `1px solid ${OA.sep}`,
                        background: teamAssignPoolSource === 'DEPARTMENT' ? 'rgba(0, 122, 255, 0.1)' : '#ffffff',
                        color: teamAssignPoolSource === 'DEPARTMENT' ? '#007AFF' : OA.textSub,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>منسوبو الإدارة العامة</span>
                      <span style={{
                        background: teamAssignPoolSource === 'DEPARTMENT' ? '#007AFF' : 'rgba(0,0,0,0.08)',
                        color: teamAssignPoolSource === 'DEPARTMENT' ? '#ffffff' : OA.textSub,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}>
                        {deptCandidates.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter & Controls Toolbar */}
              <div style={{ padding: '14px 24px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: `1px solid ${OA.sep}`, background: '#FFFFFF' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    value={teamCandidateSearch}
                    onChange={e => setTeamCandidateSearch(e.target.value)}
                    placeholder="بحث بالاسم، الرقم الوظيفي، أو البريد..."
                    style={{
                      width: '100%',
                      padding: '9px 34px 9px 12px',
                      borderRadius: '9px',
                      border: `1px solid ${OA.sepStr}`,
                      background: OA.bg,
                      color: OA.text,
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', color: OA.textTer, fontSize: '13px', pointerEvents: 'none' }}>
                    🔍
                  </span>
                  {teamCandidateSearch && (
                    <button
                      onClick={() => setTeamCandidateSearch('')}
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: OA.textTer, cursor: 'pointer', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={handleToggleSelectAll}
                  disabled={filteredList.length === 0}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '9px',
                    border: `1px solid ${OA.sepStr}`,
                    background: isAllSelected ? 'rgba(0, 122, 255, 0.1)' : OA.bg,
                    color: isAllSelected ? '#007AFF' : OA.textSub,
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: filteredList.length === 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: filteredList.length === 0 ? 0.5 : 1
                  }}
                >
                  {isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد كل المعروض'}
                </button>
              </div>

              {/* Candidate List Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '220px', maxHeight: '340px' }} className="admin-scroll">
                {filteredList.length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '30px 10px', color: OA.textSub }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.6 }}>👥</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: OA.text, marginBottom: '4px' }}>
                      {activePool.length === 0 
                        ? (teamAssignPoolSource === 'DIVISION' ? 'لا يوجد كوادر غير موزعة في هذا القسم حالياً' : 'لا يوجد كوادر غير مفرزة في هذه الإدارة')
                        : 'لا توجد نتائج تطابق بحثك'}
                    </div>
                    <p style={{ fontSize: '12px', color: OA.textTer, margin: 0, maxWidth: '380px' }}>
                      {activePool.length === 0
                        ? 'يمكنك تنسيب موظفين من جدول "دليل الكوادر التشغيلية" بالأسفل واختيار هذا القسم ليظهروا هنا كمرشحين للتوزيع على الفرق.'
                        : 'جرّب كتابة اسم أو رقم وظيفي مختلف.'}
                    </p>
                  </div>
                ) : (
                  filteredList.map(candidate => {
                    const isSelected = selectedTeamCandidateIds.includes(candidate.id);
                    return (
                      <div
                        key={candidate.id}
                        onClick={() => handleToggleUser(candidate.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '11px',
                          border: isSelected ? '1.5px solid #007AFF' : `1px solid ${OA.sep}`,
                          background: isSelected ? 'rgba(0, 122, 255, 0.05)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 8px rgba(0, 122, 255, 0.12)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleUser(candidate.id)}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#007AFF' }}
                          />
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isSelected ? '#007AFF' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.35))',
                            color: isSelected ? '#ffffff' : '#b45309',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: '700'
                          }}>
                            {candidate.name[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: OA.text }}>
                              {candidate.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', color: OA.textTer }}>{candidate.employeeId}</span>
                              {candidate.email && (
                                <>
                                  <span style={{ fontSize: '9px', color: OA.textTer }}>•</span>
                                  <span style={{ fontSize: '11px', color: OA.textSub }}>{candidate.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(0, 122, 255, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                          color: isSelected ? '#007AFF' : '#d97706',
                          border: isSelected ? '1px solid rgba(0, 122, 255, 0.25)' : '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                          {isSelected ? 'محدد للتنسيب' : 'منسب للقسم'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${OA.sep}`, background: '#FAFAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12px', color: OA.textSub, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>تم تحديد:</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: selectedTeamCandidateIds.length > 0 ? '#007AFF' : OA.textTer }}>
                    {selectedTeamCandidateIds.length}
                  </span>
                  <span>من أصل {filteredList.length} كادر</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setTeamAssignTarget(null)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${OA.sepStr}`,
                      color: OA.textSub,
                      padding: '10px 18px',
                      borderRadius: '9px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    إلغاء
                  </button>
                  <button
                    disabled={selectedTeamCandidateIds.length === 0}
                    onClick={handleConfirmAssignment}
                    style={{
                      background: selectedTeamCandidateIds.length > 0 ? 'linear-gradient(135deg, #007AFF, #5856D6)' : '#94a3b8',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 22px',
                      borderRadius: '9px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: selectedTeamCandidateIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedTeamCandidateIds.length === 0 ? 0.6 : 1,
                      boxShadow: selectedTeamCandidateIds.length > 0 ? '0 4px 14px rgba(0, 122, 255, 0.35)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✓</span>
                    <span>تأكيد التنسيب إلى {team.name} ({selectedTeamCandidateIds.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </ModalBackdrop>
        );
      })()}

      {/* Global Success Notification Toast */}
      {teamAssignSuccessToast && createPortal(
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
          zIndex: 200000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          direction: 'rtl',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <span style={{ fontSize: '18px' }}>🎉</span>
          <span>{teamAssignSuccessToast}</span>
          <button 
            onClick={() => setTeamAssignSuccessToast(null)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              marginInlineStart: '8px'
            }}
          >
            ✕
          </button>
        </div>,
        document.body
      )}

    </div>
  );
};

