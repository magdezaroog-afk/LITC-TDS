import React, { useState, useEffect } from 'react';

export interface DynamicCustomField {
  id: string;
  name: string;
  options: string[];
  dependsOn?: string;
  dependencyMap?: Record<string, string[]>;
}

/* ── Apple Design Tokens ── */
const A = {
  text: '#1D1D1F',
  textSub: '#6E6E73',
  textTer: '#AEAEB2',
  surface: '#FFFFFF',
  bg: '#F5F5F7',
  sep: 'rgba(0,0,0,0.08)',
  sepStr: 'rgba(0,0,0,0.12)',
  radius: '14px',
  radiusSm: '10px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  amber: '#FF9500',
  indigo: '#5856D6',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

export const DynamicFieldsTab: React.FC = () => {
  const [fields, setFields] = useState<DynamicCustomField[]>([]);
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE'>('LIST');
  const [newFieldName, setNewFieldName] = useState('');
  const [dependsOn, setDependsOn] = useState<string>('');
  const [newOptionsInput, setNewOptionsInput] = useState('');
  const [dependencyInputMap, setDependencyInputMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('litc_dynamic_fields');
    if (saved) {
      try { setFields(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveFields = (updatedFields: DynamicCustomField[]) => {
    setFields(updatedFields);
    localStorage.setItem('litc_dynamic_fields', JSON.stringify(updatedFields));
  };

  const handleSaveField = () => {
    if (!newFieldName) return;
    let newField: DynamicCustomField = { id: `field_${Date.now()}`, name: newFieldName, options: [] };
    if (dependsOn) {
      newField.dependsOn = dependsOn;
      const parsedMap: Record<string, string[]> = {};
      Object.keys(dependencyInputMap).forEach(key => {
        const opts = dependencyInputMap[key].split(',').map(s => s.trim()).filter(s => s);
        if (opts.length > 0) parsedMap[key] = opts;
      });
      newField.dependencyMap = parsedMap;
    } else {
      newField.options = newOptionsInput.split(',').map(s => s.trim()).filter(s => s);
    }
    saveFields([...fields, newField]);
    setActiveView('LIST');
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المستدلة؟ قد يؤثر ذلك على الاعتماديات المرتبطة.')) {
      saveFields(fields.filter(f => f.id !== id));
    }
  };

  const resetForm = () => {
    setNewFieldName('');
    setDependsOn('');
    setNewOptionsInput('');
    setDependencyInputMap({});
  };

  const getParentOptions = (parentId: string) => {
    const parent = fields.find(f => f.id === parentId);
    if (!parent) return [];
    if (parent.options?.length > 0) return parent.options;
    if (parent.dependencyMap) {
      const allOpts = new Set<string>();
      Object.values(parent.dependencyMap).forEach(list => list.forEach(opt => allOpts.add(opt)));
      return Array.from(allOpts);
    }
    return [];
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: A.radiusSm,
    border: `1px solid ${A.sepStr}`,
    background: A.bg,
    color: A.text,
    fontSize: '14px',
    fontFamily: A.font,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ fontFamily: A.font, color: A.text, maxWidth: '800px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: A.text, letterSpacing: '-0.4px' }}>
            المستدلات الديناميكية
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: A.textSub }}>
            صمّم قوائمك الخاصة واربطها بحرية تامة دون قيود النظام
          </p>
        </div>
        {activeView === 'LIST' && (
          <button
            onClick={() => { resetForm(); setActiveView('CREATE'); }}
            style={{
              padding: '10px 20px',
              background: A.indigo,
              color: '#fff',
              border: 'none',
              borderRadius: A.radiusSm,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: A.font,
              boxShadow: `0 2px 8px ${A.indigo}40`,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontSize: '16px' }}>+</span> بناء مستدلة جديدة
          </button>
        )}
      </div>

      {activeView === 'LIST' ? (
        <div>
          {fields.length === 0 ? (
            /* Empty State */
            <div style={{
              background: A.surface,
              borderRadius: A.radius,
              border: `1px solid ${A.sep}`,
              boxShadow: A.shadow,
              padding: '64px 32px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗂️</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: A.text, marginBottom: '8px' }}>
                لا توجد مستدلات بعد
              </div>
              <div style={{ fontSize: '14px', color: A.textSub, marginBottom: '24px' }}>
                ابدأ بإنشاء مستدلتك الأولى لإضافة حقول مخصصة لنماذج التذاكر
              </div>
              <button
                onClick={() => { resetForm(); setActiveView('CREATE'); }}
                style={{
                  padding: '10px 24px',
                  background: `${A.indigo}15`,
                  color: A.indigo,
                  border: `1px solid ${A.indigo}25`,
                  borderRadius: A.radiusSm,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: A.font,
                }}
              >
                إنشاء أول مستدلة
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fields.map(field => {
                const parentField = fields.find(f => f.id === field.dependsOn);
                return (
                  <div
                    key={field.id}
                    style={{
                      background: A.surface,
                      borderRadius: A.radius,
                      border: `1px solid ${A.sep}`,
                      boxShadow: A.shadow,
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: A.text, marginBottom: '4px' }}>
                        {field.name}
                      </div>
                      <div style={{ fontSize: '12px', color: A.textSub }}>
                        {parentField ? (
                          <span>
                            مرتبطة بـ{' '}
                            <span style={{ color: A.amber, fontWeight: '600' }}>{parentField.name}</span>
                          </span>
                        ) : (
                          <span style={{ color: A.green, fontWeight: '500' }}>مستدلة رئيسية مستقلة</span>
                        )}
                      </div>
                      {!field.dependsOn && field.options.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {field.options.slice(0, 4).map(opt => (
                            <span key={opt} style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              background: A.bg,
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: A.textSub,
                              border: `1px solid ${A.sep}`,
                            }}>{opt}</span>
                          ))}
                          {field.options.length > 4 && (
                            <span style={{ fontSize: '11px', color: A.textTer, alignSelf: 'center' }}>
                              +{field.options.length - 4} أكثر
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(field.id)}
                      style={{
                        padding: '7px 14px',
                        background: `${A.red}10`,
                        color: A.red,
                        border: `1px solid ${A.red}20`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: A.font,
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${A.red}20`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${A.red}10`; }}
                    >
                      حذف
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Create Form */
        <div style={{
          background: A.surface,
          borderRadius: A.radius,
          border: `1px solid ${A.sep}`,
          boxShadow: A.shadow,
          padding: '28px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '700', color: A.text }}>
                بناء مستدلة جديدة
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: A.textSub }}>
                Dropdown Field — قائمة اختيار مخصصة
              </p>
            </div>
            <button
              onClick={() => setActiveView('LIST')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: A.textTer, fontSize: '22px', lineHeight: 1, padding: '4px',
                borderRadius: '6px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: A.text, marginBottom: '6px' }}>
                اسم المستدلة
              </label>
              <input
                type="text"
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                placeholder="مثال: الإدارات، تصنيف العطل، المدينة..."
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = A.indigo; }}
                onBlur={e => { e.currentTarget.style.borderColor = A.sepStr; }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: A.text, marginBottom: '6px' }}>
                الاعتماد على مستدلة أخرى (Cascading)
              </label>
              <select
                value={dependsOn}
                onChange={e => setDependsOn(e.target.value)}
                style={selectStyle}
              >
                <option value="">مستقلة — لا تعتمد على أي مستدلة</option>
                {fields.map(f => <option key={f.id} value={f.id}>تعتمد على: {f.name}</option>)}
              </select>
            </div>

            {dependsOn ? (
              <div style={{
                background: `${A.amber}08`, borderRadius: A.radiusSm,
                border: `1px solid ${A.amber}20`, padding: '16px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: A.amber, marginBottom: '12px' }}>
                  ربط الخيارات بالمصدر
                </div>
                {getParentOptions(dependsOn).map(parentOpt => (
                  <div key={parentOpt} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: A.textSub, marginBottom: '5px' }}>
                      إذا اختار المستخدم "<strong>{parentOpt}</strong>" أظهر له:
                    </label>
                    <input
                      type="text"
                      placeholder="خيارات مفصولة بفاصلة..."
                      style={{ ...inputStyle, marginBottom: 0 }}
                      value={dependencyInputMap[parentOpt] || ''}
                      onChange={e => setDependencyInputMap({ ...dependencyInputMap, [parentOpt]: e.target.value })}
                      onFocus={e => { e.currentTarget.style.borderColor = A.amber; }}
                      onBlur={e => { e.currentTarget.style.borderColor = A.sepStr; }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: A.text, marginBottom: '6px' }}>
                  الخيارات المتاحة
                </label>
                <input
                  type="text"
                  value={newOptionsInput}
                  onChange={e => setNewOptionsInput(e.target.value)}
                  placeholder="مثال: الرياض، جدة، الدمام..."
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = A.indigo; }}
                  onBlur={e => { e.currentTarget.style.borderColor = A.sepStr; }}
                />
                <div style={{ fontSize: '12px', color: A.textTer, marginTop: '4px' }}>
                  افصل بين الخيارات بفاصلة
                </div>
              </div>
            )}

            <div style={{
              display: 'flex', gap: '10px', paddingTop: '8px',
              borderTop: `1px solid ${A.sep}`, marginTop: '4px',
            }}>
              <button
                onClick={handleSaveField}
                disabled={!newFieldName}
                style={{
                  padding: '10px 24px',
                  background: newFieldName ? A.indigo : A.textTer,
                  color: '#fff',
                  border: 'none',
                  borderRadius: A.radiusSm,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newFieldName ? 'pointer' : 'not-allowed',
                  fontFamily: A.font,
                  transition: 'all 0.2s ease',
                  boxShadow: newFieldName ? `0 2px 8px ${A.indigo}40` : 'none',
                }}
              >
                حفظ المستدلة
              </button>
              <button
                onClick={() => setActiveView('LIST')}
                style={{
                  padding: '10px 20px',
                  background: A.bg,
                  color: A.textSub,
                  border: `1px solid ${A.sep}`,
                  borderRadius: A.radiusSm,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: A.font,
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
