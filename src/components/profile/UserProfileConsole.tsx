import React, { useState } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { ReferenceTreeBuilder } from '../admin/ReferenceTreeBuilder';

export const UserProfileConsole: React.FC = () => {
  const theme = useTheme();
  const { user, login } = useAuth(); // Assume login can be used to update token/state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(user?.buildingId || '');

  const handleSaveBuilding = async () => {
    if (!selectedBuildingId) {
      setError('يرجى تحديد المبنى قبل الحفظ.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/v1/users/profile/building', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({ buildingId: selectedBuildingId })
      });
      
      const res = await response.json();
      
      if (!response.ok) {
        throw new Error(res.message || 'فشل تحديث ملف المستخدم');
      }
      
      setSuccess('تم حفظ الارتباط بالكيان بنجاح. ' + res.message);
      
      // Update local context manually for demo
      if (user) {
        user.buildingId = selectedBuildingId;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.xl,
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.95) 100%)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.1)',
    color: '#0f172a',
    fontFamily: theme.typography.fontFamily,
    direction: 'rtl',
    maxWidth: '800px',
    margin: '40px auto'
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#6366f1',
    textShadow: '0 0 10px rgba(99, 102, 241, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: theme.spacing.xl,
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    paddingBottom: theme.spacing.sm
  };

  const infoRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    background: 'rgba(99, 102, 241, 0.04)',
    borderRadius: '12px',
    marginBottom: '10px',
    border: '1px solid rgba(0,0,0,0.04)'
  };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            color: '#6366f1',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          ← العودة للصفحة الرئيسية
        </button>
      </div>
      <div style={headerStyle}>
        <span>👤</span> 
        <span>الملف الشخصي والحوكمة الذاتية</span>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#6366f1', marginBottom: '15px' }}>معلومات المستخدم</h3>
        <div style={infoRow}>
          <span style={{ opacity: 0.7 }}>الاسم الكامل:</span>
          <span style={{ fontWeight: 'bold' }}>{user?.fullName || 'غير معروف'}</span>
        </div>
        <div style={infoRow}>
          <span style={{ opacity: 0.7 }}>الدور الوظيفي:</span>
          <span style={{ fontWeight: 'bold', color: '#ff8c00' }}>{user?.role || 'غير محدد'}</span>
        </div>
        <div style={infoRow}>
          <span style={{ opacity: 0.7 }}>القسم المرتبط:</span>
          <span style={{ fontWeight: 'bold' }}>{user?.department || 'غير محدد'}</span>
        </div>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.04)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h3 style={{ color: '#6366f1', marginBottom: '10px' }}>تحديد الارتباط الميداني (Global ID)</h3>
        <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '20px' }}>
          اختر المبنى أو الكيان الذي تعمل به حالياً ليتم فلترة لوحات التحليل وبلاغاتك الميدانية بناءً عليه.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="أدخل المعرف الموحد للمبنى (Global ID) كمثال: BLD-102"
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              background: '#f8fafc',
              color: '#0f172a',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        {error && (
          <div style={{ color: '#ff3d57', marginBottom: '15px', fontSize: '14px' }}>{error}</div>
        )}
        
        {success && (
          <div style={{ color: '#6366f1', marginBottom: '15px', fontSize: '14px' }}>{success}</div>
        )}

        <button 
          onClick={handleSaveBuilding}
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #0052cc, #6366f1)',
            color: '#0f172a',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          {saving ? 'جاري تحديث سياقك التشغيلي...' : 'حفظ التغييرات'}
        </button>
      </div>
      
      {/* Could embed ReferenceTreeBuilder here for a visual tree selection, but text input is provided as requested for direct ID mapping */}
    </div>
  );
};
