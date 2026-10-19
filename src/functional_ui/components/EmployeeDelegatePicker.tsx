import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserCheck, Search, X, Check, Building2, Briefcase } from 'lucide-react';
import { AdminAPI } from '../../services/admin.api';

export interface CompanyEmployee {
  id: number | string;
  fullName: string;
  username: string;
  jobTitle?: string | null;
  department?: { id: number | string; name: string } | null;
}

interface EmployeeDelegatePickerProps {
  value: string;
  onChange: (value: string, employee?: CompanyEmployee) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  accentColor?: string;
  scope?: 'ALL_COMPANY_USERS' | 'SAME_DEPARTMENT';
  userDepartmentId?: number | string;
}

export const EmployeeDelegatePicker: React.FC<EmployeeDelegatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  placeholder = 'ابحث باسم الموظف أو الوظيفة أو الإدارة...',
  accentColor = '#135d79',
  scope = 'ALL_COMPANY_USERS',
  userDepartmentId,
}) => {
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all company users once from the pool
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    AdminAPI.getUserPool()
      .then((res: any) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.users)) {
          setEmployees(res.users);
          // If a value already exists, find and resolve the employee
          if (value) {
            const found = res.users.find((u: CompanyEmployee) => 
              String(u.id) === String(value) || 
              u.fullName.trim() === value.trim() ||
              u.username.trim() === value.trim()
            );
            if (found) setSelectedEmployee(found);
          }
        }
      })
      .catch((err) => {
        console.error('[EmployeeDelegatePicker] Failed to load company users:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync internal state when external value changes
  useEffect(() => {
    if (!value) {
      setSelectedEmployee(null);
      setSearchQuery('');
    } else if (employees.length > 0 && !selectedEmployee) {
      const found = employees.find(u => 
        String(u.id) === String(value) || 
        u.fullName.trim() === value.trim() ||
        u.username.trim() === value.trim()
      );
      if (found) setSelectedEmployee(found);
    }
  }, [value, employees]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter employees matching query and scope
  const filteredEmployees = useMemo(() => {
    let pool = employees;
    if (scope === 'SAME_DEPARTMENT' && userDepartmentId) {
      pool = employees.filter(e => String(e.department?.id) === String(userDepartmentId));
    }

    if (!searchQuery.trim()) {
      return pool.slice(0, 15); // Show first 15 as initial recommendation
    }
    const q = searchQuery.trim().toLowerCase();
    return pool
      .filter(u => {
        const nameMatch = (u.fullName || '').toLowerCase().includes(q);
        const userMatch = (u.username || '').toLowerCase().includes(q);
        const jobMatch = (u.jobTitle || '').toLowerCase().includes(q);
        const deptMatch = (u.department?.name || '').toLowerCase().includes(q);
        return nameMatch || userMatch || jobMatch || deptMatch;
      })
      .slice(0, 30); // Cap at 30 for performance
  }, [employees, searchQuery, scope, userDepartmentId]);

  const handleSelect = (emp: CompanyEmployee) => {
    setSelectedEmployee(emp);
    setSearchQuery('');
    setIsOpen(false);
    // Return full formatted name with department for display and persistence
    const formatted = `${emp.fullName}${emp.department?.name ? ` (${emp.department.name})` : ''}`;
    onChange(formatted, emp);
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    setSearchQuery('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', direction: 'rtl' }}>
      {label && (
        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span>👤</span>
          <span>{label}</span>
          {required && <span style={{ color: '#ef4444' }}>*</span>}
          {scope === 'ALL_COMPANY_USERS' && (
            <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>
              دليل الشركة العام
            </span>
          )}
        </label>
      )}

      {/* ── Case 1: An Employee is Selected ── */}
      {selectedEmployee ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(19, 93, 121, 0.08) 0%, rgba(243, 108, 33, 0.06) 100%)',
            border: `1.5px solid ${accentColor}40`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: accentColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
                flexShrink: 0,
                boxShadow: `0 2px 6px ${accentColor}40`,
              }}
            >
              {selectedEmployee.fullName.charAt(0) || '👤'}
            </div>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  {selectedEmployee.fullName}
                </span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(52, 199, 89, 0.15)', color: '#2e7d32', fontWeight: 700 }}>
                  ✓ الموظف البديل المكلف
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {selectedEmployee.department?.name && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Building2 size={11} /> {selectedEmployee.department.name}
                  </span>
                )}
                {selectedEmployee.jobTitle && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#94a3b8' }}>
                    • <Briefcase size={11} /> {selectedEmployee.jobTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              title="تغيير الموظف المكلف"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            >
              <X size={13} />
              <span>تغيير</span>
            </button>
          )}
        </div>
      ) : (
        /* ── Case 2: Autocomplete Search Input ── */
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={isLoading ? 'جارٍ تحميل دليل موظفي الشركة...' : placeholder}
              disabled={disabled}
              style={{
                width: '100%',
                padding: '10px 14px',
                paddingInlineStart: '36px',
                borderRadius: '10px',
                border: `1.5px solid ${isOpen ? accentColor : 'rgba(0,0,0,0.1)'}`,
                background: '#fff',
                fontSize: '12.5px',
                color: '#1e293b',
                outline: 'none',
                boxShadow: isOpen ? `0 0 0 3px ${accentColor}18` : 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                insetInlineStart: '12px',
                color: isOpen ? accentColor : '#94a3b8',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search size={15} />
            </div>
          </div>

          {/* ── Autocomplete Dropdown Menu ── */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                maxHeight: '260px',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
                zIndex: 99999,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              {/* Header Hint */}
              <div style={{ padding: '6px 10px', fontSize: '10.5px', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>👥 دليل موظفي الشركة (اختر الموظف المكلف):</span>
                <span>{filteredEmployees.length} نتيجة</span>
              </div>

              {filteredEmployees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 12px', color: '#94a3b8', fontSize: '12px' }}>
                  لم يتم العثور على موظف يطابق «{searchQuery}» في دليل موظفي الشركة.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: `${accentColor}18`,
                          color: accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        {emp.fullName.charAt(0) || '👤'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                          {emp.fullName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.department?.name && (
                            <span>{emp.department.name}</span>
                          )}
                          {emp.jobTitle && (
                            <span style={{ color: '#94a3b8' }}>• {emp.jobTitle}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: accentColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>تحديد</span>
                      <span>←</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
