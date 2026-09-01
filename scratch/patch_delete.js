const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(
  /const handleDeleteEntity = \(type: 'DEPARTMENT' \| 'DIVISION' \| 'TEAM', id: string, name: string\) => \{\r?\n\s+if \(\!window\.confirm\(`هل أنت متأكد من رغبتك في حذف \(\$\{name\}\)؟ لا يمكن التراجع عن هذا الإجراء\.`\)\) return;/g,
  `const handleDeleteEntity = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string, name: string) => {
    setConfirmDeleteModal({ type, id, name });
  };

  const executeDeleteEntity = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string) => {`
);

c = c.replace(
  /const \[addEntityModalOpen, setAddEntityModalOpen\]/g,
  `const [confirmDeleteModal, setConfirmDeleteModal] = useState<{type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string, name: string} | null>(null);
  const [addEntityModalOpen, setAddEntityModalOpen]`
);

// Add the modal JSX just before the toast message
c = c.replace(
  /\{\/\* --- Toast Message Notification ---\ *\/\}/,
  `{/* --- Delete Confirmation Modal --- */}
      <AnimatePresence>
        {confirmDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ background: '#fff', padding: '30px', borderRadius: OA.radius, width: '400px', boxShadow: OA.shadow, direction: 'rtl' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
              <h3 style={{ margin: '0 0 10px 0', color: OA.text }}>تأكيد الحذف</h3>
              <p style={{ margin: '0 0 20px 0', color: OA.textSub, fontSize: '14px', lineHeight: 1.5 }}>
                هل أنت متأكد من رغبتك في حذف ({confirmDeleteModal.name})؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmDeleteModal(null)} style={{ padding: '10px 20px', borderRadius: OA.radiusSm, border: 'none', background: OA.bg, color: OA.textSub, cursor: 'pointer', fontWeight: 600 }}>إلغاء</button>
                <button onClick={() => { executeDeleteEntity(confirmDeleteModal.type, confirmDeleteModal.id); setConfirmDeleteModal(null); }} style={{ padding: '10px 20px', borderRadius: OA.radiusSm, border: 'none', background: OA.red, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>نعم، احذف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Toast Message Notification --- */}`
);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Delete patched.');
