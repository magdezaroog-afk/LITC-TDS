import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';

interface SystemReference {
  id: number;
  globalId: string;
  name: string;
  type: string;
  parentId: number | null;
  isActive: boolean;
  children?: SystemReference[];
}

export const ReferenceTreeBuilder: React.FC = () => {
  const theme = useTheme();
  const [references, setReferences] = useState<SystemReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('DEPARTMENT');
  const [newParentId, setNewParentId] = useState<number | ''>('');

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('litc_token') || 'token123';
      const res = await fetch('/api/v1/admin/references', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReferences(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch references', err);
      setError('فشل في تحميل المستدلات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const token = localStorage.getItem('litc_token') || 'token123';
      const res = await fetch('/api/v1/admin/references', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          type: newType,
          parentId: newParentId === '' ? null : Number(newParentId)
        })
      });
      if (res.ok) {
        setNewName('');
        setNewParentId('');
        fetchReferences();
      } else {
        const errorData = await res.json();
        setError(errorData.message || 'فشل في الإنشاء');
      }
    } catch (err) {
      setError('خطأ في الاتصال بالسيرفر');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('litc_token') || 'token123';
      const res = await fetch(`/api/v1/admin/references/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchReferences();
      }
    } catch (err) {
      setError('فشل في عملية الحذف الناعم');
    }
  };

  return (
    <div style={{
      background: 'rgba(20, 20, 30, 0.65)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${theme.colors?.primary || '#00e5ff'}40`,
      borderRadius: '16px',
      padding: '24px',
      marginTop: '20px',
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
    }}>
      <h3 style={{
        color: '#fff',
        margin: '0 0 20px 0',
        textShadow: `0 0 10px ${theme.colors?.primary || '#00e5ff'}`
      }}>بناء المستدلات الديناميكية (Reference Tree Builder)</h3>
      
      {error && <div style={{ color: '#ff4d4d', marginBottom: '10px', textShadow: '0 0 8px #ff4d4d' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="اسم المستدل (مثال: مبنى الإدارة)" 
          value={newName}
          onChange={e => setNewName(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', 
            padding: '10px 16px', borderRadius: '8px', flex: 1, minWidth: '200px'
          }}
        />
        <select 
          value={newType} 
          onChange={e => setNewType(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', 
            padding: '10px 16px', borderRadius: '8px', minWidth: '150px'
          }}
        >
          <option value="DEPARTMENT">إدارة / قسم</option>
          <option value="BUILDING">مبنى</option>
          <option value="ISSUE">مشكلة</option>
        </select>
        <select 
          value={newParentId} 
          onChange={e => setNewParentId(e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: '#fff', 
            padding: '10px 16px', borderRadius: '8px', minWidth: '150px'
          }}
        >
          <option value="">بدون أب (Root)</option>
          {references.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
          ))}
        </select>
        <button 
          onClick={handleCreate}
          style={{
            background: `linear-gradient(135deg, ${theme.colors?.primary || '#00e5ff'} 0%, #0088ff 100%)`,
            border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '8px',
            cursor: 'pointer', fontWeight: 'bold', boxShadow: `0 0 15px ${theme.colors?.primary || '#00e5ff'}60`
          }}
        >
          إضافة
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? <p style={{color: '#fff'}}>جاري التحميل...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: `2px solid ${theme.colors?.primary || '#00e5ff'}` }}>
                <th style={{ padding: '12px', textAlign: 'right' }}>الاسم</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>النوع</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>المرجع الأب</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {references.map(ref => (
                <tr key={ref.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '12px' }}>{ref.name}</td>
                  <td style={{ padding: '12px' }}><span style={{
                    background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px'
                  }}>{ref.type}</span></td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{ref.parentId || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(ref.id)}
                      style={{
                        background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d',
                        padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                        boxShadow: '0 0 8px rgba(255, 77, 77, 0.3)'
                      }}
                    >
                      حذف (Soft)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
