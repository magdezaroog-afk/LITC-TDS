import React, { useState } from 'react';
import { AuditService } from '../../../backend/services/AuditService';

interface MockUser {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  externalAliases?: string;
  ssoProvider: string;
}

const mockUsers: MockUser[] = [
  { id: 1, fullName: 'أحمد محمود', email: 'ahmed@litc.ly', phone: '0912345678', ssoProvider: 'Entra ID' },
  { id: 2, fullName: 'سارة خالد', ssoProvider: 'Entra ID' }, // Missing email & phone
  { id: 3, fullName: 'خالد عبد الله', phone: '0923456789', ssoProvider: 'Local CSV' }, // Missing email
];

export const IdentityHubTab: React.FC = () => {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Patching Form State
  const [patchEmail, setPatchEmail] = useState('');
  const [patchPhone, setPatchPhone] = useState('');
  const [patchAliases, setPatchAliases] = useState('');

  const glassPanel: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    borderRadius: '16px',
    padding: '25px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
  };

  const handleEditClick = (user: MockUser) => {
    setEditingUserId(user.id);
    setPatchEmail(user.email || '');
    setPatchPhone(user.phone || '');
    setPatchAliases(user.externalAliases || '');
  };

  const handleSavePatch = () => {
    if (editingUserId === null) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          email: patchEmail || undefined,
          phone: patchPhone || undefined,
          externalAliases: patchAliases || undefined
        };
      }
      return u;
    }));
    
    AuditService.logSecurityEvent('Admin_1', 'IDENTITY_PATCHED', { patchedUserId: editingUserId, newEmail: patchEmail, newPhone: patchPhone, newAliases: patchAliases });
    setEditingUserId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: '#065F46', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔑 إداراة الهوية والربط المؤسسي (SSO Hub)</span>
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#047857', fontSize: '14px' }}>
            Federated Identity & User Directory Reconciliation Center
          </p>
        </div>
      </div>

      {/* SECTION 1: SSO Provider Management */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Entra ID Card */}
        <div style={{ ...glassPanel, borderTop: '4px solid #0ea5e9' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#0ea5e9', fontSize: '20px' }}>💠</span> Microsoft Entra ID (OIDC)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Tenant ID</label>
              <input type="text" placeholder="e.g. 8aef..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Client ID</label>
              <input type="text" placeholder="e.g. 1b2c..." style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Client Secret</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div style={{ padding: '10px', background: 'rgba(14, 165, 233, 0.05)', border: '1px dashed #0ea5e9', borderRadius: '6px', marginTop: '10px' }}>
              <label style={{ fontSize: '11px', color: '#0ea5e9', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Redirect URI (Read-only)</label>
              <code style={{ fontSize: '12px', color: '#334155' }}>https://litc.ly/api/auth/callback/microsoft</code>
            </div>
          </div>
        </div>

        {/* Local CSV Card */}
        <div style={{ ...glassPanel, borderTop: '4px solid #10b981' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#10b981', fontSize: '20px' }}>📄</span> Local Identity Import (CSV/Excel)
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Upload legacy systems data or local active directories using standard CSV files.
          </p>
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '30px', textAlign: 'center', background: '#f8fafc', cursor: 'pointer' }}>
            <div style={{ fontSize: '30px', marginBottom: '10px' }}>📥</div>
            <div style={{ color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}>اسحب وأفلت ملف CSV هنا</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px' }}>أو انقر لاختيار ملف</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: User Directory & Data Patching Center */}
      <div style={{ ...glassPanel }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
          دليل المستخدمين الموحد (Directory Reconciliation)
        </h3>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '13px' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>الاسم الكامل</th>
              <th style={{ padding: '12px' }}>البريد الإلكتروني</th>
              <th style={{ padding: '12px' }}>رقم الهاتف</th>
              <th style={{ padding: '12px' }}>المصدر (Provider)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const hasGap = !user.email || !user.phone;
              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', background: hasGap ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                  <td style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>#{user.id}</td>
                  <td style={{ padding: '15px', color: '#0f172a', fontWeight: 'bold', fontSize: '14px' }}>{user.fullName}</td>
                  <td style={{ padding: '15px', fontSize: '13px' }}>
                    {user.email ? <span style={{ color: '#334155' }}>{user.email}</span> : <span style={{ color: '#f59e0b', fontSize: '11px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>مفقود</span>}
                  </td>
                  <td style={{ padding: '15px', fontSize: '13px' }}>
                    {user.phone ? <span style={{ color: '#334155' }}>{user.phone}</span> : <span style={{ color: '#f59e0b', fontSize: '11px', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>مفقود</span>}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{user.ssoProvider}</span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEditClick(user)}
                      style={{ padding: '6px 12px', background: hasGap ? '#f59e0b' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                      🛠️ تصحيح وتعديل البيانات
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 3: Data Patching Overlay */}
      {editingUserId !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 90000 }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '18px' }}>🛠️ تعديل السجل وتصحيح الفجوات</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>البريد الإلكتروني (Email)</label>
              <input type="text" value={patchEmail} onChange={e => setPatchEmail(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>رقم الهاتف (Phone)</label>
              <input type="text" value={patchPhone} onChange={e => setPatchPhone(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '5px' }}>معرفات الأنظمة الخارجية (External Aliases JSON)</label>
              <textarea value={patchAliases} onChange={e => setPatchAliases(e.target.value)} placeholder='{"assetManagerId": "U-991"}' rows={3} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace' }}></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingUserId(null)} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button onClick={handleSavePatch} style={{ padding: '10px 15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>حفظ التعديلات ✅</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
