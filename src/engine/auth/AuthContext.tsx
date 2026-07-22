/**
 * LITC-TS v43.0 - Global Auth Context
 * نظام الهوية السيادي: يتحكم في صلاحيات الوصول لكافة أجزاء النظام.
 */
import React, { createContext, useContext, useState } from 'react';

export type Role = 'system_director' | 'super_admin' | 'co_admin' | 'tech_director' | 'dept_head' | 'team_leader' | 'employee';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  department?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  systemMode: 'employee' | 'work';
  setSystemMode: (mode: 'employee' | 'work') => void;
  hasPermission: (permission: string) => boolean;
  login: (mockUser: User) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemMode, setSystemMode] = useState<'employee' | 'work'>('employee');
  const [user, setUser] = useState<User | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const loginAsUser = params.get('login_as_user');
    const loginAsRole = params.get('login_as');
    
    if (loginAsUser) {
      try {
        const storedUsers = localStorage.getItem('mockOperationalUsers');
        if (storedUsers) {
          const usersList = JSON.parse(storedUsers);
          const found = usersList.find((u: any) => u.id === loginAsUser);
          if (found) {
            // Map the internal CoreRole to the AuthContext Role
            let mappedRole: Role = 'employee';
            if (found.role === 'OPERATIONAL_MANAGER') mappedRole = 'tech_director'; // Using tech_director temporarily to map to Auth
            else if (found.role === 'SECTION_HEAD') mappedRole = 'dept_head';
            else if (found.role === 'TEAM_LEADER') mappedRole = 'team_leader';
            
            return {
              id: found.id,
              name: found.name,
              role: mappedRole,
              email: found.email,
              department: found.departmentId || 'unassigned'
            };
          }
        }
      } catch (e) {
        console.error("Failed to load user from operational users");
      }
    }
    
    // Legacy support
    if (loginAsRole === 'employee') return { id: 'test1', name: 'مستخدم تشغيلي للاختبار', role: 'employee', email: 'test1@litc.ly', department: 'dept_it' };
    if (loginAsRole === 'dept_head') return { id: 'test2', name: 'رئيس قسم للاختبار', role: 'dept_head', email: 'test2@litc.ly', department: 'dept_it' };
    if (loginAsRole === 'tech_director') return { id: 'test3', name: 'مدير إدارة للاختبار', role: 'tech_director', email: 'test3@litc.ly', department: 'dept_it' };
    if (loginAsRole === 'team_leader') return { id: 'test4', name: 'رئيس فريق للاختبار', role: 'team_leader', email: 'test4@litc.ly', department: 'dept_it' };
    return null;
  });
  const [loading] = useState<boolean>(false);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.role === 'super_admin') return true;

    // Define broad role capabilities here
    // Currently relying on role-based routing and Taskbar checks.
    if (permission === 'use_taskbar') {
      return ['super_admin', 'co_admin', 'tech_director', 'dept_head', 'team_leader'].includes(user.role);
    }
    
    // Default deny for unspecified specific permissions
    return false;
  };

  const login = (mockUser: User) => {
    setUser(mockUser);
    setSystemMode('employee'); 
  };

  const logout = () => {
    setUser(null);
    setSystemMode('employee');
  };

  const switchRole = (newRole: Role) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, systemMode, setSystemMode, hasPermission, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
