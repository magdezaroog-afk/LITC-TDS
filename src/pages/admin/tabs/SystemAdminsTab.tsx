import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../../services/admin.api';

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

export const SystemAdminsTab: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await AdminAPI.getUserPool();
      const adminUsers = data.users.filter((u: any) => u.role?.name === 'System_Admin' || u.role?.name === 'IT_Admin');
      setAdmins(adminUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: APPLE.font, animation: 'appleReveal 0.5s ease forwards' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: APPLE.text, margin: '0 0 8px 0' }}>حوض مدراء النظام</h2>
        <p style={{ color: APPLE.textSecondary, margin: 0, fontSize: '15px' }}>
          إدارة حسابات وصلاحيات مدراء النظام (System Admins & IT Admins).
        </p>
      </div>

      <div style={{ background: APPLE.surface, borderRadius: APPLE.radiusLg, boxShadow: APPLE.shadowCard, border: `1px solid ${APPLE.separator}`, minHeight: '400px', padding: '20px' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: APPLE.textSecondary }}>جاري التحميل...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: APPLE.bg, borderBottom: `1px solid ${APPLE.separator}` }}>
              <tr>
                <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الاسم</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الدور (Role)</th>
                <th style={{ padding: '12px 20px', textAlign: 'center', color: APPLE.textSecondary, fontSize: '13px', fontWeight: '600' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: APPLE.textSecondary }}>
                    لا يوجد مدراء نظام مسجلين حالياً.
                  </td>
                </tr>
              ) : (
                admins.map(user => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${APPLE.separator}` }}>
                    <td style={{ padding: '16px 20px', fontWeight: 'bold', color: APPLE.text }}>{user.fullName || user.username}</td>
                    <td style={{ padding: '16px 20px', color: APPLE.textSecondary }}>{user.email}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ background: `${APPLE.blue}15`, color: APPLE.blue, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {user.role?.name || 'System_Admin'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button onClick={() => alert('إدارة الصلاحيات ستكون متاحة قريباً...')} style={{ background: 'transparent', color: APPLE.blue, border: `1px solid ${APPLE.blue}`, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        إدارة الصلاحيات
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
