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

const mockUnassignedUsers = [
  { id: 'u101', name: 'أحمد سالم', email: 'ahmed.s@litc.local', date: '2026-07-18' },
  { id: 'u102', name: 'سارة محمد', email: 'sara.m@litc.local', date: '2026-07-19' },
  { id: 'u103', name: 'خالد عمر', email: 'khaled.o@litc.local', date: '2026-07-19' }
];


import { OrgNode } from './orgStructureTypes';


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


export const loadBuildings = (): {id: string, name: string}[] => {
  try { const s = localStorage.getItem('litc_buildings_tree'); return s ? JSON.parse(s) : [{ id: 'b1', name: 'المبنى الرئيسي (المركز)' }]; } catch { return [{ id: 'b1', name: 'المبنى الرئيسي (المركز)' }]; }
};

export const InstitutionalStructureTab: React.FC<{ orgTree: OrgNode, setOrgTree: React.Dispatch<React.SetStateAction<OrgNode>> }> = ({ orgTree, setOrgTree }) => {
  const [activeSubTab, setActiveSubTab] = useState<'buildings' | 'pool' | 'spatial'>('buildings');
  const [unassignedUsers, setUnassignedUsers] = useState(mockUnassignedUsers);
  
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

  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (!isBgEditMode || !bgImage) return;
    if ((e.target as HTMLElement).closest('.org-tree-container')) return; // Ignore clicks on the tree itself
    
    // Ignore clicks on resize handles (bottom left or bottom right)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isResizeHandle = e.clientY > rect.bottom - 20 && (e.clientX < rect.left + 20 || e.clientX > rect.right - 20);
    if (isResizeHandle) return;

    e.preventDefault();
    bgDragState.current.isDragging = true;
    bgDragState.current.startX = e.clientX;
    bgDragState.current.startY = e.clientY;
    
    // Parse current bg position
    const pos = bgSettings.position || 'center';
    let currX = 50, currY = 50;
    if (pos === 'center') { currX = 50; currY = 50; }
    else if (pos.includes('px')) {
      const parts = pos.split(' ');
      currX = parseFloat(parts[0]) || 0;
      currY = parseFloat(parts[1]) || 0;
    }
    bgDragState.current.bgX = currX;
    bgDragState.current.bgY = currY;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBgPointerMove = (e: React.PointerEvent) => {
    if (!bgDragState.current.isDragging) return;
    const dx = e.clientX - bgDragState.current.startX;
    const dy = e.clientY - bgDragState.current.startY;
    
    // Switch position to pixel-based offset for smooth dragging
    const newX = bgDragState.current.bgX + dx;
    const newY = bgDragState.current.bgY + dy;
    updateBgSettings('position', `${newX}px ${newY}px`);
  };

  const handleBgPointerUp = (e: React.PointerEvent) => {
    if (bgDragState.current.isDragging) {
      bgDragState.current.isDragging = false;
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const handleBgWheel = (e: React.WheelEvent) => {
    if (!isBgEditMode || !bgImage) return;
    e.preventDefault(); // Stop page scroll
    
    // Parse current scale
    let currScale = 100;
    if (bgSettings.size && bgSettings.size.includes('%')) {
      currScale = parseFloat(bgSettings.size) || 100;
    } else if (bgSettings.size === 'cover') {
      currScale = 100; // base it
    }
    
    const delta = e.deltaY > 0 ? -5 : 5;
    const newScale = Math.max(10, currScale + delta);
    updateBgSettings('size', `${newScale}%`);
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

  // Zoom and Background Edit State
  const [treeZoom, setTreeZoom] = useState(1);
  const isPanningTree = React.useRef(false);
  const panStartPos = React.useRef({ x: 0, y: 0 });
  const panInitialScroll = React.useRef({ left: 0, top: 0 });

  const handleTreePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.org-card') || (e.target as HTMLElement).closest('.org-card-actions') || (e.target as HTMLElement).tagName === 'BUTTON') return;
    if (isBgEditMode) return;
    
    // Middle click or Left click on empty space to pan
    e.preventDefault();
    isPanningTree.current = true;
    panStartPos.current = { x: e.clientX, y: e.clientY };
    panInitialScroll.current = { left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTreePointerMove = (e: React.PointerEvent) => {
    if (!isPanningTree.current) return;
    const dx = e.clientX - panStartPos.current.x;
    const dy = e.clientY - panStartPos.current.y;
    e.currentTarget.scrollLeft = panInitialScroll.current.left - dx;
    e.currentTarget.scrollTop = panInitialScroll.current.top - dy;
  };

  const handleTreePointerUp = (e: React.PointerEvent) => {
    if (isPanningTree.current) {
      isPanningTree.current = false;
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch(err) {}
    }
  };
  const [isBgEditMode, setIsBgEditMode] = useState(false);
  
  // Background Pan state
  const bgDragState = React.useRef({ isDragging: false, startX: 0, startY: 0, bgX: 0, bgY: 0, bgScale: 100 });


  // Inline Add form state
  const [addingToNodeId, setAddingToNodeId] = useState<string | null>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('إدارة');
  const [newNodeShape, setNewNodeShape] = useState('افتراضي');
  
  const [editingNodeInfo, setEditingNodeInfo] = useState<{ id: string, name: string, type: string, shape: string } | null>(null);

  React.useEffect(() => {
    setDraftOrgTree(orgTree);
  }, [orgTree]);

  const updateDraft = (newTree: OrgNode) => {
    setDraftOrgTree(newTree);
    if (isAutoSave) {
      setOrgTree(newTree);
    }
  };

  const handleManualSave = () => {
    setOrgTree(draftOrgTree);
    alert('تم حفظ الهيكل التنظيمي بنجاح!');
  };


  // Building State (kept simple for physical locations if needed)
  const [buildings, setBuildings] = useState<{id: string, name: string}[]>(loadBuildings);
  
  React.useEffect(() => { localStorage.setItem('litc_buildings_tree', JSON.stringify(buildings)); }, [buildings]);

  const handleAssignUser = (userId: string) => {
    if (window.confirm('سيتم نقل هذا المستخدم إلى الهيكل التشغيلي ومنحه رتبة. المتابعة؟')) {
      setUnassignedUsers(prev => prev.filter(u => u.id !== userId));
      alert('تم تنسيب المستخدم بنجاح وانتقل إلى الهيكل التشغيلي.');
    }
  };



  const handleAddBuilding = () => {
    const name = window.prompt('أدخل اسم المبنى الجديد (مثال: فرع بنغازي):');
    if (name) setBuildings(prev => [...prev, { id: Date.now().toString(), name }]);
  };

  const handleEditBuilding = (id: string, currentName: string) => {
    const newName = window.prompt('تعديل اسم المبنى:', currentName);
    if (newName && newName.trim() !== '') {
      setBuildings(prev => prev.map(b => b.id === id ? { ...b, name: newName.trim() } : b));
    }
  };

  const handleDeleteBuilding = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المبنى؟')) {
      setBuildings(prev => prev.filter(b => b.id !== id));
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

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === orgTree.id) {
      alert('لا يمكن حذف الجذر الرئيسي للمؤسسة!');
      return;
    }
    if (!window.confirm('سيتم حذف هذا الكيان وجميع الإدارات المتفرعة منه. هل أنت متأكد؟')) return;

    const deleteRecursive = (node: OrgNode): OrgNode | null => {
      if (node.id === nodeId) return null;
      return {
        ...node,
        children: node.children.map(deleteRecursive).filter((n): n is OrgNode => n !== null)
      };
    };

    const newTree = deleteRecursive(draftOrgTree);
    if (newTree) updateDraft(newTree);
  };

  // Recursive render component for the Tree
  const renderTree = (node: OrgNode) => {
    return (
      <li key={node.id}>
        <DraggableCard 
          node={node} 
          isRoot={node.id === orgTree.id} 
          zoom={treeZoom}
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
                <div key={b.id} style={{ background: '#f8fafc', border: `1px solid ${APPLE.separator}`, borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>🏢</div>
                  <div style={{ fontWeight: '600', color: APPLE.text, flex: 1 }}>{b.name}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditBuilding(b.id, b.name)} style={{ background: 'none', border: 'none', color: APPLE.blue, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>تعديل</button>
                    <button onClick={() => handleDeleteBuilding(b.id)} style={{ background: 'none', border: 'none', color: APPLE.red, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', padding: 0 }}>حذف</button>
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
              <h3 style={{ margin: '0 0 5px 0' }}>حوض الموظفين غير المنسبين</h3>
              <p style={{ margin: 0, fontSize: '13px', color: APPLE.textSecondary }}>
                هؤلاء المستخدمون دخلوا للنظام (عبر البريد أو API) ولم يتم دمجهم في الهيكل بعد.
              </p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: APPLE.bg, borderBottom: `1px solid ${APPLE.separator}` }}>
                <tr>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الاسم</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>تاريخ الانضمام</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {unassignedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: APPLE.textSecondary }}>
                      الحوض فارغ حالياً.
                    </td>
                  </tr>
                ) : (
                  unassignedUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${APPLE.separator}` }}>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{user.name}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.email}</td>
                      <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.date}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button onClick={() => handleAssignUser(user.id)} style={{ background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          تنسيب للهيكل التشغيلي ➔
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>منشئ شجرة الهيكل التنظيمي 🌳</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: APPLE.textSecondary }}>
                    مرر الماوس فوق أي كرت لإظهار زر الإضافة (+) تحته، وقم بتفريغ الإدارات والمكاتب المتسلسلة.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button onClick={() => setTreeZoom(z => Math.max(0.1, z - 0.1))} style={{ border: 'none', background: '#fff', color: '#1e293b', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                    <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center', color: '#1e293b', fontWeight: 'bold' }}>{Math.round(treeZoom * 100)}%</span>
                    <button onClick={() => setTreeZoom(z => Math.min(3, z + 0.1))} style={{ border: 'none', background: '#fff', color: '#1e293b', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                    <button onClick={() => { setTreeZoom(1); setTreePan({x:0, y:0}); }} style={{ border: "none", background: "transparent", color: APPLE.blue, fontSize: "12px", cursor: "pointer" }}>استعادة</button>
                  </div>

                  {bgImage && (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setIsBgEditMode(!isBgEditMode)} style={{ background: isBgEditMode ? '#0052cc' : '#e0e7ff', color: isBgEditMode ? '#fff' : '#0052cc', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
                        {isBgEditMode ? '✅ إنهاء وضع تحرير الخلفية' : 'تغيير حجم وموقع الخلفية ✥'}
                      </button>
                      <button onClick={() => { setBgImage(null); localStorage.removeItem('litc_org_bg'); }} style={{ background: '#ffebe6', color: '#ff5630', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>حذف ✕</button>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                          الشفافية:
                          <input type="range" min="0" max="1" step="0.1" value={bgSettings.opacity} onChange={e => updateBgSettings('opacity', parseFloat(e.target.value))} style={{ width: '60px' }} />
                        </label>
                        <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b' }}>
                          التشويش:
                          <input type="range" min="0" max="20" step="1" value={bgSettings.blur} onChange={e => updateBgSettings('blur', parseFloat(e.target.value))} style={{ width: '60px' }} />
                        </label>
                      </div>
                    </div>
                  )}

                  {!bgImage && (
                    <label style={{ background: '#e0e7ff', color: '#0052cc', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                      صورة خلفية 🖼️
                      <input type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
                    </label>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: APPLE.text, marginRight: '16px' }}>
                    <input type="checkbox" checked={isAutoSave} onChange={e => setIsAutoSave(e.target.checked)} style={{ cursor: 'pointer' }}/>
                    حفظ تلقائي
                  </label>
                  {!isAutoSave && (
                    <button onClick={handleManualSave} style={{ background: '#0052cc', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,82,204,0.2)' }}>
                      حفظ التغييرات 💾
                    </button>
                  )}
                </div>
             </div>

             <div className="org-tree-wrapper" 
                  onPointerDown={handleTreePointerDown}
                  onPointerMove={handleTreePointerMove}
                  onPointerUp={handleTreePointerUp}
                  onPointerLeave={handleTreePointerUp}
                  style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', border: `1px solid ${APPLE.separator}`, position: 'relative', overflow: 'hidden', cursor: isPanningTree.current ? 'grabbing' : (isBgEditMode ? 'auto' : 'grab') }}>
               
               {bgImage && (
                 <div 
                   onPointerDown={handleBgPointerDown}
                   onPointerMove={handleBgPointerMove}
                   onPointerUp={handleBgPointerUp}
                   style={{
                     position: 'absolute',
                     left: bgSettings.position?.split(' ')?.[0] || '0px',
                     top: bgSettings.position?.split(' ')?.[1] || '0px',
                     width: bgSettings.size?.split(' ')?.[0] || '100%',
                     height: bgSettings.size?.split(' ')?.[1] || '100%',
                     minWidth: '100px', minHeight: '100px',
                     backgroundImage: `url(${bgImage})`,
                     backgroundSize: '100% 100%',
                     resize: isBgEditMode ? 'both' : 'none',
                     overflow: 'hidden',
                     cursor: isBgEditMode ? 'move' : 'auto',
                     zIndex: 0,
                     pointerEvents: isBgEditMode ? 'auto' : 'none'
                   }}
                   onMouseUp={(e) => {
                     const el = e.currentTarget;
                     updateBgSettings('size', `${el.offsetWidth}px ${el.offsetHeight}px`);
                   }}
                 >
                   <div style={{ width: '100%', height: '100%', backgroundColor: `rgba(255,255,255,${bgSettings.opacity})`, backdropFilter: `blur(${bgSettings.blur}px)` }} />
                 </div>
               )}

               <div className="org-tree-container" 
                  ref={containerRef} 
                  style={{ 
                    position: 'relative', 
                    minHeight: '600px', 
                    transform: `scale(${treeZoom})`, 
                    transformOrigin: 'top center', 
                    transition: 'transform 0.2s', 
                    pointerEvents: isBgEditMode ? 'none' : 'auto' 
                  }}>
                 <SVGConnections tree={draftOrgTree} containerRef={containerRef} zoom={treeZoom} />
                 <div className="org-tree" style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
                   <ul>
                     {renderTree(draftOrgTree)}
                   </ul>
                 </div>
               </div>
             </div>

             
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

      </div>
    </div>
  );
};
