import React, { useState } from 'react';

export interface ContactData {
  primaryPhone: string;
  secondaryPhone: string;
  enterpriseId: string;
  officialTitle: string;
}

interface ProfileContactFormProps {
  initialData: ContactData;
}

export const ProfileContactForm: React.FC<ProfileContactFormProps> = ({ initialData }) => {
  const [data, setData] = useState<ContactData>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Mock Save
    }, 600);
  };

  const glassInputStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e2e8f0',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    transition: 'all 0.3s ease',
  };

  const lockedInputStyle = {
    ...glassInputStyle,
    background: 'rgba(15, 23, 42, 0.3)',
    color: '#64748b',
    cursor: 'not-allowed',
    border: '1px solid rgba(15, 23, 42, 0.5)'
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(51, 65, 85, 0.4)',
      borderRadius: '16px',
      padding: '24px',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📞</span> بيانات الاتصال والوظيفة (Professional Specifications)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Editable Fields */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
            رقم الهاتف الأساسي (Primary Phone)
          </label>
          <input 
            type="text" 
            style={glassInputStyle}
            value={data.primaryPhone}
            onChange={e => setData({...data, primaryPhone: e.target.value})}
            placeholder="+966 5X XXX XXXX"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
            هاتف الطوارئ / ثانوي (Secondary Phone)
          </label>
          <input 
            type="text" 
            style={glassInputStyle}
            value={data.secondaryPhone}
            onChange={e => setData({...data, secondaryPhone: e.target.value})}
            placeholder="+966 5X XXX XXXX"
          />
        </div>

        {/* Locked Fields */}
        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            <span>الرقم الوظيفي (Enterprise ID)</span>
            <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>🔒 مقفل</span>
          </label>
          <input 
            type="text" 
            style={lockedInputStyle}
            value={data.enterpriseId}
            readOnly
          />
        </div>

        <div>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
            <span>المسمى الوظيفي المعتمد (Official Title)</span>
            <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>🔒 مقفل</span>
          </label>
          <input 
            type="text" 
            style={lockedInputStyle}
            value={data.officialTitle}
            readOnly
          />
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: 'rgba(34, 211, 238, 0.1)',
            color: '#22d3ee',
            border: '1px solid rgba(34, 211, 238, 0.4)',
            padding: '8px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: isSaving ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(34, 211, 238, 0.1)'
          }}
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </button>
      </div>

    </div>
  );
};
