/**
 * institutionalHierarchy.helpers.ts
 * دوال استخراج المستويات الهرمية من الشجرة المؤسسية الحقيقية (الهيكل المؤسسي)
 * المستوى 1: الإدارة / الإدارة العليا / المكتب
 * المستوى 2: الأقسام والدوائر التابعة للإدارة المحددة
 * المستوى 3: الوحدات والفرق التابعة للقسم المحدد
 */

export interface HierarchyNode {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
  rawNode?: any;
}

export type InstitutionalNode = HierarchyNode;

export const DEPT_TYPES = ['إدارة', 'مكتب', 'إدارة عليا'];
export const DIV_TYPES = ['قسم', 'دائرة'];
export const TEAM_TYPES = ['وحدة', 'فريق'];

/** جلب الإدارات والمكاتب العليا من الشجرة */
export function getTopLevelDepartments(tree: any): HierarchyNode[] {
  if (!tree) return [];
  const results: HierarchyNode[] = [];
  const seenIds = new Set<string>();

  function traverse(node: any) {
    if (!node) return;
    if (DEPT_TYPES.includes(node.type) && !seenIds.has(node.id)) {
      seenIds.add(node.id);
      results.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(tree);
  return results;
}

/** البحث عن عقدة في الشجرة بالمعرف أو الاسم */
export function findNodeInTree(tree: any, idOrName: string): any | null {
  if (!tree || !idOrName) return null;
  if (tree.id === idOrName || tree.name === idOrName) return tree;
  if (Array.isArray(tree.children)) {
    for (const child of tree.children) {
      const found = findNodeInTree(child, idOrName);
      if (found) return found;
    }
  }
  return null;
}

/** جلب الأقسام والدوائر التابعة لإدارة أو مكتب محدد */
export function getDivisionsForDepartment(tree: any, deptIdOrName: string): HierarchyNode[] {
  if (!tree || !deptIdOrName) return [];
  const deptNode = findNodeInTree(tree, deptIdOrName);
  if (!deptNode || !Array.isArray(deptNode.children)) return [];

  const divisions: HierarchyNode[] = [];
  const seenIds = new Set<string>();

  function scan(node: any) {
    if (!node) return;
    if (DIV_TYPES.includes(node.type) && !seenIds.has(node.id)) {
      seenIds.add(node.id);
      divisions.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        // لا نتجاوز إلى إدارة فرعية مستقلة
        if (!DEPT_TYPES.includes(c.type)) {
          scan(c);
        }
      }
    }
  }

  for (const child of deptNode.children) {
    scan(child);
  }
  return divisions;
}

/** جلب الوحدات والفرق التابعة لقسم محدد */
export function getTeamsForDivision(tree: any, divisionIdOrName: string): HierarchyNode[] {
  if (!tree || !divisionIdOrName) return [];
  const divNode = findNodeInTree(tree, divisionIdOrName);
  if (!divNode || !Array.isArray(divNode.children)) return [];

  const teams: HierarchyNode[] = [];
  const seenIds = new Set<string>();

  function scan(node: any) {
    if (!node) return;
    if (TEAM_TYPES.includes(node.type) && !seenIds.has(node.id)) {
      seenIds.add(node.id);
      teams.push({ id: node.id, name: node.name, type: node.type, rawNode: node });
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) {
        scan(c);
      }
    }
  }

  for (const child of divNode.children) {
    scan(child);
  }
  return teams;
}

/** جلب الشجرة المؤسسية من الذاكرة المحلية أو من الخادم */
export async function loadCachedOrRemoteOrgTree(): Promise<any | null> {
  try {
    const cached = localStorage.getItem('litc_org_tree');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.id || parsed.children)) return parsed;
    }
  } catch {}

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/v1/org/tree', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      const tree = data.tree || (data.id ? data : null);
      if (tree) {
        localStorage.setItem('litc_org_tree', JSON.stringify(tree));
        return tree;
      }
    }
  } catch (err) {
    console.warn('[InstitutionalHierarchy] Failed to fetch remote org tree:', err);
  }
  return null;
}
