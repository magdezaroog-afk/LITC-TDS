import React, { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../../engine/auth/AuthContext';
import { HubProvider } from './HubContext';
import { User as HubUser } from '../types';

export const HubBridgeProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser } = useAuth();
  const [gamification, setGamification] = useState({ points: 0, appCoins: 0 });
  
  useEffect(() => {
    if (authUser) {
      const tkn = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
      fetch('/api/v1/functional/me', {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {},
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGamification({ points: data.data.points, appCoins: data.data.appCoins });
        }
      })
      .catch(console.error);
    }
  }, [authUser]);

  // Transform the Auth user to the Hub User format
  const bridgedUser: HubUser | null = authUser ? {
    id: String(authUser.id),
    name: authUser.name,
    role: authUser.role,
    department: authUser.department || 'غير محدد',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.name)}`,
    points: gamification.points,
    appCoins: gamification.appCoins,
    email: authUser.email,
  } : null;

  return (
    <HubProvider initialUser={bridgedUser}>
      {children}
    </HubProvider>
  );
};
