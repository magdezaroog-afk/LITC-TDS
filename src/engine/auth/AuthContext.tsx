/**
 * LITC-TS v43.0 - Global Auth Context
 * نظام الهوية السيادي: يتحكم في صلاحيات الوصول لكافة أجزاء النظام.
 */
import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'IT_Admin' | 'Department_Head' | 'Technician' | 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  role: UserRole;
  permissions: string[];
  department?: string;
  buildingId?: string;
  fullName?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  login: (mockUser: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // تهيئة مستخدم افتراضي بصلاحيات عليا للاختبار
  const [user, setUser] = useState<User | null>({
    id: 'usr-999',
    role: 'IT_Admin',
    fullName: 'المهندس المعتمد',
    department: 'IT',
    buildingId: 'BLD-HQ',
    permissions: ['admin', 'view_dashboard', 'edit_settings']
  });
  const [loading] = useState<boolean>(false);

  const hasPermission = (permission: string): boolean => {
    // 1. فحص صحة معامل الإذن أمنياً ضد هجمات التلاعب بالمدخلات
    if (!permission || typeof permission !== 'string' || permission.trim() === '') {
      throw new Error(`SECURITY_CRITICAL: Invalid or malicious permission parameter evaluated: "${permission}".`);
    }

    // 2. التحقق من وجود سياق مستخدم صالح ونشط
    if (!user) {
      throw new Error('SECURITY_CRITICAL: Permission evaluation requested without an active User context.');
    }

    // 3. التحقق والمطابقة
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  const login = (mockUser: User) => {
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, login, logout }}>
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
