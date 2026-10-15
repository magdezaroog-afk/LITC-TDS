import React, { useState } from 'react';

const APPLE = {
  bg: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  separator: 'rgba(0,0,0,0.08)',
  shadowCard: '0 4px 16px rgba(0,0,0,0.04)',
  radiusLg: '20px',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
};




import { OrgNode } from './orgStructureTypes';
import { AdminAPI } from '../../../services/admin.api';


const SVGConnections: React.FC<{ tree: OrgNode, containerRef: React.RefObject<HTMLDivElement>, zoom: number }> = ({ tree, containerRef, zoom }) => {
  const [lines, setLines] = React.useState<{ x1: number, y1: number, x2: number, y2: number }[]>([]);

  React.useEffect(() => {
    let frameId: number;
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: { x1: number, y1: number, x2: number, y2: number }[] = [];

      const traverse = (node: OrgNode) => {
        const parentEl = document.getElementById(`org-node-${node.id}`);
        if (parentEl) {
          const parentRect = parentEl.getBoundingClientRect();
          const x1 = ((parentRect.left - containerRect.left) / zoom) + ((parentRect.width / zoom) / 2);
          const y1 = ((parentRect.top - containerRect.top) / zoom) + (parentRect.height / zoom);

          node.children.forEach(child => {
            const childEl = document.getElementById(`org-node-${child.id}`);
            if (childEl) {
              const childRect = childEl.getBoundingClientRect();
              const x2 = ((childRect.left - containerRect.left) / zoom) + ((childRect.width / zoom) / 2);
              const y2 = ((childRect.top - containerRect.top) / zoom);
              newLines.push({ x1, y1, x2, y2 });
            }
            traverse(child);
          });
        }
      };
      traverse(tree);
      setLines(newLines);
      frameId = requestAnimationFrame(updateLines);
    };
    frameId = requestAnimationFrame(updateLines);
    return () => cancelAnimationFrame(frameId);
  }, [tree, containerRef, zoom]);

  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
      {lines.map((line, i) => {
        const midY = (line.y1 + line.y2) / 2;
        const d = `M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`;
        return <path key={i} d={d} fill="none" stroke="#cbd5e1" strokeWidth="2" />
      })}
    </svg>
  );
};



const DraggableCard: React.FC<{ node: OrgNode, isRoot: boolean, zoom: number, onEdit: (node: OrgNode) => void, onDelete: (id: string) => void, onAdd: (id: string) => void, saveStyles: (id: string, x: number, y: number, w: number, h: number) => void }> = ({ node, isRoot, zoom, onEdit, onDelete, onAdd, saveStyles }) => {
  const [pos, setPos] = React.useState({ x: node.x || 0, y: node.y || 0 });
  const [size, setSize] = React.useState({ w: node.w || 160, h: node.h || 80 });
  const isDragging = React.useRef(false);
  const startPos = React.useRef({ x: 0, y: 0 });
  const initialPos = React.useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isResizeHandle = e.clientY > rect.bottom - 20 && (e.clientX < rect.left + 20 || e.clientX > rect.right - 20);
    if (isResizeHandle) return;

    e.preventDefault();
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...pos };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = (e.clientX - startPos.current.x) / zoom;
    const dy = (e.clientY - startPos.current.y) / zoom;
    setPos({ x: initialPos.current.x + dx, y: initialPos.current.y + dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    const el = document.getElementById(`org-node-${node.id}`);
    const newW = el?.offsetWidth || size.w;
    const newH = el?.offsetHeight || size.h;
    setSize({ w: newW, h: newH });
    saveStyles(node.id, pos.x, pos.y, newW, newH);
  };

  let shapeStyle: React.CSSProperties = {};
  const currentShape = node.shape && node.shape !== 'افتراضي' ? node.shape : node.type;
  
  switch (currentShape) {
    case 'إدارة عليا':
    case 'مستطيل':
      shapeStyle = { borderRadius: '0px', border: '2px solid #fbbf24', boxShadow: '0 8px 16px rgba(251,191,36,0.2)' };
      break;
    case 'إدارة':
    case 'مستطيل بحواف دائرية':
      shapeStyle = { borderRadius: '12px', border: '2px solid #3b82f6' };
      break;
    case 'دائرة':
      shapeStyle = { borderRadius: '20px', border: '2px solid #06b6d4', boxShadow: '0 4px 10px rgba(6,182,212,0.1)' };
      break;
    case 'مكتب':
    case 'ورقة شجر يمين':
      shapeStyle = { borderRadius: '30px 0 30px 0', border: '2px solid #10b981' };
      break;
    case 'قسم':
    case 'بيضاوي':
      shapeStyle = { borderRadius: '50px', border: '2px solid #8b5cf6' };
      break;
    case 'وحدة':
    case 'ورقة شجر يسار':
      shapeStyle = { borderRadius: '0 30px 0 30px', border: '2px solid #f43f5e' };
      break;
    default:
      shapeStyle = { borderRadius: '12px', border: '2px solid #94a3b8' };
  }

  return (
    <div id={`org-node-${node.id}`} className="org-card" 
         onPointerDown={handlePointerDown} 
         onPointerMove={handlePointerMove} 
         onPointerUp={handlePointerUp}
         style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: size.w, height: size.h, position: 'relative', zIndex: 1, cursor: 'move', resize: 'both', overflow: 'hidden', ...shapeStyle }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '6px 8px', boxSizing: 'border-box', zIndex: 2 }}>
        <div className="org-card-type">{node.type}</div>
        <div className="org-card-actions">
          <button onClick={() => onEdit(node)}>✏️</button>
          {!isRoot && <button onClick={() => onDelete(node.id)} style={{color: '#FF3B30'}}>🗑️</button>}
        </div>
      </div>

      {/* Main Text */}
      <div className="org-card-name" style={{ flex: 1, padding: '0 8px', boxSizing: 'border-box' }}>{node.name}</div>
      
      {/* Footer */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '4px', boxSizing: 'border-box', zIndex: 2 }}>
        <button className="org-add-btn" onClick={() => onAdd(node.id)} title="إضافة فرع أسفل هذا الكيان">+</button>
      </div>
    </div>
  );
};


export const loadBuildings = (): any[] => {
  try {
    const cached = localStorage.getItem('litc_buildings');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

export const InstitutionalStructureTab: React.FC<{ orgTree: OrgNode, setOrgTree: React.Dispatch<React.SetStateAction<OrgNode>> }> = ({ orgTree, setOrgTree }) => {
  const [activeSubTab, setActiveSubTab] = useState<'buildings' | 'pool' | 'spatial'>('buildings');
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [poolSearchQuery, setPoolSearchQuery] = useState('');

  React.useEffect(() => {
    AdminAPI.getUserPool().then(data => {
      if (Array.isArray(data)) {
        setUnassignedUsers(data);
      }
    }).catch(err => console.error('Failed to load user pool:', err));
  }, []);
  
  const findNodeById = (root: OrgNode, id: string): OrgNode | null => {
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
    return null;
  };

  const [bgImage, setBgImage] = useState<string | null>(() => {
    try { return localStorage.getItem('litc_org_bg'); } catch { return null; }
  });
  
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setBgImage(base64);
        localStorage.setItem('litc_org_bg', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const [bgSettings, setBgSettings] = useState(() => {
    try {
      const s = localStorage.getItem('litc_org_bg_settings');
      if (s) return JSON.parse(s);
    } catch {}
    return { size: 'cover', position: 'center', opacity: 0.4, blur: 2 };
  });

  const updateBgSettings = (key: string, val: string | number) => {
    setBgSettings((prev: any) => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('litc_org_bg_settings', JSON.stringify(next));
      return next;
    });
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // --- Proper Pan+Zoom engine ---
  const [treePanZoom, setTreePanZoom] = useState({ x: 40, y: 40, scale: 1 });
  const panzoomState = React.useRef({ isPanning: false, startX: 0, startY: 0 });

  const handleViewportPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.org-card') || (e.target as HTMLElement).tagName === 'BUTTON') return;
    if (bgDragState.current.isDragging) return;
    e.preventDefault();
    panzoomState.current = { isPanning: true, startX: e.clientX - treePanZoom.x, startY: e.clientY - treePanZoom.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleViewportPointerMove = (e: React.PointerEvent) => {
    if (!panzoomState.current.isPanning) return;
    setTreePanZoom(prev => ({ ...prev, x: e.clientX - panzoomState.current.startX, y: e.clientY - panzoomState.current.startY }));
  };

  const handleViewportPointerUp = () => { panzoomState.current.isPanning = false; };

  const handleViewportWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTreePanZoom(prev => {
      const newScale = Math.min(4, Math.max(0.08, prev.scale * factor));
      const ratio = newScale / prev.scale;
      return { x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio, scale: newScale };
    });
  };

  const handleFitToView = () => setTreePanZoom({ x: 40, y: 40, scale: 1 });

  // --- Background / Logo state ---
  const [bgMode, setBgMode] = useState<'wallpaper' | 'logo'>('wallpaper');
  const [bgPanel, setBgPanel] = useState(false);
  const bgDragState = React.useRef({ isDragging: false, startX: 0, startY: 0, bgX: 0, bgY: 0 });

  const handleBgImgPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const isWallpaper = bgMode === 'wallpaper';
    bgDragState.current = { 
      isDragging: true, startX: e.clientX, startY: e.clientY, 
      bgX: isWallpaper ? (bgSettings.wallX ?? 50) : (bgSettings.logoX ?? 5), 
      bgY: isWallpaper ? (bgSettings.wallY ?? 50) : (bgSettings.logoY ?? 5) 
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handleBgImgPointerMove = (e: React.PointerEvent) => {
    if (!bgDragState.current.isDragging) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    if (bgMode === 'wallpaper') {
      updateBgSettings('wallX', bgDragState.current.bgX + ((e.clientX - bgDragState.current.startX) / rect.width) * 100);
      updateBgSettings('wallY', bgDragState.current.bgY + ((e.clientY - bgDragState.current.startY) / rect.height) * 100);
    } else {
      updateBgSettings('logoX', bgDragState.current.bgX + ((e.clientX - bgDragState.current.startX) / rect.width) * 100);
      updateBgSettings('logoY', bgDragState.current.bgY + ((e.clientY - bgDragState.current.startY) / rect.height) * 100);
    }
  };
  const handleBgImgPointerUp = () => { bgDragState.current.isDragging = false; };

  // --- Toolbar style constants ---
  const toolbarBtn: React.CSSProperties = {
    width: '32px', height: '32px', border: 'none', background: 'transparent',
    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#334155', transition: 'background 0.15s',
  };
  const toolbarSep: React.CSSProperties = {
    width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)', margin: '0 2px', flexShrink: 0,
  };

  const saveNodeStyles = (id: string, x: number, y: number, w: number, h: number) => {
    const saveRec = (n: OrgNode): OrgNode => {
      if (n.id === id) return { ...n, x, y, w, h };
      return { ...n, children: n.children.map(saveRec) };
    };
    updateDraft(saveRec(draftOrgTree));
  };

  // Local draft state for the org tree and save controls
  const [draftOrgTree, setDraftOrgTree] = useState<OrgNode>(orgTree);
  const [isAutoSave, setIsAutoSave] = useState(true);

  // New States: View Mode, Search, Focus, List View Expansion
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [expandedListNodes, setExpandedListNodes] = useState<Set<string>>(new Set([orgTree.id]));

  const toggleListExpand = (id: string) => {
    setExpandedListNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Find a node by ID
  const findNode = (node: OrgNode, id: string): OrgNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  const getFocusedTree = () => {
    if (!focusedNodeId) return draftOrgTree;
    const focused = findNode(draftOrgTree, focusedNodeId);
    return focused || draftOrgTree;
  };

  // Render List View
  const renderListView = (node: OrgNode, level: number = 0) => {
    const isExpanded = expandedListNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} style={{ marginLeft: level === 0 ? 0 : '24px', position: 'relative' }}>
        {level > 0 && (
          <div style={{ position: 'absolute', right: '-12px', top: '16px', width: '12px', height: '1px', background: '#cbd5e1' }} />
        )}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {hasChildren ? (
              <button onClick={() => toggleListExpand(node.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#64748b', width: '20px', padding: 0 }}>
                {isExpanded ? '▼' : '◀'}
              </button>
            ) : (
              <div style={{ width: '20px' }} />
            )}
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>{node.type}</span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{node.name}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { setAddingToNodeId(node.id); setNewNodeName(''); setNewNodeType('قسم'); setNewNodeShape('افتراضي'); }} title="إضافة فرع" style={{ border: 'none', background: '#f0fdf4', color: '#16a34a', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>+ إضافة</button>
            <button onClick={() => handleEditNode(node.id, node.name)} title="تعديل" style={{ border: 'none', background: '#f1f5f9', color: '#475569', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>تعديل</button>
            {node.id !== draftOrgTree.id && (
              <button onClick={() => handleDeleteNode(node.id)} title="حذف" style={{ border: 'none', background: '#fef2f2', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>حذف</button>
            )}
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '12px' }}>
            {node.children.map(child => renderListView(child, level + 1))}
          </div>
        )}
      </div>
    );
  };



  // Inline Add form state
  const [addingToNodeId, setAddingToNodeId] = useState<string | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('إدارة');
  const [newNodeShape, setNewNodeShape] = useState('افتراضي');
  
  const [editingNodeInfo, setEditingNodeInfo] = useState<{ id: string, name: string, type: string, shape: string } | null>(null);

  // Smart Deletion Wizard State
  const [smartDeleteWizard, setSmartDeleteWizard] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    nodeName: string | null;
    isLoading: boolean;
    error: string | null;
    data: any | null;
    userAction: 'pool' | 'reassign' | null;
    targetDeptIdForUsers: string | null;
    flowAction: 'deactivate' | 'reroute' | null;
    targetDeptIdForFlows: string | null;
  }>({
    isOpen: false, nodeId: null, nodeName: null, isLoading: false, error: null, data: null,
    userAction: null, targetDeptIdForUsers: null, flowAction: null, targetDeptIdForFlows: null
  });

  React.useEffect(() => {
    setDraftOrgTree(orgTree);
  }, [orgTree]);

  const updateDraft = async (newTree: OrgNode) => {
    setDraftOrgTree(newTree);
    if (isAutoSave) {
      try {
        await AdminAPI.saveInstitutionalTree(newTree);
        setOrgTree(newTree);
      } catch (err: any) {
        console.error('Auto-save org tree failed:', err);
        setSaveMsg('ERR: ' + (err.message || 'فشل الحفظ'));
        setTimeout(() => setSaveMsg(null), 8000);
      }
    }
  };

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      await AdminAPI.saveInstitutionalTree(draftOrgTree);
      setOrgTree(draftOrgTree);
      setSaveMsg('OK: تم حفظ الهيكل التنظيمي بنجاح في قاعدة البيانات!');
    } catch (e: any) {
      setSaveMsg('ERR: ' + (e.message || 'فشل حفظ الهيكل. تأكد من اتصال الخادم.'));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMsg(null), 8000);
    }
  };


  // Building State (kept simple for physical locations if needed)
  const [buildings, setBuildings] = useState<{id: string | number, globalId: string, name: string, type: 'BUILDING' | 'LOCATION'}[]>(loadBuildings);
  
  React.useEffect(() => {
    AdminAPI.getBuildings().then(data => {
      const list = Array.isArray(data) ? data : (data?.buildings || []);
      setBuildings(list);
      localStorage.setItem('litc_buildings', JSON.stringify(list));
    }).catch(err => console.error('Failed to load buildings', err));
  }, []);

    const handleAssignUser = async (userId: string) => {
    if (window.confirm('سيتم نقل هذا المستخدم إلى الهيكل التشغيلي ومنحه رتبة. المتابعة؟')) {
      try {
        await AdminAPI.assignUser(parseInt(userId), null, null, 26);
        setUnassignedUsers(prev => prev.filter(u => String(u.id) !== String(userId)));
        alert('تم تنسيب المستخدم بنجاح وانتقل إلى الهيكل التشغيلي.');
      } catch(e) { console.error(e); alert('حدث خطأ'); }
    }
  };

  const handleAssignSelectedUsers = async () => {
    if (selectedUsers.size === 0) return;
    if (window.confirm(`سيتم نقل ${selectedUsers.size} مستخدم(ين) إلى الهيكل التشغيلي. المتابعة؟`)) {
      try {
        const promises = Array.from(selectedUsers).map(id => AdminAPI.assignUser(parseInt(id), null, null, 26));
        await Promise.all(promises);
        setUnassignedUsers(prev => prev.filter(u => !selectedUsers.has(String(u.id))));
        setSelectedUsers(new Set());
        alert('تم التنسيب بنجاح.');
      } catch (e) {
        console.error(e); alert('حدث خطأ');
      }
    }
  };

  const filteredPool = unassignedUsers.filter(u => 
    (u.fullName || u.username || '').toLowerCase().includes(poolSearchQuery.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(poolSearchQuery.toLowerCase())
  );
  
  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredPool.length && filteredPool.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredPool.map(u => String(u.id))));
    }
  };

  const [buildingModal, setBuildingModal] = useState<{isOpen: boolean, isEdit: boolean, id?: string, name: string, type: 'BUILDING' | 'LOCATION'}>({isOpen: false, isEdit: false, name: '', type: 'BUILDING'});

  const handleAddBuilding = () => {
    setBuildingModal({ isOpen: true, isEdit: false, name: '', type: 'BUILDING' });
  };

  const handleEditBuilding = (id: string, oldName: string, oldType?: 'BUILDING' | 'LOCATION') => {
    setBuildingModal({ isOpen: true, isEdit: true, id, name: oldName, type: oldType || 'BUILDING' });
  };

  const saveBuildingModal = () => {
    if (!buildingModal.name.trim()) return;
    if (buildingModal.isEdit && buildingModal.id) {
      const updated = buildings.map(b => (String(b.id) === String(buildingModal.id) || b.globalId === buildingModal.id) ? { ...b, name: buildingModal.name.trim(), type: buildingModal.type } : b);
      setBuildings(updated);
      AdminAPI.saveBuildings(updated).then((res: any) => {
        if (res && Array.isArray(res.buildings)) {
          setBuildings(res.buildings);
          localStorage.setItem('litc_buildings', JSON.stringify(res.buildings));
        }
      }).catch(e => {
        console.error(e);
        alert('حدث خطأ أثناء حفظ التعديل: ' + (e.message || ''));
      });
    } else {
      const newB: { id: string; globalId: string; name: string; type: 'BUILDING' | 'LOCATION' } = { 
        id: `b_${Date.now()}`, globalId: `b_${Date.now()}`, name: buildingModal.name.trim(), type: buildingModal.type 
      };
      const updated = [...buildings, newB];
      setBuildings(updated);
      AdminAPI.saveBuildings(updated).then((res: any) => {
        if (res && Array.isArray(res.buildings)) {
          setBuildings(res.buildings);
          localStorage.setItem('litc_buildings', JSON.stringify(res.buildings));
        }
      }).catch(e => {
        console.error(e);
        alert('حدث خطأ أثناء حفظ المبنى الجديد: ' + (e.message || ''));
      });
    }
    setBuildingModal({ isOpen: false, isEdit: false, name: '', type: 'BUILDING' });
  };

  const handleDeleteBuilding = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المبنى/الموقع؟ سيتم حفظ التغيير نهائياً.')) {
      const updated = buildings.filter(b => String(b.id) !== String(id) && b.globalId !== id);
      setBuildings(updated);
      AdminAPI.saveBuildings(updated).then((res: any) => {
        if (res && Array.isArray(res.buildings)) {
          setBuildings(res.buildings);
          localStorage.setItem('litc_buildings', JSON.stringify(res.buildings));
        }
      }).catch(e => {
        console.error('[Buildings] Failed to sync delete with backend:', e);
        alert('حدث خطأ أثناء حذف المبنى: ' + (e.message || ''));
      });
    }
  };

  // --- Tree Operations ---
  const commitAddChildNode = (addAnother: boolean = false) => {
    if (!newNodeName.trim() || !addingToNodeId) return;

    const newNode: OrgNode = {
      id: Date.now().toString(),
      name: newNodeName,
      type: newNodeType,
      children: []
    };

    const addNodeRecursive = (node: OrgNode): OrgNode => {
      if (node.id === addingToNodeId) {
        return { ...node, children: [...node.children, newNode] };
      }
      return { ...node, children: node.children.map(addNodeRecursive) };
    };

    updateDraft(addNodeRecursive(draftOrgTree));
    setNewNodeName('');
      setNewNodeType('إدارة');
      setNewNodeShape('افتراضي');
    
    if (!addAnother) {
      setAddingToNodeId(null);
    }
  };

  const handleEditNode = (nodeId: string, currentName: string) => {
    // Find the node to get its full data
    const node = findNodeById(draftOrgTree, nodeId);
    if (node) {
      setEditingNodeInfo({ id: node.id, name: node.name, type: node.type, shape: node.shape || 'افتراضي' });
    }
  };
  
  const commitEditNode = () => {
    if (editingNodeInfo && editingNodeInfo.name.trim()) {
      const editRecursive = (n: OrgNode): OrgNode => {
        if (n.id === editingNodeInfo.id) {
          return { ...n, name: editingNodeInfo.name.trim(), type: editingNodeInfo.type, shape: editingNodeInfo.shape };
        }
        return { ...n, children: n.children.map(editRecursive) };
      };
      updateDraft(editRecursive(draftOrgTree));
      setEditingNodeInfo(null);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (nodeId === orgTree.id) {
      alert('لا يمكن حذف الجذر الرئيسي للمؤسسة!');
      return;
    }
    const node = findNodeById(draftOrgTree, nodeId);
    if (!node) return;

    // Open Wizard
    setSmartDeleteWizard(prev => ({ ...prev, isOpen: true, nodeId, nodeName: node.name, isLoading: true, error: null, data: null, userAction: 'pool', flowAction: 'deactivate', targetDeptIdForUsers: '', targetDeptIdForFlows: '' }));
    
    try {
      const res = await AdminAPI.checkDepartmentDependencies(node.name);
      setSmartDeleteWizard(prev => ({ ...prev, isLoading: false, data: res }));
    } catch (err: any) {
      setSmartDeleteWizard(prev => ({ ...prev, isLoading: false, error: err.message || 'فشل الفحص' }));
    }
  };

  const executeSmartDelete = async () => {
    if (!smartDeleteWizard.nodeId || !smartDeleteWizard.nodeName || !smartDeleteWizard.data) return;

    const { data, userAction, targetDeptIdForUsers, flowAction, targetDeptIdForFlows, nodeId } = smartDeleteWizard;
    
    const deleteRecursive = (node: OrgNode): OrgNode | null => {
      if (node.id === nodeId) return null;
      return {
        ...node,
        children: node.children.map(deleteRecursive).filter((n): n is OrgNode => n !== null)
      };
    };

    const newTree = deleteRecursive(draftOrgTree);
    if (!newTree) return;

    if (!data.hasOperational) {
      // Fast path: no operational dependencies
      updateDraft(newTree);
      setSmartDeleteWizard(prev => ({ ...prev, isOpen: false }));
      return;
    }

    // Has operational dependencies, call backend smart delete
    setSmartDeleteWizard(prev => ({ ...prev, isLoading: true }));
    try {
      await AdminAPI.smartDeleteDepartment({
        deptId: data.deptId,
        nodeName: smartDeleteWizard.nodeName,
        treeWithoutNode: newTree,
        userAction,
        targetDeptIdForUsers,
        flowAction,
        targetDeptIdForFlows
      });
      // Success! Update local tree state completely (backend already saved it)
      setDraftOrgTree(newTree);
      setOrgTree(newTree);
      setSmartDeleteWizard(prev => ({ ...prev, isOpen: false, isLoading: false }));
      setSaveMsg('تم تنفيذ المعالج الذكي وتفكيك الإدارة بنجاح.');
      setTimeout(() => setSaveMsg(null), 5000);
    } catch (err: any) {
      setSmartDeleteWizard(prev => ({ ...prev, isLoading: false, error: err.message || 'فشلت العملية' }));
    }
  };

  // Recursive render component for the Tree
  const renderTree = (node: OrgNode) => {
    return (
      <li key={node.id}>
        <DraggableCard 
          node={node} 
          isRoot={node.id === orgTree.id} 
          zoom={treePanZoom.scale}
          onEdit={(nodeToEdit) => handleEditNode(nodeToEdit.id, nodeToEdit.name)} 
          onDelete={handleDeleteNode} 
          onAdd={(id) => { setAddingToNodeId(id); setNewNodeName('');
      setNewNodeType('إدارة');
      setNewNodeShape('افتراضي'); }} 
          saveStyles={saveNodeStyles} 
        />
        {node.children.length > 0 && (
          <ul>
            {node.children.map(child => renderTree(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: APPLE.font, animation: 'appleReveal 0.5s ease forwards' }}>
      <style>{`
        .org-tree-wrapper {
          width: 100%;
          overflow-x: auto;
          padding: 20px 0;
          cursor: grab;
        }
        .org-tree-wrapper:active {
          cursor: grabbing;
        }
        .org-tree-container {
          display: flex;
          justify-content: flex-start;
          padding: 40px 20px;
          direction: ltr; /* Ensure tree layout draws lines correctly in both RTL/LTR */
          min-width: max-content;
          margin: 0 auto;
        }
        
        /* CSS Tree Logic */
        .org-tree ul {
          padding-top: 20px; position: relative;
          transition: all 0.5s;
          -webkit-transition: all 0.5s;
          -moz-transition: all 0.5s;
          display: flex;
          justify-content: center;
          padding-left: 0;
          margin: 0;
        }

        .org-tree li {
          float: left; text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 10px 0 10px;
          transition: all 0.5s;
          -webkit-transition: all 0.5s;
          -moz-transition: all 0.5s;
        }

        

        /* The Card Design */
        .org-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 160px;
          min-height: 90px;
          transition: box-shadow 0.2s, border-color 0.2s;
          direction: rtl;
          container-type: size; /* Enable container queries */
        }
        .org-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border-color: #93c5fd;
        }
        
        .org-card-actions {
          display: flex;
          gap: 4px;
          padding: 8px 8px 0 8px;
        }
        .org-card-actions button {
          background: none; border: none; cursor: pointer; padding: 2px;
          font-size: clamp(14px, 4cqi, 18px);
        }

        .org-card-type {
          font-size: clamp(10px, 3cqi, 13px);
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .org-card-name {
          font-weight: 700;
          color: #1e293b;
          text-align: center;
          font-size: clamp(14px, 12cqi, 48px);
          line-height: 1.2;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          word-break: break-word;
          padding: 0 16px 16px 16px;
        }

        /* Add Button */
        .org-add-btn {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }
        .org-card:hover .org-add-btn {
          opacity: 1;
        }
        .org-add-btn:hover {
          background: #2563eb;
          transform: translateX(-50%) scale(1.1);
        }

        /* Actions */
        .org-card-actions {
          position: absolute;
          top: -10px;
          right: -10px;
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .org-card:hover .org-card-actions {
          opacity: 1;
        }
        .org-card-actions button {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          font-size: 11px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .org-card-actions button:hover { background: #f8fafc; }
      `}</style>
      
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: APPLE.text, margin: '0 0 8px 0' }}>الهيكل المؤسسي والمكاني</h2>
        <p style={{ color: APPLE.textSecondary, margin: 0, fontSize: '15px' }}>
          إدارة الخريطة التنظيمية، استيعاب الموظفين الجدد، وبناء شجرة الإدارات التفاعلية.
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(0,0,0,0.04)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        <button onClick={() => setActiveSubTab('buildings')} style={{ padding: '8px 20px', border: 'none', background: activeSubTab === 'buildings' ? '#fff' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: activeSubTab === 'buildings' ? 'bold' : 'normal', color: APPLE.text, boxShadow: activeSubTab === 'buildings' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
          🏢 المباني والمواقع
        </button>
        <button onClick={() => setActiveSubTab('pool')} style={{ padding: '8px 20px', border: 'none', background: activeSubTab === 'pool' ? '#fff' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: activeSubTab === 'pool' ? 'bold' : 'normal', color: APPLE.text, boxShadow: activeSubTab === 'pool' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
          🌊 حوض الموظفين الجدد ({unassignedUsers.length})
        </button>
        <button onClick={() => setActiveSubTab('spatial')} style={{ padding: '8px 20px', border: 'none', background: activeSubTab === 'spatial' ? '#fff' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: activeSubTab === 'spatial' ? 'bold' : 'normal', color: APPLE.text, boxShadow: activeSubTab === 'spatial' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>
          🌳 شجرة الهيكل (إدارات ومكاتب)
        </button>
      </div>

      {/* Content Area */}
      <div style={{ background: APPLE.surface, borderRadius: APPLE.radiusLg, boxShadow: APPLE.shadowCard, border: `1px solid ${APPLE.separator}`, minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        
        {/* 1. Buildings & Locations Section */}
        {activeSubTab === 'buildings' && (
          <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: APPLE.text }}>المباني والمواقع</h3>
                <p style={{ margin: 0, fontSize: '13px', color: APPLE.textSecondary }}>إدارة فروع الشركة والمباني الرئيسية التابعة لها.</p>
              </div>
              <button onClick={handleAddBuilding} style={{ background: APPLE.blue, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                + إضافة مبنى جديد
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {buildings.map(b => (
                <div key={b.globalId || b.id} style={{ background: '#f8fafc', border: `1px solid ${APPLE.separator}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>{b.type === 'LOCATION' ? '📍' : '🏢'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: APPLE.text, fontSize: '15px' }}>{b.name}</div>
                    <div style={{ fontSize: '12px', color: APPLE.textSecondary, marginTop: '2px' }}>{b.type === 'LOCATION' ? 'موقع جغرافي / محطة' : 'مبنى / فرع'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditBuilding(b.globalId || String(b.id), b.name, b.type)} style={{ background: 'none', border: 'none', color: APPLE.blue, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>تعديل</button>
                    <button onClick={() => handleDeleteBuilding(b.globalId || String(b.id))} style={{ background: 'none', border: 'none', color: APPLE.red, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>حذف</button>
                  </div>
                </div>
              ))}
              {buildings.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: APPLE.textSecondary }}>
                  لا توجد مباني مضافة بعد.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Unassigned Pool Section */}
        {activeSubTab === 'pool' && (
          <div style={{ padding: '0', flex: 1 }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${APPLE.separator}`, background: '#f8fafc', borderTopLeftRadius: APPLE.radiusLg, borderTopRightRadius: APPLE.radiusLg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>حوض الموظفين غير المنسبين</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: APPLE.textSecondary }}>
                    هؤلاء المستخدمون دخلوا للنظام ولم يتم دمجهم في الهيكل بعد.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="ابحث بالاسم أو البريد..." 
                    value={poolSearchQuery} 
                    onChange={e => setPoolSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '250px' }}
                  />
                  {selectedUsers.size > 0 && (
                    <button onClick={handleAssignSelectedUsers} style={{ background: APPLE.blue, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      تنسيب المحددين ({selectedUsers.size})
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: APPLE.bg, borderBottom: `1px solid ${APPLE.separator}` }}>
                <tr>
                  <th style={{ padding: '12px 20px', textAlign: 'right', width: '50px' }}>
                    <input type="checkbox" checked={selectedUsers.size > 0 && selectedUsers.size === filteredPool.length} onChange={toggleSelectAll} />
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الاسم</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>تاريخ الانضمام</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredPool.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: APPLE.textSecondary }}>
                      {poolSearchQuery ? 'لا توجد نتائج بحث تطابق مدخلاتك.' : 'الحوض فارغ حالياً.'}
                    </td>
                  </tr>
                ) : (
                  filteredPool.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${APPLE.separator}`, background: selectedUsers.has(String(user.id)) ? '#f0f9ff' : 'transparent' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <input type="checkbox" checked={selectedUsers.has(String(user.id))} onChange={() => {
                          const newSet = new Set(selectedUsers);
                          if (newSet.has(String(user.id))) newSet.delete(String(user.id));
                          else newSet.add(String(user.id));
                          setSelectedUsers(newSet);
                        }} />
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{user.fullName || user.username}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.email}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-LY') : '-'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button onClick={() => handleAssignUser(String(user.id))} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          تنسيب ➔
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Tree Builder Section */}
        {activeSubTab === 'spatial' && (
          <div style={{ padding: '30px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>منشئ شجرة الهيكل التنظيمي 🌳</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: APPLE.textSecondary }}>
                    مرر الماوس فوق أي كرت أو استخدم القائمة للإضافة والتنظيم السريع.
                  </p>
                  
                  {/* Search and Focus */}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                     <input 
                       type="text" 
                       placeholder="ابحث عن إدارة أو قسم للتركيز عليه..." 
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '300px', fontSize: '13px' }}
                     />
                     {searchQuery && (
                       <div style={{ position: 'absolute', top: '230px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '300px', maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                         {(() => {
                           const results: OrgNode[] = [];
                           const search = (n: OrgNode) => {
                             if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) results.push(n);
                             n.children.forEach(search);
                           };
                           search(draftOrgTree);
                           return results.map(r => (
                             <div key={r.id} onClick={() => { setFocusedNodeId(r.id); setSearchQuery(''); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                               {r.name} <span style={{ color: '#94a3b8', fontSize: '11px', marginRight: '4px' }}>({r.type})</span>
                             </div>
                           ));
                         })()}
                       </div>
                     )}
                     {focusedNodeId && (
                       <button onClick={() => setFocusedNodeId(null)} style={{ padding: '8px 12px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                         إلغاء التركيز ✕
                       </button>
                     )}
                  </div>
                </div>
                
                {/* View Mode Toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
                  <button onClick={() => setViewMode('visual')} style={{ border: 'none', background: viewMode === 'visual' ? '#fff' : 'transparent', color: viewMode === 'visual' ? '#4f46e5' : '#64748b', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', boxShadow: viewMode === 'visual' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                    العرض المرئي 🗺️
                  </button>
                  <button onClick={() => setViewMode('list')} style={{ border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#4f46e5' : '#64748b', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                    القائمة السريعة 📋
                  </button>
                </div>
              </div>

             {/* --- LIST VIEW --- */}
             {viewMode === 'list' && (
               <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', overflowY: 'auto' }}>
                 {renderListView(getFocusedTree())}
               </div>
             )}

             {/* --- VISUAL CANVAS --- */}
             {viewMode === 'visual' && (
             <div
               ref={viewportRef}
               onPointerDown={handleViewportPointerDown}
               onPointerMove={handleViewportPointerMove}
               onPointerUp={handleViewportPointerUp}
               onPointerLeave={handleViewportPointerUp}
               onWheel={handleViewportWheel}
               style={{
                 flex: 1, minHeight: '600px', position: 'relative', overflow: 'hidden',
                 background: 'radial-gradient(circle at 25% 25%, #eef2ff 0%, #f8fafc 55%, #f1f5f9 100%)',
                 borderRadius: '16px', border: '1px solid #e2e8f0',
                 cursor: panzoomState.current.isPanning ? 'grabbing' : 'grab',
                 userSelect: 'none',
               }}
             >
               {/* Dot-grid pattern */}
               <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3, pointerEvents: 'none', zIndex: 0 }}>
                 <defs>
                   <pattern id="org-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse"
                     patternTransform={`translate(${((treePanZoom.x % 28) + 28) % 28} ${((treePanZoom.y % 28) + 28) % 28})`}>
                     <circle cx="14" cy="14" r="1" fill="#94a3b8" />
                   </pattern>
                 </defs>
                 <rect width="100%" height="100%" fill="url(#org-dot-grid)" />
               </svg>

               {/* Wallpaper (Draggable & Resizable) */}
               {bgImage && bgMode === 'wallpaper' && (
                 <div
                   onPointerDown={bgPanel ? handleBgImgPointerDown : undefined}
                   onPointerMove={bgPanel ? handleBgImgPointerMove : undefined}
                   onPointerUp={bgPanel ? handleBgImgPointerUp : undefined}
                   style={{
                     position: 'absolute',
                     left: `${bgSettings.wallX ?? 50}%`,
                     top: `${bgSettings.wallY ?? 50}%`,
                     width: `${bgSettings.wallSize ?? 100}%`,
                     transform: 'translate(-50%, -50%)',
                     backgroundImage: `url(${bgImage})`,
                     backgroundSize: '100% 100%',
                     backgroundRepeat: 'no-repeat',
                     opacity: bgSettings.opacity ?? 0.15,
                     filter: `blur(${bgSettings.blur ?? 0}px)`,
                     pointerEvents: bgPanel ? 'auto' : 'none', 
                     cursor: bgPanel ? 'move' : 'default',
                     zIndex: 1,
                     aspectRatio: '16/9', // fallback ratio
                   }} />
               )}

               {/* Transformable canvas */}
               <div
                 ref={containerRef}
                 style={{
                   position: 'absolute', top: 0, left: 0,
                   transform: `translate(${treePanZoom.x}px, ${treePanZoom.y}px) scale(${treePanZoom.scale})`,
                   transformOrigin: '0 0',
                   willChange: 'transform',
                   zIndex: 2,
                 }}
               >
                 <SVGConnections tree={getFocusedTree()} containerRef={containerRef} zoom={treePanZoom.scale} />
                 <div className="org-tree" style={{ position: 'relative', zIndex: 1, padding: '80px 60px 60px' }}>
                   <ul>
                     {renderTree(getFocusedTree())}
                   </ul>
                 </div>
               </div>

               {/* Logo overlay (viewport-pinned, draggable) */}
               {bgImage && bgMode === 'logo' && (
                 <img
                   src={bgImage} alt="logo" draggable={false}
                   onPointerDown={handleBgImgPointerDown}
                   onPointerMove={handleBgImgPointerMove}
                   onPointerUp={handleBgImgPointerUp}
                   style={{
                     position: 'absolute',
                     left: `${bgSettings.logoX ?? 5}%`,
                     top: `${bgSettings.logoY ?? 5}%`,
                     width: `${bgSettings.logoSize ?? 120}px`,
                     opacity: bgSettings.opacity ?? 0.9,
                     cursor: 'move', zIndex: 10,
                     borderRadius: '8px',
                     filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.18))',
                     userSelect: 'none',
                   }}
                 />
               )}

               {/* --- FLOATING TOOLBAR --- */}
               <div style={{
                 position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
                 display: 'flex', gap: '2px', alignItems: 'center',
                 background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(24px)',
                 border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', padding: '5px 10px',
                 boxShadow: '0 8px 40px rgba(0,0,0,0.14)', zIndex: 20,
               }}>
                 <button onClick={() => setTreePanZoom(p => ({ ...p, scale: Math.max(0.08, p.scale - 0.1) }))}
                   title="تصغير" style={{ ...toolbarBtn, fontSize: '18px', fontWeight: 700 }}>-</button>
                 <span style={{ fontSize: '12px', minWidth: '42px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
                   {Math.round(treePanZoom.scale * 100)}%
                 </span>
                 <button onClick={() => setTreePanZoom(p => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))}
                   title="تكبير" style={{ ...toolbarBtn, fontSize: '18px', fontWeight: 700 }}>+</button>
                 <div style={toolbarSep} />
                 <button onClick={handleFitToView} title="ملاءمة الشاشة" style={{ ...toolbarBtn, fontSize: '13px' }}>[]</button>
                 <button onClick={() => setTreePanZoom({ x: 40, y: 40, scale: 1 })} title="100%"
                   style={{ ...toolbarBtn, fontSize: '11px', fontWeight: 700, minWidth: '36px' }}>100%</button>
                 <div style={toolbarSep} />
                 <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', cursor: 'pointer',
                   color: '#475569', padding: '4px 6px', borderRadius: '8px',
                   background: isAutoSave ? '#f0fdf4' : 'transparent' }}>
                   <input type="checkbox" checked={isAutoSave} onChange={e => setIsAutoSave(e.target.checked)}
                     style={{ cursor: 'pointer', accentColor: '#22c55e' }}/>
                   حفظ تلقائي
                 </label>
                 {!isAutoSave && (
                   <button onClick={handleManualSave} disabled={isSaving} style={{
                     border: 'none', background: isSaving ? '#94a3b8' : '#0052cc', color: '#fff', borderRadius: '10px',
                     padding: '5px 12px', fontSize: '12px', fontWeight: 700,
                     cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
                   }}>{isSaving ? 'جارٍ الحفظ...' : 'حفظ في DB'}</button>
                 )}
                 {saveMsg && (
                   <span style={{
                     fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '8px',
                     color: saveMsg.startsWith('OK') ? '#15803d' : '#dc2626',
                     background: saveMsg.startsWith('OK') ? '#f0fdf4' : '#fef2f2'
                   }}>{saveMsg}</span>
                 )}
                 <div style={toolbarSep} />
                 <button onClick={() => setBgPanel(p => !p)} title="الخلفية / الشعار" style={{
                   ...toolbarBtn, fontSize: '16px',
                   background: bgPanel ? '#e0e7ff' : undefined,
                   color: bgPanel ? '#4f46e5' : undefined,
                 }}>BG</button>
               </div>

               {/* --- BACKGROUND / LOGO PANEL --- */}
               {bgPanel && (
                 <div style={{
                   position: 'absolute', bottom: '68px', left: '50%', transform: 'translateX(-50%)',
                   background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
                   border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px',
                   padding: '20px 22px', width: '320px',
                   boxShadow: '0 24px 60px rgba(0,0,0,0.14)', zIndex: 25, direction: 'rtl',
                 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                     <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>الخلفية / الشعار</span>
                     <button onClick={() => setBgPanel(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8', lineHeight: 1 }}>x</button>
                   </div>

                   {/* Mode toggle */}
                   <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
                     {(['wallpaper', 'logo'] as const).map(m => (
                       <button key={m} onClick={() => setBgMode(m)} style={{
                         flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                         background: bgMode === m ? '#fff' : 'transparent',
                         fontWeight: bgMode === m ? 700 : 500, fontSize: '12px',
                         color: bgMode === m ? '#4f46e5' : '#64748b',
                         boxShadow: bgMode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                         transition: 'all 0.2s',
                       }}>
                         {m === 'wallpaper' ? 'خلفية كاملة' : 'شعار محدد'}
                       </button>
                     ))}
                   </div>

                   {/* Upload area */}
                   <label style={{
                     display: 'flex', alignItems: 'center', gap: '10px',
                     background: '#f8fafc', border: '1.5px dashed #c7d2fe',
                     borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', marginBottom: '14px'
                   }}>
                     <span style={{ fontSize: '20px' }}>{bgImage ? '*' : '+'}</span>
                     <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>
                       {bgImage ? 'استبدال الصورة' : 'رفع صورة / شعار'}
                     </span>
                     <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                   </label>

                   {bgImage && (
                     <>
                       {/* Opacity slider */}
                       <div style={{ marginBottom: '12px' }}>
                         <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                           <span>الشفافية</span><span style={{ color: '#6366f1' }}>{Math.round((bgSettings.opacity ?? 0.5) * 100)}%</span>
                         </label>
                         <input type="range" min="0.05" max="1" step="0.05" value={bgSettings.opacity ?? 0.5}
                           onChange={e => updateBgSettings('opacity', parseFloat(e.target.value))}
                           style={{ width: '100%', accentColor: '#6366f1' }} />
                       </div>

                       {/* Blur (wallpaper only) */}
                       {bgMode === 'wallpaper' && (
                         <div style={{ marginBottom: '12px' }}>
                           <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                             <span>تشويش الخلفية</span><span style={{ color: '#6366f1' }}>{bgSettings.blur ?? 0}px</span>
                           </label>
                           <input type="range" min="0" max="20" step="1" value={bgSettings.blur ?? 0}
                             onChange={e => updateBgSettings('blur', parseInt(e.target.value))}
                             style={{ width: '100%', accentColor: '#6366f1' }} />
                         </div>
                       )}
                       
                       {/* Wallpaper Size (wallpaper only) */}
                       {bgMode === 'wallpaper' && (
                         <div style={{ marginBottom: '12px' }}>
                           <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                             <span>حجم الخلفية</span><span style={{ color: '#6366f1' }}>{bgSettings.wallSize ?? 100}%</span>
                           </label>
                           <input type="range" min="10" max="300" step="10" value={bgSettings.wallSize ?? 100}
                             onChange={e => updateBgSettings('wallSize', parseInt(e.target.value))}
                             style={{ width: '100%', accentColor: '#6366f1' }} />
                           <p style={{ fontSize: '11px', color: '#94a3b8', margin: '5px 0 0 0' }}>
                             اسحب الخلفية بالماوس لتغيير موضعها
                           </p>
                         </div>
                       )}

                       {/* Logo size (logo mode only) */}
                       {bgMode === 'logo' && (
                         <div style={{ marginBottom: '12px' }}>
                           <label style={{ fontSize: '12px', color: '#475569', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                             <span>حجم الشعار</span><span style={{ color: '#6366f1' }}>{bgSettings.logoSize ?? 120}px</span>
                           </label>
                           <input type="range" min="40" max="400" step="10" value={bgSettings.logoSize ?? 120}
                             onChange={e => updateBgSettings('logoSize', parseInt(e.target.value))}
                             style={{ width: '100%', accentColor: '#6366f1' }} />
                           <p style={{ fontSize: '11px', color: '#94a3b8', margin: '5px 0 0 0' }}>
                             اسحب الشعار بالماوس لتغيير موضعه
                           </p>
                         </div>
                       )}

                       <button onClick={() => { setBgImage(null); localStorage.removeItem('litc_org_bg'); setBgPanel(false); }} style={{
                         width: '100%', padding: '9px', background: '#fef2f2', color: '#ef4444',
                         border: '1px solid #fecaca', borderRadius: '10px', cursor: 'pointer',
                         fontWeight: 600, fontSize: '12px'
                       }}>حذف الصورة</button>
                     </>
                   )}
                 </div>
               )}

             </div>
             )}
             
             {addingToNodeId && (
               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                 <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'right', direction: 'rtl' }}>
                   <h3 style={{ margin: '0 0 16px 0', color: '#172b4d' }}>إضافة كيان جديد</h3>
                   
                   <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>اسم الكيان</label>
                   <input type="text" placeholder="الاسم" value={newNodeName} onChange={e => setNewNodeName(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitAddChildNode(false)} style={{ width: '100%', marginBottom: '16px', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }} autoFocus/>
                   
                   <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>التصنيف</label>
                       <select value={newNodeType} onChange={e => setNewNodeType(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }}>
                         <option value="إدارة عليا">إدارة عليا</option>
                         <option value="إدارة">إدارة</option>
                         <option value="مكتب">مكتب</option>
                         <option value="قسم">قسم</option>
                         <option value="وحدة">وحدة</option>
                       </select>
                     </div>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>الشكل (اختياري)</label>
                       <select value={newNodeShape} onChange={e => setNewNodeShape(e.target.value)} style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }}>
                         <option value="افتراضي">افتراضي</option>
                         <option value="مستطيل">مستطيل</option>
                         <option value="مستطيل بحواف دائرية">مستطيل بحواف دائرية</option>
                         <option value="بيضاوي">بيضاوي</option>
                         <option value="ورقة شجر يمين">ورقة شجر يمين</option>
                         <option value="ورقة شجر يسار">ورقة شجر يسار</option>
                       </select>
                     </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <button onClick={() => commitAddChildNode(false)} style={{ width: '100%', background: '#0052cc', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>حفظ</button>
                     <button onClick={() => commitAddChildNode(true)} style={{ width: '100%', background: '#e0e7ff', color: '#0052cc', border: '1px solid #c7d2fe', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>حفظ وإضافة أخرى</button>
                     <button onClick={() => setAddingToNodeId(null)} style={{ width: '100%', background: '#f4f5f7', color: '#172b4d', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>إلغاء</button>
                   </div>
                 </div>
               </div>
             )}

             {editingNodeInfo && (
               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                 <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'right', direction: 'rtl' }}>
                   <h3 style={{ margin: '0 0 16px 0', color: '#172b4d' }}>تعديل بيانات الكيان</h3>
                   
                   <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>اسم الكيان</label>
                   <input type="text" placeholder="الاسم" value={editingNodeInfo.name} onChange={e => setEditingNodeInfo({...editingNodeInfo, name: e.target.value})} onKeyDown={e => e.key === 'Enter' && commitEditNode()} style={{ width: '100%', marginBottom: '16px', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }} autoFocus/>
                   
                   <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>التصنيف</label>
                       <select value={editingNodeInfo.type} onChange={e => setEditingNodeInfo({...editingNodeInfo, type: e.target.value})} style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }}>
                         <option value="إدارة عليا">إدارة عليا</option>
                         <option value="إدارة">إدارة</option>
                         <option value="مكتب">مكتب</option>
                         <option value="قسم">قسم</option>
                         <option value="وحدة">وحدة</option>
                       </select>
                     </div>
                     <div style={{ flex: 1 }}>
                       <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>الشكل (اختياري)</label>
                       <select value={editingNodeInfo.shape} onChange={e => setEditingNodeInfo({...editingNodeInfo, shape: e.target.value})} style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px', border: '1px solid #dfe1e6', outline: 'none' }}>
                         <option value="افتراضي">افتراضي</option>
                         <option value="مستطيل">مستطيل</option>
                         <option value="مستطيل بحواف دائرية">مستطيل بحواف دائرية</option>
                         <option value="بيضاوي">بيضاوي</option>
                         <option value="ورقة شجر يمين">ورقة شجر يمين</option>
                         <option value="ورقة شجر يسار">ورقة شجر يسار</option>
                       </select>
                     </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <button onClick={() => commitEditNode()} style={{ width: '100%', background: '#0052cc', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>حفظ التعديل</button>
                     <button onClick={() => setEditingNodeInfo(null)} style={{ width: '100%', background: '#f4f5f7', color: '#172b4d', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>إلغاء</button>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Smart Deletion Wizard Modal */}
        {smartDeleteWizard.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '500px', maxWidth: '90vw', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', direction: 'rtl', display: 'flex', flexDirection: 'column', animation: 'appleReveal 0.3s ease' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>🛡️</span> معالج التفكيك الذكي
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                  تأكيد حذف: <strong style={{ color: '#0f172a' }}>{smartDeleteWizard.nodeName}</strong>
                </p>
              </div>

              <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '60vh' }}>
                {smartDeleteWizard.isLoading && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6366f1', fontWeight: 600 }}>جاري فحص التبعيات والتشغيلات...</div>
                )}
                
                {smartDeleteWizard.error && (
                  <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '16px' }}>
                    {smartDeleteWizard.error}
                  </div>
                )}

                {!smartDeleteWizard.isLoading && smartDeleteWizard.data && (
                  <div>
                    {!smartDeleteWizard.data.hasOperational ? (
                      <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', marginBottom: '16px' }}>
                        هذه الإدارة ليس لها وجود تشغيلي فعلي (لا موظفين ولا مسارات). الحذف آمن تماماً.
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                          <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>{smartDeleteWizard.data.userCount}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>الموظفين</div>
                          </div>
                          <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#eab308' }}>{smartDeleteWizard.data.activeFlowsCount}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>المسارات النشطة</div>
                          </div>
                          <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>{smartDeleteWizard.data.openTicketsCount}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>تذاكر مفتوحة</div>
                          </div>
                        </div>

                        {smartDeleteWizard.data.openTicketsCount > 0 ? (
                          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>🚫 لا يمكن المتابعة</h4>
                            <p style={{ margin: 0, fontSize: '13px' }}>
                              هذه الإدارة تمتلك تذاكر مفتوحة، يرجى معالجتها أو تحويلها من لوحة العمليات التشغيلية أولاً.
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Users Action */}
                            {smartDeleteWizard.data.userCount > 0 && (
                              <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>معالجة الكادر الوظيفي</h4>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input type="radio" name="userAction" checked={smartDeleteWizard.userAction === 'pool'} onChange={() => setSmartDeleteWizard(prev => ({...prev, userAction: 'pool'}))} />
                                    إرجاع للهيكل بدون تنسيب
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input type="radio" name="userAction" checked={smartDeleteWizard.userAction === 'reassign'} onChange={() => setSmartDeleteWizard(prev => ({...prev, userAction: 'reassign'}))} />
                                    نقل لإدارة أخرى
                                  </label>
                                </div>
                                {smartDeleteWizard.userAction === 'reassign' && (
                                  <select 
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                    value={smartDeleteWizard.targetDeptIdForUsers || ''}
                                    onChange={(e) => setSmartDeleteWizard(prev => ({...prev, targetDeptIdForUsers: e.target.value}))}
                                  >
                                    <option value="" disabled>اختر الإدارة البديلة...</option>
                                    {smartDeleteWizard.data.allDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                  </select>
                                )}
                              </div>
                            )}

                            {/* Flows Action */}
                            {smartDeleteWizard.data.activeFlowsCount > 0 && (
                              <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>معالجة المسارات ({smartDeleteWizard.data.activeFlowsCount})</h4>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input type="radio" name="flowAction" checked={smartDeleteWizard.flowAction === 'deactivate'} onChange={() => setSmartDeleteWizard(prev => ({...prev, flowAction: 'deactivate'}))} />
                                    إيقاف / تعطيل المسارات
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                    <input type="radio" name="flowAction" checked={smartDeleteWizard.flowAction === 'reroute'} onChange={() => setSmartDeleteWizard(prev => ({...prev, flowAction: 'reroute'}))} />
                                    توجيه لإدارة أخرى
                                  </label>
                                </div>
                                {smartDeleteWizard.flowAction === 'reroute' && (
                                  <select 
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                    value={smartDeleteWizard.targetDeptIdForFlows || ''}
                                    onChange={(e) => setSmartDeleteWizard(prev => ({...prev, targetDeptIdForFlows: e.target.value}))}
                                  >
                                    <option value="" disabled>اختر الإدارة البديلة للمسارات...</option>
                                    {smartDeleteWizard.data.allDepts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => setSmartDeleteWizard(prev => ({...prev, isOpen: false}))} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e2e8f0', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>إلغاء</button>
                
                <button 
                  onClick={executeSmartDelete} 
                  disabled={
                    smartDeleteWizard.isLoading || 
                    (smartDeleteWizard.data && smartDeleteWizard.data.openTicketsCount > 0) ||
                    (smartDeleteWizard.userAction === 'reassign' && !smartDeleteWizard.targetDeptIdForUsers) ||
                    (smartDeleteWizard.flowAction === 'reroute' && !smartDeleteWizard.targetDeptIdForFlows)
                  }
                  style={{ 
                    padding: '10px 24px', borderRadius: '8px', border: 'none', 
                    background: (smartDeleteWizard.data?.openTicketsCount > 0) ? '#94a3b8' : '#ef4444', 
                    color: '#fff', fontWeight: 600, cursor: (smartDeleteWizard.data?.openTicketsCount > 0) ? 'not-allowed' : 'pointer',
                    opacity: (smartDeleteWizard.isLoading || (smartDeleteWizard.data && smartDeleteWizard.data.openTicketsCount > 0) || (smartDeleteWizard.userAction === 'reassign' && !smartDeleteWizard.targetDeptIdForUsers) || (smartDeleteWizard.flowAction === 'reroute' && !smartDeleteWizard.targetDeptIdForFlows)) ? 0.6 : 1
                  }}>
                  {smartDeleteWizard.isLoading ? 'جاري التنفيذ...' : 'تأكيد التفكيـك الذكي'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Building Modal */}
        {buildingModal.isOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', padding: '30px',
              width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              animation: 'appleReveal 0.3s ease'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b' }}>
                {buildingModal.isEdit ? 'تعديل بيانات المبنى / الموقع' : 'إضافة مبنى أو موقع جديد'}
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                  نوع المنشأة
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBuildingModal(prev => ({ ...prev, type: 'BUILDING' }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                      borderColor: buildingModal.type === 'BUILDING' ? '#3b82f6' : '#cbd5e1',
                      background: buildingModal.type === 'BUILDING' ? '#eff6ff' : '#fff',
                      color: buildingModal.type === 'BUILDING' ? '#1d4ed8' : '#475569',
                      fontWeight: buildingModal.type === 'BUILDING' ? 700 : 500,
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    🏢 مبنى / فرع
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildingModal(prev => ({ ...prev, type: 'LOCATION' }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                      borderColor: buildingModal.type === 'LOCATION' ? '#3b82f6' : '#cbd5e1',
                      background: buildingModal.type === 'LOCATION' ? '#eff6ff' : '#fff',
                      color: buildingModal.type === 'LOCATION' ? '#1d4ed8' : '#475569',
                      fontWeight: buildingModal.type === 'LOCATION' ? 700 : 500,
                      cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    📍 موقع جغرافي / محطة
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                  الاسم
                </label>
                <input 
                  autoFocus
                  type="text" 
                  value={buildingModal.name}
                  onChange={e => setBuildingModal(prev => ({...prev, name: e.target.value}))}
                  onKeyDown={e => { if (e.key === 'Enter') saveBuildingModal(); }}
                  placeholder="مثال: المبنى الرئيسي، فرع طرابلس..."
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '10px',
                    border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setBuildingModal({ isOpen: false, isEdit: false, name: '', type: 'BUILDING' })}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', border: 'none',
                    background: '#f1f5f9', color: '#475569', fontWeight: 600,
                    cursor: 'pointer', fontSize: '14px'
                  }}>
                  إلغاء
                </button>
                <button 
                  onClick={saveBuildingModal}
                  disabled={!buildingModal.name.trim()}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: buildingModal.name.trim() ? '#3b82f6' : '#94a3b8', 
                    color: '#fff', fontWeight: 600,
                    cursor: buildingModal.name.trim() ? 'pointer' : 'not-allowed', 
                    fontSize: '14px'
                  }}>
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
