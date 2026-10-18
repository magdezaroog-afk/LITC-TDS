/**
 * LITC-TS v43.0 - Global Auth Context
 * نظام الهوية السيادي: يتحكم في صلاحيات الوصول لكافة أجزاء النظام.
 */
import React, { createContext, useContext, useState } from 'react';

export type Role = 'system_director' | 'super_admin' | 'co_admin' | 'tech_director' | 'dept_head' | 'team_leader' | 'operational_user' | 'employee';

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

const AUTH_SESSION_KEY = 'litc_user_session';

/** قراءة الجلسة المحفوظة من localStorage */
const readStoredSession = (): User | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const loginAsRole = params.get('login_as');
    const loginAsUser = params.get('login_as_user');

    // Query param override: only for dev/demo purpose using known roles
    if (loginAsRole) {
      return {
        id: 'user_' + loginAsRole,
        name: 'مجدي الزروق',
        role: loginAsRole as Role,
        email: `${loginAsRole}@litc.ly`,
        department: 'MASTER_BUILDER'
      };
    }

    // loginAsUser override using operational users stored in localStorage
    if (loginAsUser) {
      const storedUsers = localStorage.getItem('mockOperationalUsers');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        const found = usersList.find((u: any) => u.id === loginAsUser);
        if (found) {
          const roleMap: Record<string, Role> = {
            'OPERATIONAL_MANAGER': 'tech_director',
            'SECTION_HEAD': 'dept_head',
            'TEAM_LEADER': 'team_leader',
            'OPERATIONAL_USER': 'operational_user',
          };
          return {
            id: found.id,
            name: found.name,
            role: roleMap[found.role] || 'operational_user',
            email: found.email,
            department: found.departmentId || 'unassigned'
          };
        }
      }
    }

    // ✅ Primary: read real authenticated session from localStorage
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      if (parsed.email === 'admin@litc.ly' && parsed.role !== 'super_admin' && parsed.role !== 'system_director') {
        parsed.role = 'super_admin';
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {
    // Corrupted session data — clear it
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  return null; // No session → redirect to login
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemMode, setSystemMode] = useState<'employee' | 'work'>('employee');
  const [user, setUser] = useState<User | null>(readStoredSession);
  const [loading] = useState<boolean>(false);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.role === 'super_admin') return true;

    // Define broad role capabilities here
    // Currently relying on role-based routing and Taskbar checks.
    if (permission === 'use_taskbar') {
      return ['super_admin', 'co_admin', 'tech_director', 'dept_head', 'team_leader', 'operational_user'].includes(user.role);
    }
    
    // Default deny for unspecified specific permissions
    return false;
  };

  const login = (userData: User) => {
    setUser(userData);
    setSystemMode('employee');
    // ✅ Persist session so page refresh doesn't log the user out
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setSystemMode('employee');
    // ✅ Clear all session data
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('litc_token');
  };

  const switchRole = (newRole: Role) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
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
