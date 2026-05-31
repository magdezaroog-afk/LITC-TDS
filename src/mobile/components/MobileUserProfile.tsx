import React from 'react';
import { UserProfileConsole } from '../../components/profile/UserProfileConsole';

export const MobileUserProfile: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '20px'
    }}>
      <h2 style={{
        color: '#00ffcc',
        textShadow: '0 0 10px rgba(0,255,204,0.5)',
        margin: '0 0 10px 0',
        fontSize: '1.5rem',
        textAlign: 'center'
      }}>
        الملف الشخصي (نسخة الموبايل)
      </h2>
      <UserProfileConsole />
    </div>
  );
};
