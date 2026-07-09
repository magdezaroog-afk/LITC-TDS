import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════
// Types – الهيكل الجديد للمستدلات
// ═══════════════════════════════════════════════════════════

/** مستدلة فرعية مرتبطة بخيار معين من مستدلة رئيسية */
export interface ChildFieldBinding {
  /** معرّف المستدلة الفرعية */
  childFieldId: string;
  /** الخيار من المستدلة الأم الذي يُطلقها */
  triggerValue: string;
}

export interface DynamicFieldOption {
  id: string;
  label: string;
  isActive: boolean;
}

export interface DynamicCustomField {
  id: string;
  name: string;
  /** خيارات المستدلة المستقلة */
  options: DynamicFieldOption[]; // تحويل من نصوص لكائنات
  // ── نظام قديم (للتوافق) ──
  dependsOn?: string;
  dependencyMap?: Record<string, string[]>;
  // ── النظام الجديد ──
  /** هل هذه مستدلة فرعية؟ وما هي مصادر ربطها */
  childBindings?: ChildFieldBinding[];
}

// ═══════════════════════════════════════════════════════════
// Design Tokens
// ═══════════════════════════════════════════════════════════
const A = {
  text: '#1D1D1F', textSub: '#6E6E73', textTer: '#AEAEB2',
  surface: '#FFFFFF', bg: '#F5F5F7', sep: 'rgba(0,0,0,0.08)', sepStr: 'rgba(0,0,0,0.12)',
  radius: '14px', radiusSm: '10px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF', green: '#34C759', red: '#FF3B30', amber: '#FF9500', indigo: '#5856D6', purple: '#AF52DE',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

const STYLE_ID = 'dft-styles';
const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes dftFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .dft-card { animation: dftFade 0.25s both; transition: box-shadow 0.2s, transform 0.2s; }
    .dft-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
    .dft-btn { transition: all 0.15s ease; cursor: pointer; }
    .dft-btn:hover { opacity: 0.8; }
    .dft-btn:active { transform: scale(0.96); }
    .dft-inp { width:100%; padding:10px 14px; border-radius:10px; border:1.5px solid rgba(0,0,0,0.1); background:#F5F5F7; color:#1D1D1F; font-size:13px; font-family:inherit; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
    .dft-inp:focus { border-color:#5856D6; background:#fff; }
    .dft-tag { display:inline-flex; align-items:center; gap:3px; background:rgba(88,86,214,0.1); color:#5856D6; padding:2px 8px; border-radius:5px; font-size:11px; font-weight:600; }
    .dft-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; cursor:pointer; border:none; font-family:inherit; transition:all 0.15s; }
    .dft-option-tag { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; font-size:12px; border:none; cursor:pointer; font-family:inherit; transition:all 0.15s; }
  `;
  document.head.appendChild(s);
};

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════
const loadFields = (): DynamicCustomField[] => {
  try { const s = localStorage.getItem('litc_dynamic_fields'); return s ? JSON.parse(s) : []; } catch { return []; }
};
const persistFields = (fields: DynamicCustomField[]) => {
  localStorage.setItem('litc_dynamic_fields', JSON.stringify(fields));
};

// --- Soft Delete (Archive) Function for Dynamic Fields ---
const toggleDynamicFieldOptionStatus = (fieldId: string, optionId: string) => {
  try {
    const s = localStorage.getItem('litc_dynamic_fields');
    const fields = s ? JSON.parse(s) : [];
    const updatedFields = fields.map((field: DynamicCustomField) => {
      if (field.id !== fieldId) return field;
      const updatedOptions = field.options.map((opt: DynamicFieldOption) => 
        opt.id === optionId ? { ...opt, isActive: !opt.isActive } : opt
      );
      return { ...field, options: updatedOptions };
    });
    localStorage.setItem('litc_dynamic_fields', JSON.stringify(updatedFields));
    // Note: State might need to be refreshed if called from outside, but this encapsulates the local storage update.
  } catch(e) {}
};
// ---------------------------------------------------------

// ═══════════════════════════════════════════════════════════
// Mini-Component: Option Tag (مع زر حذف)
// ═══════════════════════════════════════════════════════════
const OptionTag: React.FC<{ label: string; onRemove: () => void; color?: string }> = ({ label, onRemove, color = A.indigo }) => (
  <div className="dft-option-tag" style={{ background: `${color}15`, color }}>
    <span>{label}</span>
    <span className="dft-btn" onClick={onRemove} style={{ color, fontSize: 12, fontWeight: 800 }}>×</span>
  </div>
);

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export const DynamicFieldsTab: React.FC = () => {
  useEffect(() => { injectStyles(); }, []);

  const [fields, setFields] = useState<DynamicCustomField[]>(loadFields);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
  const [detailId, setDetailId] = useState<string | null>(null);

  // ── Create Form State ──
  const [newName, setNewName] = useState('');
  const [optionInput, setOptionInput] = useState('');
  const [optionList, setOptionList] = useState<string[]>([]);

  // ── Binding Form State (لربط المستدلات الفرعية بخيارات محددة) ──
  const [bindingParentId, setBindingParentId] = useState<string | null>(null); // المستدلة الرئيسية التي نضيف إليها فرعية
  const [bindTriggerValue, setBindTriggerValue] = useState(''); // الخيار من الرئيسية
  const [bindChildName, setBindChildName] = useState('');
  const [bindChildOptionInput, setBindChildOptionInput] = useState('');
  const [bindChildOptions, setBindChildOptions] = useState<string[]>([]);

  // ── Delete confirm ──
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const save = (updated: DynamicCustomField[]) => { setFields(updated); persistFields(updated); };

  // ── Helpers ──
  const addOption = () => {
    const val = optionInput.trim();
    if (val && !optionList.includes(val)) {
      setOptionList(prev => [...prev, val]);
    }
    setOptionInput('');
  };

  const addBindChildOption = () => {
    const val = bindChildOptionInput.trim();
    if (val && !bindChildOptions.includes(val)) {
      setBindChildOptions(prev => [...prev, val]);
    }
    setBindChildOptionInput('');
  };

  const resetCreate = () => { setNewName(''); setOptionInput(''); setOptionList([]); };
  const resetBinding = () => { setBindingParentId(null); setBindTriggerValue(''); setBindChildName(''); setBindChildOptionInput(''); setBindChildOptions([]); };

  // ── Save new independent field ──
  const handleSaveField = () => {
    if (!newName.trim() || optionList.length === 0) return;
    const field: DynamicCustomField = { id: `field_${Date.now()}`, name: newName.trim(), options: optionList, childBindings: [] };
    save([...fields, field]);
    resetCreate();
    setView('LIST');
  };

  // ── Save child field bound to a specific parent option ──
  const handleSaveChildField = () => {
    if (!bindingParentId || !bindTriggerValue || !bindChildName.trim() || bindChildOptions.length === 0) return;
    const childId = `field_${Date.now()}`;
    const childField: DynamicCustomField = {
      id: childId,
      name: bindChildName.trim(),
      options: bindChildOptions,
      childBindings: [],
      // نحتفظ بـ dependsOn للتوافق مع الكود القديم
      dependsOn: bindingParentId,
      dependencyMap: { [bindTriggerValue]: bindChildOptions },
    };
    // نحدّث الحقل الرئيسي بإضافة الربط
    const updatedParent = fields.map(f => {
      if (f.id !== bindingParentId) return f;
      const existing = f.childBindings || [];
      return { ...f, childBindings: [...existing, { childFieldId: childId, triggerValue: bindTriggerValue }] };
    });
    save([...updatedParent, childField]);
    resetBinding();
  };

  // ── حذف مستدلة (مع أبنائها) ──
  const handleDelete = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;
    const childIds = (field.childBindings || []).map(b => b.childFieldId);
    const toRemove = new Set([id, ...childIds]);
    // إزالة أيضاً من childBindings الآباء
    const updated = fields.filter(f => !toRemove.has(f.id)).map(f => ({
      ...f,
      childBindings: (f.childBindings || []).filter(b => !toRemove.has(b.childFieldId)),
    }));
    save(updated);
    setDeleteConfirm(null);
    if (detailId === id) { setView('LIST'); setDetailId(null); }
  };

  // ── حذف مستدلة فرعية فقط ──
  const handleDeleteChild = (childId: string, parentId: string) => {
    const updated = fields.filter(f => f.id !== childId).map(f => {
      if (f.id !== parentId) return f;
      return { ...f, childBindings: (f.childBindings || []).filter(b => b.childFieldId !== childId) };
    });
    save(updated);
  };

  // ═══════════════════════════════════════════════════════════
  // Sub-views
  // ═══════════════════════════════════════════════════════════

  // View: Detail (صفحة المستدلة الرئيسية مع فروعها)
  const DetailView = () => {
    const field = fields.find(f => f.id === detailId);
    if (!field) return null;
    const bindings = field.childBindings || [];

    // تجميع الفروع حسب الخيار
    const byOption: Record<string, Array<{ binding: ChildFieldBinding; child: DynamicCustomField }>> = {};
    field.options.forEach(opt => { byOption[opt] = []; });
    bindings.forEach(b => {
      const child = fields.find(f => f.id === b.childFieldId);
      if (child && byOption[b.triggerValue] !== undefined) {
        byOption[b.triggerValue].push({ binding: b, child });
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${A.sep}` }}>
          <button className="dft-btn" onClick={() => { setView('LIST'); setDetailId(null); resetBinding(); }}
            style={{ padding: '6px 12px', borderRadius: 8, background: A.bg, border: 'none', fontSize: 12, color: A.textSub }}>
            ← رجوع
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: A.text }}>{field.name}</div>
            <div style={{ fontSize: 12, color: A.textSub }}>مستدلة رئيسية – {field.options.length} خيار</div>
          </div>
        </div>

        {/* Options grid with child bindings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {field.options.map((opt, oi) => {
            const children = byOption[opt] || [];
            const isAddingHere = bindingParentId === field.id && bindTriggerValue === opt;

            return (
              <div key={opt} className="dft-card" style={{ animationDelay: `${oi * 0.04}s`, background: A.surface, borderRadius: A.radius, border: `1px solid ${A.sep}`, boxShadow: A.shadow }}>
                {/* Option Header */}
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: children.length > 0 || isAddingHere ? `1px solid ${A.sep}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${A.indigo}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: A.indigo }}>{oi + 1}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: A.text }}>{opt}</div>
                    {children.length > 0 && <span className="dft-tag">{children.length} فرعية</span>}
                  </div>
                  <button className="dft-btn dft-chip"
                    onClick={() => {
                      if (isAddingHere) { resetBinding(); }
                      else { resetBinding(); setBindingParentId(field.id); setBindTriggerValue(opt); }
                    }}
                    style={{ background: isAddingHere ? `${A.red}15` : `${A.green}15`, color: isAddingHere ? A.red : A.green }}>
                    {isAddingHere ? '× إلغاء' : '+ إضافة مستدلة فرعية'}
                  </button>
                </div>

                {/* Existing Children */}
                {children.length > 0 && (
                  <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {children.map(({ binding, child }) => (
                      <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: `${A.amber}08`, borderRadius: 10, border: `1px solid ${A.amber}20` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: A.amber }}>⬟ {child.name}</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {child.options.map(co => (
                              <span key={co} style={{ padding: '2px 8px', background: `${A.amber}15`, borderRadius: 5, fontSize: 11, color: A.amber, fontWeight: 600 }}>{co}</span>
                            ))}
                          </div>
                        </div>
                        <button className="dft-btn" onClick={() => handleDeleteChild(child.id, field.id)}
                          style={{ padding: '4px 10px', borderRadius: 7, background: `${A.red}10`, border: 'none', fontSize: 11, color: A.red, fontWeight: 700 }}>
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Child Form */}
                {isAddingHere && (
                  <div style={{ padding: '16px 18px', background: `${A.green}06`, borderTop: `1px solid ${A.green}20` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: A.green, marginBottom: 12 }}>
                      ✚ مستدلة فرعية جديدة عند اختيار «{opt}»
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input className="dft-inp" placeholder="اسم المستدلة الفرعية (مثال: تصنيف العطل)" value={bindChildName} onChange={e => setBindChildName(e.target.value)} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="dft-inp" placeholder="اكتب خياراً واضغط Enter للإضافة..." value={bindChildOptionInput}
                          onChange={e => setBindChildOptionInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBindChildOption(); } }}
                          style={{ flex: 1 }} />
                        <button className="dft-btn dft-chip" onClick={addBindChildOption}
                          style={{ background: `${A.green}18`, color: A.green, padding: '8px 14px', borderRadius: 8, flexShrink: 0 }}>+ إضافة خيار</button>
                      </div>
                      {bindChildOptions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {bindChildOptions.map(op => (
                            <OptionTag key={op} label={op} color={A.green} onRemove={() => setBindChildOptions(prev => prev.filter(o => o !== op))} />
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button className="dft-btn"
                          disabled={!bindChildName.trim() || bindChildOptions.length === 0}
                          onClick={handleSaveChildField}
                          style={{ padding: '9px 20px', borderRadius: 9, background: (bindChildName.trim() && bindChildOptions.length > 0) ? A.green : A.textTer, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700 }}>
                          ✓ حفظ المستدلة الفرعية
                        </button>
                        <button className="dft-btn" onClick={resetBinding}
                          style={{ padding: '9px 14px', borderRadius: 9, background: A.bg, border: 'none', fontSize: 12, color: A.textSub }}>إلغاء</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // View: Create new independent field
  const CreateView = () => (
    <div style={{ background: A.surface, borderRadius: A.radius, border: `1px solid ${A.sep}`, boxShadow: A.shadow, padding: 28, maxWidth: 540 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: A.text }}>بناء مستدلة رئيسية</h3>
          <p style={{ margin: 0, fontSize: 12, color: A.textSub }}>قائمة مستقلة — بعد إنشائها يمكنك ربط مستدلات فرعية بكل خيار من خياراتها</p>
        </div>
        <button className="dft-btn" onClick={() => { setView('LIST'); resetCreate(); }}
          style={{ background: 'none', border: 'none', fontSize: 22, color: A.textTer, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 6 }}>اسم المستدلة <span style={{ color: A.red }}>*</span></label>
          <input className="dft-inp" placeholder="مثال: الإدارات، تصنيف العطل، المدينة..." value={newName} onChange={e => setNewName(e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 6 }}>الخيارات <span style={{ color: A.red }}>*</span></label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="dft-inp" placeholder="اكتب خياراً واضغط Enter أو زر إضافة..." value={optionInput}
              onChange={e => setOptionInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
              style={{ flex: 1 }} />
            <button className="dft-btn dft-chip" onClick={addOption}
              style={{ background: `${A.indigo}15`, color: A.indigo, padding: '8px 14px', borderRadius: 8, flexShrink: 0 }}>+ إضافة خيار</button>
          </div>
          <div style={{ fontSize: 12, color: A.textTer, marginTop: 4 }}>اكتب خياراً واحداً في كل مرة واضغط إضافة</div>
          {optionList.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, padding: '10px 12px', background: A.bg, borderRadius: A.radiusSm }}>
              {optionList.map(op => (
                <OptionTag key={op} label={op} color={A.indigo} onRemove={() => setOptionList(prev => prev.filter(o => o !== op))} />
              ))}
            </div>
          )}
        </div>
        {optionList.length > 0 && (
          <div style={{ padding: '10px 14px', background: `${A.green}08`, borderRadius: A.radiusSm, border: `1px solid ${A.green}20`, fontSize: 12, color: A.green, fontWeight: 600 }}>
            💡 بعد الحفظ ستتمكن من الدخول على هذه المستدلة وربط مستدلات فرعية بكل خيار من خياراتها
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: `1px solid ${A.sep}` }}>
          <button className="dft-btn" onClick={handleSaveField} disabled={!newName.trim() || optionList.length === 0}
            style={{ padding: '10px 24px', background: (newName.trim() && optionList.length > 0) ? A.indigo : A.textTer, color: '#fff', border: 'none', borderRadius: A.radiusSm, fontSize: 14, fontWeight: 600, boxShadow: (newName.trim() && optionList.length > 0) ? `0 2px 8px ${A.indigo}40` : 'none' }}>
            حفظ المستدلة
          </button>
          <button className="dft-btn" onClick={() => { setView('LIST'); resetCreate(); }}
            style={{ padding: '10px 20px', background: A.bg, color: A.textSub, border: `1px solid ${A.sep}`, borderRadius: A.radiusSm, fontSize: 14, fontWeight: 600 }}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );

  // View: List
  const parentFields = fields.filter(f => !f.dependsOn);

  return (
    <div style={{ fontFamily: A.font, color: A.text, direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: A.text, letterSpacing: '-0.4px' }}>المستدلات الديناميكية</h2>
          <p style={{ margin: 0, fontSize: 14, color: A.textSub }}>صمّم قوائمك واربط مستدلات فرعية بكل خيار بحرية تامة</p>
        </div>
        {view === 'LIST' && (
          <button className="dft-btn" onClick={() => { resetCreate(); setView('CREATE'); }}
            style={{ padding: '10px 20px', background: A.indigo, color: '#fff', border: 'none', borderRadius: A.radiusSm, fontSize: 14, fontWeight: 600, boxShadow: `0 2px 8px ${A.indigo}40`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>+</span> مستدلة رئيسية جديدة
          </button>
        )}
      </div>

      {view === 'CREATE' && CreateView()}
      {view === 'DETAIL' && detailId && DetailView()}

      {view === 'LIST' && (
        <div>
          {parentFields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: A.surface, borderRadius: A.radius, border: `2px dashed ${A.sep}` }}>
              <div style={{ fontSize: 40, marginBottom: 15 }}>✨</div>
              <h3 style={{ margin: '0 0 10px', fontSize: 18, color: A.text }}>لا توجد مستدلات حالياً</h3>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: A.textSub }}>ابدأ بإنشاء مستدلات لتصنيف بياناتك وتنظيم مسارات التذاكر الخاصة بك بمرونة.</p>
              <button className="dft-btn" onClick={() => { resetCreate(); setView('CREATE'); }} style={{ padding: '10px 24px', background: A.indigo, color: '#fff', border: 'none', borderRadius: A.radiusSm, fontSize: 14, fontWeight: 700, boxShadow: `0 4px 12px ${A.indigo}50` }}>+ إنشاء أول مستدلة</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              {/* Complex Fields Section */}
              {parentFields.filter(f => (f.childBindings || []).length > 0).length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: A.amber }}>🌳</span> مستدلات مركبة (لها تفرعات)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {parentFields.filter(f => (f.childBindings || []).length > 0).map((field, idx) => {
                      const totalChildren = (field.childBindings || []).length;
                      const optionsWithChildren = new Set((field.childBindings || []).map(b => b.triggerValue)).size;

                      return (
                        <div key={field.id} className="dft-card" style={{ animationDelay: `${idx * 0.05}s`, background: A.surface, borderRadius: A.radius, border: `1px solid ${A.amber}40`, boxShadow: A.shadow, padding: '16px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => { setDetailId(field.id); setView('DETAIL'); resetBinding(); }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>{field.name}</div>
                                <span style={{ padding: '2px 8px', background: `${A.amber}15`, color: A.amber, borderRadius: 5, fontSize: 11, fontWeight: 600 }}>مستدلة مركبة</span>
                              </div>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                {field.options.slice(0, 4).map(opt => {
                                  const hasChild = (field.childBindings || []).some(b => b.triggerValue === opt);
                                  return (
                                    <span key={opt} style={{ padding: '2px 8px', background: hasChild ? `${A.amber}15` : A.bg, color: hasChild ? A.amber : A.textSub, borderRadius: 6, fontSize: 11, fontWeight: hasChild ? 700 : 400, border: `1px solid ${hasChild ? A.amber + '30' : A.sep}` }}>
                                      {opt} {hasChild ? '🔗' : ''}
                                    </span>
                                  );
                                })}
                                {field.options.length > 4 && <span style={{ fontSize: 11, color: A.textTer, alignSelf: 'center' }}>+{field.options.length - 4}</span>}
                              </div>
                              <div style={{ fontSize: 12, color: A.textSub }}>
                                <span style={{ color: A.amber, fontWeight: 600 }}>⬟ {totalChildren} مستدلة فرعية</span>
                                <span style={{ marginRight: 6 }}>عبر {optionsWithChildren} خيار</span>
                                <span style={{ color: A.blue, fontWeight: 600 }}> ← انقر للتفاصيل</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button className="dft-btn" onClick={() => { setDetailId(field.id); setView('DETAIL'); resetBinding(); }}
                                style={{ width: 32, height: 32, borderRadius: 8, background: `${A.blue}15`, color: A.blue, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✏️
                              </button>
                              <button className="dft-btn" onClick={() => setDeleteConfirm(field.id)}
                                style={{ width: 32, height: 32, borderRadius: 8, background: `${A.red}15`, color: A.red, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                          {deleteConfirm === field.id && (
                            <div style={{ marginTop: 12, padding: 12, background: `${A.red}10`, borderRadius: 8, border: `1px solid ${A.red}30` }}>
                              <div style={{ fontSize: 12, color: A.red, fontWeight: 600, marginBottom: 8 }}>هل أنت متأكد؟ سيتم حذفها مع التفرعات.</div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="dft-btn" onClick={() => handleDelete(field.id)} style={{ flex: 1, padding: '6px', background: A.red, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>نعم، احذف</button>
                                <button className="dft-btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '6px', background: '#fff', color: A.textSub, border: `1px solid ${A.sep}`, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>إلغاء</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Simple Fields Section */}
              {parentFields.filter(f => (f.childBindings || []).length === 0).length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: A.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: A.green }}>📄</span> مستدلات بسيطة
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {parentFields.filter(f => (f.childBindings || []).length === 0).map((field, idx) => (
                        <div key={field.id} className="dft-card" style={{ animationDelay: `${idx * 0.05}s`, background: A.surface, borderRadius: A.radius, border: `1px solid ${A.sep}`, boxShadow: A.shadow, padding: '16px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => { setDetailId(field.id); setView('DETAIL'); resetBinding(); }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>{field.name}</div>
                                <span style={{ padding: '2px 8px', background: `${A.green}15`, color: A.green, borderRadius: 5, fontSize: 11, fontWeight: 600 }}>مستدلة بسيطة</span>
                              </div>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                {field.options.slice(0, 5).map(opt => (
                                  <span key={opt} style={{ padding: '2px 8px', background: A.bg, color: A.textSub, borderRadius: 6, fontSize: 11, fontWeight: 400, border: `1px solid ${A.sep}` }}>
                                    {opt}
                                  </span>
                                ))}
                                {field.options.length > 5 && <span style={{ fontSize: 11, color: A.textTer, alignSelf: 'center' }}>+{field.options.length - 5}</span>}
                              </div>
                              <div style={{ fontSize: 12, color: A.textTer }}>لا يوجد ارتباطات فرعية - انقر للتفاصيل أو الإضافة</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                              <button className="dft-btn" onClick={() => { setDetailId(field.id); setView('DETAIL'); resetBinding(); }}
                                style={{ width: 32, height: 32, borderRadius: 8, background: `${A.blue}15`, color: A.blue, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✏️
                              </button>
                              <button className="dft-btn" onClick={() => setDeleteConfirm(field.id)}
                                style={{ width: 32, height: 32, borderRadius: 8, background: `${A.red}15`, color: A.red, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                          {deleteConfirm === field.id && (
                            <div style={{ marginTop: 12, padding: 12, background: `${A.red}10`, borderRadius: 8, border: `1px solid ${A.red}30` }}>
                              <div style={{ fontSize: 12, color: A.red, fontWeight: 600, marginBottom: 8 }}>هل أنت متأكد؟</div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="dft-btn" onClick={() => handleDelete(field.id)} style={{ flex: 1, padding: '6px', background: A.red, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>نعم، احذف</button>
                                <button className="dft-btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '6px', background: '#fff', color: A.textSub, border: `1px solid ${A.sep}`, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>إلغاء</button>
                              </div>
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
