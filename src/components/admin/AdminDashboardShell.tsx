import React, { useState } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { UILayoutEngineTab } from './tabs/UILayoutEngineTab';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';
import { DynamicFieldsTab } from './tabs/DynamicFieldsTab';

export const AdminDashboardShell: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'ui' | 'operations' | 'dynamic_fields'>('ui');

  const isAdmin = user && user.role === 'IT_Admin';

  if (!isAdmin) {
    return (
      <div style={{
        padding: theme.spacing.xl,
        borderRadius: '24px',
        background: 'rgba(222, 53, 11, 0.1)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(222, 53, 11, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        color: '#ffdddd',
        fontFamily: theme.typography.fontFamily,
        maxWidth: '700px',
        margin: '60px auto',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '50px', marginBottom: theme.spacing.md }}>🛑</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0' }}>حظر أمني - واجهة مغلقة</h2>
        <p style={{ fontSize: '13px', margin: 0, opacity: 0.9 }}>
          هذه الشاشة مخصصة حصرياً للمسؤول الأعلى للتطبيق (IT_Admin). حسابك الحالي لا يمتلك الصلاحيات الكافية.
        </p>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.12) 0%, rgba(23, 43, 77, 0.3) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    maxWidth: '1200px',
    margin: '20px auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    paddingBottom: '10px',
    overflowX: 'auto',
    flexWrap: 'nowrap'
  };

  const getTabStyle = (tabId: string): React.CSSProperties => {
    const isActive = activeTab === tabId;
    return {
      padding: '12px 24px',
      borderRadius: '12px',
      background: isActive ? theme.colors.primary : 'rgba(255, 255, 255, 0.05)',
      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
      cursor: 'pointer',
      fontWeight: isActive ? 'bold' : 'normal',
      border: `1px solid ${isActive ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)'}`,
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap'
    };
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>قمرة القيادة المركزية الموحدة (The 4-Pillar Glassmorphic Console)</span>
      </h2>
      
      <div style={navStyle}>
        <div style={getTabStyle('ui')} onClick={() => setActiveTab('ui')}>
          🎨 هندسة وتخصيص الواجهات (UI Layout Engine)
        </div>
        <div style={getTabStyle('operations')} onClick={() => setActiveTab('operations')}>
          🏢 إدارة الهيكل التشغيلي (Operations)
        </div>
        <div style={getTabStyle('dynamic_fields')} onClick={() => setActiveTab('dynamic_fields')}>
          ✨ الحقول الديناميكية (Dynamic Fields)
        </div>
      </div>

      <div style={{ marginTop: '10px' }}>
        {activeTab === 'ui' && <UILayoutEngineTab />}
        {activeTab === 'operations' && <OperationalStructureTab />}
        {activeTab === 'dynamic_fields' && <DynamicFieldsTab />}
      </div>
    </div>
  );
};
