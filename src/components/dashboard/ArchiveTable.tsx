import React, { useState } from 'react';
import { useArchiveData, ArchiveSettings, ArchiveFilters } from '../../hooks/useArchiveData';

interface ArchiveTableProps {
  settings: ArchiveSettings;
}

export const ArchiveTable: React.FC<ArchiveTableProps> = ({ settings }) => {
  const [activeFilters, setActiveFilters] = useState<ArchiveFilters>({});

  // Mock current user context
  const currentUserDeptId = 'DEPT_IT';
  const currentUserName = 'أحمد';
  const currentUserLocation = 'المبنى الرئيسي';

  const { filteredData, loading } = useArchiveData(
    settings,
    activeFilters,
    currentUserDeptId,
    currentUserName,
    currentUserLocation
  );

  const handleFilterChange = (key: keyof ArchiveFilters, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === 'COMPLETED') {
      return {
        background: 'rgba(16, 185, 129, 0.1)', // bg-emerald-500/10
        color: '#34d399', // text-emerald-400
        border: '1px solid rgba(16, 185, 129, 0.3)', // border-emerald-500/30
        boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)', // shadow-emerald-500/10
      };
    }
    if (status === 'SUB_TICKET') {
      return {
        background: 'rgba(59, 130, 246, 0.1)', // bg-blue-500/10
        color: '#60a5fa', // text-blue-400
        border: '1px solid rgba(59, 130, 246, 0.3)', // border-blue-500/30
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)', // shadow-blue-500/10
      };
    }
    return {};
  };

  const glassInputStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#e2e8f0',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)', // bg-slate-900/60
      backdropFilter: 'blur(16px)', // backdrop-blur-xl
      border: '1px solid rgba(51, 65, 85, 0.5)', // border-slate-700/50
      borderRadius: '16px', // rounded-2xl
      padding: '24px',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🗄️</span> 
          الأرشيف المركزي (Central Archive)
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            نطاق الوصول: {settings.archiveScope}
          </span>
        </div>
      </div>

      {/* Dynamic UI Filters (based on admin settings) */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {settings.enabledUIFilters.includes('operator_name') && (
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>اسم الموظف</label>
            <input 
              type="text" 
              placeholder="تصفية بالموظف..." 
              style={glassInputStyle}
              value={activeFilters.operatorName || ''}
              onChange={e => handleFilterChange('operatorName', e.target.value)}
            />
          </div>
        )}
        {settings.enabledUIFilters.includes('end_user_name') && (
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>اسم المستخدم</label>
            <input 
              type="text" 
              placeholder="تصفية بالمستخدم..." 
              style={glassInputStyle}
              value={activeFilters.endUserName || ''}
              onChange={e => handleFilterChange('endUserName', e.target.value)}
            />
          </div>
        )}
        {settings.enabledUIFilters.includes('issue_type') && (
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>نوع المشكلة</label>
            <input 
              type="text" 
              placeholder="تصفية بالنوع..." 
              style={glassInputStyle}
              value={activeFilters.issueType || ''}
              onChange={e => handleFilterChange('issueType', e.target.value)}
            />
          </div>
        )}
        {settings.enabledUIFilters.includes('location') && (
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>المبنى/الموقع</label>
            <input 
              type="text" 
              placeholder="تصفية بالموقع..." 
              style={glassInputStyle}
              value={activeFilters.location || ''}
              onChange={e => handleFilterChange('location', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Glassmorphic Archive Grid */}
      <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>رقم التذكرة</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>العنوان</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>الحالة</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>الموظف (Operator)</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>نوع المشكلة</th>
              <th style={{ padding: '16px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>تاريخ الإنشاء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  جاري تحميل الأرشيف ببيئة آمنة...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                  لا توجد تذاكر تطابق معايير الفلترة المسموحة لك.
                </td>
              </tr>
            ) : (
              filteredData.map((ticket, index) => (
                <tr 
                  key={ticket.id} 
                  style={{ 
                    borderBottom: index === filteredData.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'} // hover:bg-slate-800/50
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#22d3ee', fontWeight: 'bold' }}>{ticket.id}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#e2e8f0' }}>{ticket.title}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      ...getStatusBadgeStyle(ticket.status)
                    }}>
                      {ticket.status === 'COMPLETED' ? 'مكتملة' : 'فرعية/إضافية'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#cbd5e1' }}>{ticket.operatorName}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#cbd5e1' }}>{ticket.issueType}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#94a3b8' }}>
                    {new Date(ticket.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
