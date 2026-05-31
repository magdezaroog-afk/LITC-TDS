import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';

export interface DynamicCustomField {
  id: string;
  name: string;
  options: string[];
  dependsOn?: string; // id of the parent field
  dependencyMap?: Record<string, string[]>; // { "ParentOption1": ["ChildOpt1", "ChildOpt2"] }
}

export const DynamicFieldsTab: React.FC = () => {
  const theme = useTheme();
  
  const [fields, setFields] = useState<DynamicCustomField[]>([]);
  const [activeView, setActiveView] = useState<'LIST' | 'CREATE'>('LIST');
  
  // Create state
  const [newFieldName, setNewFieldName] = useState('');
  const [dependsOn, setDependsOn] = useState<string>('');
  
  // For independent fields
  const [newOptionsInput, setNewOptionsInput] = useState('');
  
  // For dependent fields
  const [dependencyInputMap, setDependencyInputMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem('litc_dynamic_fields');
    if (saved) {
      try {
        setFields(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse dynamic fields');
      }
    }
  }, []);

  const saveFields = (updatedFields: DynamicCustomField[]) => {
    setFields(updatedFields);
    localStorage.setItem('litc_dynamic_fields', JSON.stringify(updatedFields));
  };

  const handleSaveField = () => {
    if (!newFieldName) return;
    
    let newField: DynamicCustomField = {
      id: `field_${Date.now()}`,
      name: newFieldName,
      options: []
    };

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
    if (parent.options && parent.options.length > 0) return parent.options;
    if (parent.dependencyMap) {
      const allOpts = new Set<string>();
      Object.values(parent.dependencyMap).forEach(list => list.forEach(opt => allOpts.add(opt)));
      return Array.from(allOpts);
    }
    return [];
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '16px',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)'
  };

  const btnStyle = (bg: string): React.CSSProperties => ({
    padding: '10px 20px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#111', color: '#fff', marginBottom: '15px' 
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#00e5ff' }}>منشئ المستدلات الحرة (Free-form Schemas)</h2>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#aaa' }}>صمم قوائمك الخاصة واربطها ببعضها بحرية تامة دون قيود النظام.</p>
        </div>
        {activeView === 'LIST' && (
          <button onClick={() => { resetForm(); setActiveView('CREATE'); }} style={btnStyle('linear-gradient(90deg, #00e5ff 0%, #0077ff 100%)')}>+ بناء مستدلة جديدة</button>
        )}
      </div>

      {activeView === 'LIST' ? (
        <div>
          {fields.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>لا توجد أي مستدلات مصممة حالياً. ابدأ بإنشاء مستدلتك الأولى.</div>
          ) : (
            fields.map(field => {
              const parentField = fields.find(f => f.id === field.dependsOn);
              return (
                <div key={field.id} style={cardStyle}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{field.name}</strong>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {parentField ? (
                        <span>🔗 يعتمد على: <span style={{ color: '#ffab00' }}>{parentField.name}</span></span>
                      ) : (
                        <span style={{ color: '#00ffaa' }}>مستدلة رئيسية (مستقلة)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                      {field.dependsOn ? 'تحتوي على خيارات مخصصة بناءً على المصدر' : `الخيارات: ${field.options.join('، ')}`}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => handleDelete(field.id)} style={btnStyle('rgba(255,0,0,0.2)')}>حذف</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#fff' }}>بناء مستدلة (Dropdown Field)</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>اسم المستدلة (مثال: الإدارات، تصنيف العطل):</label>
          <input 
            type="text" 
            value={newFieldName} 
            onChange={(e) => setNewFieldName(e.target.value)} 
            placeholder="اسم المستدلة المخصصة..."
            style={inputStyle} 
          />

          <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>هل تعتمد هذه المستدلة على مستدلة أخرى؟ (Cascading Dependency)</label>
          <select 
            value={dependsOn} 
            onChange={(e) => setDependsOn(e.target.value)}
            style={inputStyle}
          >
            <option value="">لا، مستدلة رئيسية مستقلة</option>
            {fields.map(f => <option key={f.id} value={f.id}>نعم، تعتمد على: {f.name}</option>)}
          </select>

          {dependsOn ? (
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed #555', marginBottom: '15px' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#ffab00' }}>اربط الخيارات بالاعتماد على المصدر:</h5>
              {getParentOptions(dependsOn).map(parentOpt => (
                <div key={parentOpt} style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>إذا اختار المستخدم ({parentOpt})، أظهر له الخيارات التالية:</label>
                  <input 
                    type="text" 
                    placeholder="خيارات مفصولة بفاصلة (مثال: مكتب أ، مكتب ب)..." 
                    style={{ ...inputStyle, marginBottom: 0 }}
                    value={dependencyInputMap[parentOpt] || ''}
                    onChange={e => setDependencyInputMap({...dependencyInputMap, [parentOpt]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>الخيارات المتاحة (مفصولة بفاصلة):</label>
              <input 
                type="text" 
                value={newOptionsInput} 
                onChange={(e) => setNewOptionsInput(e.target.value)} 
                placeholder="مثال: الرياض، جدة، الدمام..."
                style={inputStyle} 
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleSaveField} style={btnStyle('#00e5ff')}>تكوين المستدلة وحفظها</button>
            <button onClick={() => setActiveView('LIST')} style={{ ...btnStyle('transparent'), border: '1px solid #555' }}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
};
