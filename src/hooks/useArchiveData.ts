import { useState, useEffect, useMemo } from 'react';

// TypeScript Interfaces for strict type safety
export type ArchiveScope = 'Personal_Only' | 'Department_Only' | 'Location_Only' | 'Global_Access';

export interface ArchiveFilters {
  operatorName?: string;
  endUserName?: string;
  issueType?: string;
  location?: string;
}

export interface ArchiveSettings {
  archiveScope: ArchiveScope;
  allowCompletedTickets: boolean;
  allowSubTickets: boolean;
  enabledUIFilters: string[];
}

export interface ArchiveTicket {
  id: string;
  title: string;
  status: 'COMPLETED' | 'SUB_TICKET';
  operatorName: string;
  endUserName: string;
  issueType: string;
  location: string;
  departmentId: string;
  createdAt: string;
}

// Mock Data Source
const MOCK_ARCHIVE_TICKETS: ArchiveTicket[] = [
  { id: 'TKT-9001', title: 'صيانة خادم الشبكة', status: 'COMPLETED', operatorName: 'أحمد', endUserName: 'مدير الموارد', issueType: 'شبكات', location: 'المبنى الرئيسي', departmentId: 'DEPT_IT', createdAt: '2026-05-20T10:00:00Z' },
  { id: 'TKT-9002', title: 'تركيب شاشة تفاعلية', status: 'COMPLETED', operatorName: 'خالد', endUserName: 'مدير التدريب', issueType: 'أجهزة', location: 'مبنى التدريب', departmentId: 'DEPT_IT', createdAt: '2026-05-21T11:30:00Z' },
  { id: 'TKT-9003', title: 'مراجعة صلاحيات الوصول', status: 'SUB_TICKET', operatorName: 'أحمد', endUserName: 'مسؤول الأمن', issueType: 'أمن معلومات', location: 'المبنى الرئيسي', departmentId: 'DEPT_SEC', createdAt: '2026-05-22T09:15:00Z' },
  { id: 'TKT-9004', title: 'إصلاح التكييف', status: 'COMPLETED', operatorName: 'سعيد', endUserName: 'موظف استقبال', issueType: 'صيانة عامة', location: 'مبنى الإدارة', departmentId: 'DEPT_MAINT', createdAt: '2026-05-23T14:00:00Z' },
  { id: 'TKT-9005', title: 'تمديد أسلاك إضافية', status: 'SUB_TICKET', operatorName: 'خالد', endUserName: 'مهندس اتصالات', issueType: 'بنية تحتية', location: 'مبنى الإدارة', departmentId: 'DEPT_IT', createdAt: '2026-05-24T08:45:00Z' }
];

export const useArchiveData = (
  settings: ArchiveSettings,
  activeFilters: ArchiveFilters,
  currentUserDeptId: string,
  currentUserName: string,
  currentUserLocation: string
) => {
  const [data, setData] = useState<ArchiveTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulate network delay
    setLoading(true);
    const timer = setTimeout(() => {
      setData(MOCK_ARCHIVE_TICKETS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(ticket => {
      // 1. Strict Query Isolation (Security Guardrail)
      if (settings.archiveScope === 'Personal_Only') {
        if (ticket.operatorName !== currentUserName) return false;
      } else if (settings.archiveScope === 'Department_Only') {
        if (ticket.departmentId !== currentUserDeptId) return false;
      } else if (settings.archiveScope === 'Location_Only') {
        if (ticket.location !== currentUserLocation) return false;
      }
      // Global_Access passes through

      // 2. Allowed Ticket Types
      if (!settings.allowCompletedTickets && ticket.status === 'COMPLETED') return false;
      if (!settings.allowSubTickets && ticket.status === 'SUB_TICKET') return false;

      // 3. Dynamic UI Filters (Only apply if enabled by admin)
      if (settings.enabledUIFilters.includes('operator_name') && activeFilters.operatorName) {
        if (!ticket.operatorName.includes(activeFilters.operatorName)) return false;
      }
      if (settings.enabledUIFilters.includes('end_user_name') && activeFilters.endUserName) {
        if (!ticket.endUserName.includes(activeFilters.endUserName)) return false;
      }
      if (settings.enabledUIFilters.includes('issue_type') && activeFilters.issueType) {
        if (!ticket.issueType.includes(activeFilters.issueType)) return false;
      }
      if (settings.enabledUIFilters.includes('location') && activeFilters.location) {
        if (!ticket.location.includes(activeFilters.location)) return false;
      }

      return true;
    });
  }, [data, settings, activeFilters, currentUserDeptId, currentUserName, currentUserLocation]);

  return { filteredData, loading };
};
