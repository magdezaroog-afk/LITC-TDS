import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { HubProvider } from './HubContext';
import { User as HubUser } from '../types';

export const HubBridgeProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  
  const fetchMyProfile = () => {
    if (authUser) {
      const tkn = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
      const activeUserId = authUser?.id ? String(authUser.id).replace(/\D/g, '') : '';
      fetch('/api/v1/functional/me', {
        headers: {
          ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}),
          ...(activeUserId ? { 'x-user-id': activeUserId } : {})
        },
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setProfileData(data.data);
        }
      })
      .catch(console.error);
    }
  };

  useEffect(() => {
    fetchMyProfile();
    const handleProfileUpdate = () => fetchMyProfile();
    window.addEventListener('litc_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('litc_profile_updated', handleProfileUpdate);
  }, [authUser]);

  // Transform the Auth user to the Hub User format with real DB values
  const bridgedUser: HubUser | null = authUser ? {
    id: String(profileData?.id || authUser.id),
    name: profileData?.name || authUser.name,
    role: profileData?.jobTitle || profileData?.role || authUser.role,
    department: profileData?.department || authUser.department || 'غير محدد',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileData?.name || authUser.name)}`,
    points: profileData?.points || 0,
    appCoins: profileData?.appCoins || 0,
    email: profileData?.email || authUser.email,
    jobTitle: profileData?.jobTitle || '',
    employeeId: profileData?.employeeId || '',
    mobilePhone: profileData?.mobilePhone || profileData?.phone || '',
    businessPhone: profileData?.businessPhone || '',
    officeLocation: profileData?.officeLocation || '',
    company: profileData?.company || 'الشركة الليبية للاتصالات وتقنية المعلومات (LITC)',
    city: profileData?.city || 'طرابلس',
    country: profileData?.country || 'ليبيا',
    tenantDomain: profileData?.tenantDomain || 'litc.ly',
    syncStatus: profileData?.syncStatus || 'synced',
    lastSyncedAt: profileData?.lastSyncedAt || null,
    manager: profileData?.manager || null,
    subordinates: profileData?.subordinates || [],
    teams: profileData?.teams || [],
    section: profileData?.section || '',
    unit: profileData?.unit || (profileData?.teams?.[0] || ''),
  } : null;

  return (
    <HubProvider initialUser={bridgedUser}>
      {children}
    </HubProvider>
  );
};
