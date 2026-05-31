import React, { useState } from 'react';

export interface UserIdentity {
  id: string;
  fullName: string;
  officialEmail: string;
  department: string;
  systemRole: string; // e.g. "رئيس قسم التشغيل"
  avatarUrl?: string;
  bannerUrl?: string;
}

interface ProfileHeaderProps {
  identity: UserIdentity;
  isAdmin: boolean; // Controls whether systemRole can be mutated
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ identity, isAdmin }) => {
  const [bannerUrl, setBannerUrl] = useState<string>(
    identity.bannerUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'
  );

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real implementation, this would upload the file to a server
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setBannerUrl(url);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(51, 65, 85, 0.5)',
      borderRadius: '16px',
      overflow: 'hidden',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      marginBottom: '24px'
    }}>
      {/* Dynamic Top Banner */}
      <div style={{ 
        height: '180px', 
        backgroundImage: `url(${bannerUrl})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.8))' }} />
        
        {/* Banner Upload Button */}
        <label style={{ 
          position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(4px)', padding: '6px 12px', borderRadius: '20px', 
          fontSize: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', transition: 'all 0.3s ease' 
        }}>
          تغيير الغلاف
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
        </label>
      </div>

      {/* Identity Card Details */}
      <div style={{ padding: '0 30px 30px 30px', display: 'flex', alignItems: 'flex-end', gap: '24px', marginTop: '-50px', position: 'relative', zIndex: 10 }}>
        
        {/* Avatar */}
        <div style={{ 
          width: '100px', height: '100px', borderRadius: '50%', background: '#1e293b', 
          border: '4px solid rgba(15, 23, 42, 1)', overflow: 'hidden', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: '36px',
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)'
        }}>
          {identity.avatarUrl ? (
             <img src={identity.avatarUrl} alt={identity.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
             <span>👤</span>
          )}
        </div>

        {/* User Info */}
        <div style={{ flex: 1, paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{identity.fullName}</h2>
            {/* System Role Badge (Strictly Locked) */}
            <span style={{ 
              background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee', border: '1px solid rgba(34, 211, 238, 0.3)',
              padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px',
              boxShadow: '0 0 10px rgba(34, 211, 238, 0.1)', display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <span>🛡️</span> {identity.systemRole}
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', display: 'flex', gap: '15px' }}>
            <span>📧 {identity.officialEmail}</span>
            <span>🏢 {identity.department}</span>
          </p>
        </div>

        {/* Status indicator for Microsoft SSO */}
        <div style={{ paddingBottom: '15px' }}>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 12px', borderRadius: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
            متزامن مع (Microsoft Graph)
          </div>
        </div>

      </div>
    </div>
  );
};
