/**
 * StaffHierarchy.tsx
 * مكوّن إدارة الكادر الوظيفي الهرمي
 * - Glassmorphism + Framer Motion + RTL
 * - Tree View / Org-Chart Matrix View
 * - بحث متقدم + فلاتر (الدور / الحالة)
 * - Drawer ملف تعريف الموظف
 * - أزرار التعديل للإدمن فقط
 * - مؤشرات الأداء (KPI)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


import {

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;
  Search, ChevronLeft, Users, Building2, GitBranch,
  BarChart2, Shield, Phone, Mail, X,
  Plus, Edit2, Trash2, Filter, RefreshCw,
  Layers, Network, Star, Clock, TrendingUp, Award
} from 'lucide-react';

/* ─────────────────── Types ─────────────────── */
export type StaffRole =
  | 'OPERATIONAL_MANAGER'
  | 'SECTION_HEAD'
  | 'TEAM_LEADER'
  | 'ENGINEER'
  | 'TECHNICIAN';

export interface StaffNode {
  id: string;
  name: string;
  nameEn?: string;
  role: StaffRole;
  title: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  managerId?: string;
  avatarUrl?: string;
  avatarInitials: string;
  avatarColor: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'OFFLINE' | 'BUSY' | 'LEAVE';
  matrixRoles?: string[];
  children?: StaffNode[];
  completionRate?: number;
  avgResponseMin?: number;
  totalTickets?: number;
  openTickets?: number;
}

interface StaffHierarchyProps {
  defaultView?: 'tree' | 'matrix';
  showAnalytics?: boolean;
  currentUserRole?: string;
}

// ─── Static mock data (names are personal - not translated) ───
// Titles and dept names use Arabic as primary; they get overridden when real API data arrives
const MOCK_HIERARCHY: StaffNode[] = [
  {
    id: 'mgr-1',
    name: 'أ. محمد العمري',
    role: 'OPERATIONAL_MANAGER',
    title: 'مدير إدارة تقنية المعلومات',
    departmentId: 'IT',
    departmentName: 'إدارة تقنية المعلومات',
    avatarInitials: 'م.ع',
    avatarColor: '#6366f1',
    email: 'mohammed.omari@litc.sa',
    phone: '+966 50 000 0001',
    status: 'ACTIVE',
    matrixRoles: ['DIGITAL_TRANSFORMATION_LEAD'],
    completionRate: 94,
    avgResponseMin: 18,
    totalTickets: 312,
    openTickets: 4,
    children: [
      {
        id: 'sec-1',
        name: 'م. سالم الغامدي',
        role: 'SECTION_HEAD',
        title: 'رئيس قسم الدعم الفني',
        departmentId: 'IT',
        departmentName: 'إدارة تقنية المعلومات',
        teamId: 'SUPPORT',
        teamName: 'الدعم الفني',
        managerId: 'mgr-1',
        avatarInitials: 'س.غ',
        avatarColor: '#0ea5e9',
        email: 'salem.ghamdi@litc.sa',
        phone: '+966 50 000 0002',
        status: 'ACTIVE',
        completionRate: 88,
        avgResponseMin: 25,
        totalTickets: 178,
        openTickets: 7,
        children: [
          {
            id: 'tl-1',
            name: 'م. فهد الدوسري',
            role: 'TEAM_LEADER',
            title: 'رئيس فريق الشبكات',
            departmentId: 'IT',
            departmentName: 'إدارة تقنية المعلومات',
            teamId: 'NETWORKS',
            teamName: 'فريق الشبكات',
            managerId: 'sec-1',
            avatarInitials: 'ف.د',
            avatarColor: '#10b981',
            email: 'fahad.dosari@litc.sa',
            status: 'BUSY',
            completionRate: 92, avgResponseMin: 20, totalTickets: 95, openTickets: 3,
            children: [
              { id: 'eng-1', name: 'م. خالد الحربي', role: 'ENGINEER', title: 'مهندس شبكات', departmentId: 'IT', departmentName: 'إدارة تقنية المعلومات', teamId: 'NETWORKS', teamName: 'فريق الشبكات', managerId: 'tl-1', avatarInitials: 'خ.ح', avatarColor: '#f59e0b', email: 'khalid.harbi@litc.sa', status: 'ACTIVE', completionRate: 90, avgResponseMin: 22, totalTickets: 45, openTickets: 2 },
              { id: 'eng-2', name: 'م. ياسر القحطاني', role: 'ENGINEER', title: 'مهندس بنية تحتية', departmentId: 'IT', departmentName: 'إدارة تقنية المعلومات', teamId: 'NETWORKS', teamName: 'فريق الشبكات', managerId: 'tl-1', avatarInitials: 'ي.ق', avatarColor: '#8b5cf6', email: 'yaser.qahtani@litc.sa', status: 'ACTIVE', completionRate: 85, avgResponseMin: 28, totalTickets: 38, openTickets: 1 },
            ],
          },
          {
            id: 'tl-2',
            name: 'م. نورة السالم',
            role: 'TEAM_LEADER',
            title: 'رئيسة فريق التطوير',
            departmentId: 'IT',
            departmentName: 'إدارة تقنية المعلومات',
            teamId: 'DEV',
            teamName: 'فريق التطوير',
            managerId: 'sec-1',
            avatarInitials: 'ن.س',
            avatarColor: '#ec4899',
            email: 'noura.salem@litc.sa',
            status: 'ACTIVE',
            completionRate: 96, avgResponseMin: 15, totalTickets: 83, openTickets: 4,
            children: [
              { id: 'eng-3', name: 'م. عمر الشهراني', role: 'ENGINEER', title: 'Full Stack Developer', departmentId: 'IT', departmentName: 'إدارة تقنية المعلومات', teamId: 'DEV', teamName: 'فريق التطوير', managerId: 'tl-2', avatarInitials: 'ع.ش', avatarColor: '#14b8a6', email: 'omar.shahrani@litc.sa', status: 'ACTIVE', completionRate: 97, avgResponseMin: 12, totalTickets: 52, openTickets: 2 },
            ],
          },
        ],
      },
      {
        id: 'sec-2',
        name: 'م. عبدالله المالكي',
        role: 'SECTION_HEAD',
        title: 'رئيس قسم الأمن المعلوماتي',
        departmentId: 'IT',
        departmentName: 'إدارة تقنية المعلومات',
        teamId: 'SECURITY',
        teamName: 'الأمن المعلوماتي',
        managerId: 'mgr-1',
        avatarInitials: 'ع.م',
        avatarColor: '#ef4444',
        email: 'abdulla.malki@litc.sa',
        status: 'ACTIVE',
        completionRate: 99, avgResponseMin: 10, totalTickets: 134, openTickets: 1,
        children: [
          { id: 'eng-4', name: 'م. بدر الزهراني', role: 'ENGINEER', title: 'محلل أمن معلومات', departmentId: 'IT', departmentName: 'إدارة تقنية المعلومات', teamId: 'SECURITY', teamName: 'الأمن المعلوماتي', managerId: 'sec-2', avatarInitials: 'ب.ز', avatarColor: '#f97316', email: 'badr.zahrani@litc.sa', status: 'LEAVE', completionRate: 78, avgResponseMin: 35, totalTickets: 28, openTickets: 0 },
        ],
      },
    ],
  },
];

/* ─────────────────── Constants ─────────────────── */
const ROLE_LABELS: Record<StaffRole, string> = {
  OPERATIONAL_MANAGER: 'مدير إدارة',
  SECTION_HEAD: 'رئيس قسم',
  TEAM_LEADER: 'رئيس فريق',
  ENGINEER: 'مهندس',
  TECHNICIAN: 'فني',
} as const;

// STATUS_CONFIG colors only (labels built dynamically inside component)
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  OFFLINE: '#64748b',
  BUSY: '#f59e0b',
  LEAVE: '#6366f1',
};

function flattenTree(nodes: StaffNode[], result: StaffNode[] = []): StaffNode[] {
  for (const n of nodes) {
    result.push(n);
    if (n.children?.length) flattenTree(n.children, result);
  }
  return result;
}

function nodeVisible(node: StaffNode, q: string, role: string, status: string): boolean {
  const selfMatch =
    (!q || node.name.includes(q) || node.departmentName.includes(q) || node.title.includes(q) || (node.teamName?.includes(q) ?? false)) &&
    (!role   || node.role   === role)   &&
    (!status || node.status === status);
  if (selfMatch) return true;
  return node.children?.some(c => nodeVisible(c, q, role, status)) ?? false;
}

/* ─────────────────── Shared styles ─────────────────── */
const glassStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.66)',
  backdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.85)',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
  position: 'relative',
  overflow: 'hidden',
};

const actionBtn = (color: string): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(0,0,0,0.07)',
  background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', color: '#64748b',
  transition: 'all 0.2s', padding: 0, flexShrink: 0,
});

/* ─────────────────── Avatar ─────────────────── */
const Avatar: React.FC<{ node: StaffNode; size?: number }> = ({ node, size = 44 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${node.avatarColor}bb, ${node.avatarColor})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
    boxShadow: `0 2px 10px ${node.avatarColor}40`, position: 'relative', userSelect: 'none',
  }}>
    {node.avatarInitials}
    <div style={{
      position: 'absolute', bottom: 1, right: 1,
      width: size * 0.27, height: size * 0.27,
      borderRadius: '50%', background: STATUS_COLORS[node.status],
      border: '2px solid #fff',
    }} />
  </div>
);

/* ─────────────────── KPI Pill ─────────────────── */
const KpiPill: React.FC<{ icon: React.ReactNode; value: string | number; label: string; color: string }> =
  ({ icon, value, label, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: `${color}10`, borderRadius: 10, padding: '5px 12px',
    border: `1px solid ${color}25`,
  }}>
    <span style={{ color, display: 'flex' }}>{icon}</span>
    <span style={{ fontWeight: 800, fontSize: 13, color }}>{value}</span>
    <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
  </div>
);

/* ─────────────────── Tree Node ─────────────────── */
const TreeNodeCard: React.FC<{
  node: StaffNode; depth: number; isAdmin: boolean;
  q: string; roleF: string; statusF: string;
  onSelect: (n: StaffNode) => void; showAnalytics: boolean;
  roleLabels: Record<string, string>; statusConfig: Record<string, { label: string; color: string }>;
}> = ({ node, depth, isAdmin, q, roleF, statusF, onSelect, showAnalytics, roleLabels, statusConfig }) => {
  const [open, setOpen] = useState(depth < 2);
  if (!nodeVisible(node, q, roleF, statusF)) return null;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
        style={{ marginInlineStart: depth * 26, marginBottom: 8 }}
      >
        <motion.div
          whileHover={{ scale: 1.012, translateY: -2 }} whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={() => onSelect(node)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.88)', borderRadius: 18,
            padding: '14px 18px', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Color accent strip */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
            background: node.avatarColor, borderRadius: '0 18px 18px 0', opacity: 0.75,
          }} />

          {/* Expand toggle */}
          {node.children?.length ? (
            <button
              onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
              style={{
                width: 26, height: 26, borderRadius: 8, border: `1px solid ${open ? node.avatarColor + '50' : 'rgba(0,0,0,0.07)'}`,
                background: open ? `${node.avatarColor}15` : 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: open ? node.avatarColor : '#64748b',
                transition: 'all 0.2s', flexShrink: 0, padding: 0,
              }}
            >
              <motion.div animate={{ rotate: open ? -90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronLeft size={13} />
              </motion.div>
            </button>
          ) : <div style={{ width: 26 }} />}

          <Avatar node={node} size={42} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', letterSpacing: '-0.2px' }}>{node.name}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${node.avatarColor}15`, color: node.avatarColor, border: `1px solid ${node.avatarColor}30`,
              }}>{roleLabels[node.role]}</span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 20,
                background: `${STATUS_COLORS[node.status]}18`,
                color: STATUS_COLORS[node.status],
              }}>{statusConfig[node.status].label}</span>
            </div>
            <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 2 }}>
              {node.title} • {node.departmentName}{node.teamName ? ` • ${node.teamName}` : ''}
            </span>
          </div>

          {showAnalytics && node.completionRate !== undefined && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, marginInlineEnd: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 17, fontWeight: 900,
                  color: node.completionRate >= 90 ? '#10b981' : node.completionRate >= 75 ? '#f59e0b' : '#ef4444',
                }}>{node.completionRate}%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{t('ui.auto_1129') || t('ui.auto_1129', 'إنجاز')}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#6366f1' }}>{node.openTickets ?? 0}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{t('ui.auto_1172') || t('ui.auto_1172', 'مفتوح')}</div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <button style={actionBtn('#6366f1')} title={t('ui.edit')}><Edit2 size={12} /></button>
              <button style={actionBtn('#ef4444')} title={t('ui.delete')}><Trash2 size={12} /></button>
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {open && node.children?.length ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
            style={{
              overflow: 'hidden',
              borderInlineStart: `2px dashed ${node.avatarColor}30`,
              marginInlineStart: depth * 26 + 20,
              paddingInlineStart: 18,
            }}
          >
            {node.children.map(child => (
              <TreeNodeCard key={child.id} node={child} depth={depth + 1} isAdmin={isAdmin}
                q={q} roleF={roleF} statusF={statusF} onSelect={onSelect} showAnalytics={showAnalytics}
                roleLabels={roleLabels} statusConfig={statusConfig} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────────── Matrix Card ─────────────────── */
const MatrixCard: React.FC<{ node: StaffNode; isAdmin: boolean; onSelect: (n: StaffNode) => void; showAnalytics: boolean }> =
  ({ node, isAdmin, onSelect, showAnalytics }) => {
  const roleLabel = {
    OPERATIONAL_MANAGER: t('role.manager', 'مدير إدارة'),
    SECTION_HEAD: t('role.section_head', 'رئيس قسم'),
    TEAM_LEADER: t('role.team_leader', 'رئيس فريق'),
    ENGINEER: t('role.engineer', 'مهندس'),
    TECHNICIAN: t('role.technician', 'فني'),
  }[node.role] ?? node.role;
  return (
  <motion.div
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.04, translateY: -4 }} whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
    onClick={() => onSelect(node)}
    style={{
      background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(28px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.9)', borderTop: `3px solid ${node.avatarColor}`,
      borderRadius: 20, padding: '18px 16px', cursor: 'pointer',
      boxShadow: '0 6px 24px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      minWidth: 155, maxWidth: 175, textAlign: 'center', position: 'relative',
    }}
  >
    <Avatar node={node} size={50} />
    <div>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', lineHeight: 1.4 }}>{node.name}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{node.title}</div>
      <div style={{
        fontSize: 10, fontWeight: 700, marginTop: 6, padding: '2px 8px', borderRadius: 20,
        background: `${node.avatarColor}15`, color: node.avatarColor, display: 'inline-block',
      }}>
        <b>{roleLabel}</b>
      </div>
    </div>
    {showAnalytics && node.completionRate !== undefined && (
      <div style={{ width: '100%', height: 4, background: 'rgba(0,0,0,0.07)', borderRadius: 4, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${node.completionRate}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%', borderRadius: 4,
            background: node.completionRate >= 90 ? 'linear-gradient(90deg,#10b981,#059669)' :
              node.completionRate >= 75 ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                'linear-gradient(90deg,#ef4444,#dc2626)',
          }}
        />
      </div>
    )}
    {isAdmin && (
      <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
        <button style={actionBtn('#6366f1')}><Edit2 size={11} /></button>
        <button style={actionBtn('#ef4444')}><Trash2 size={11} /></button>
      </div>
    )}
  </motion.div>
  );
};

const OrgColumn: React.FC<{ nodes: StaffNode[]; isAdmin: boolean; onSelect: (n: StaffNode) => void; showAnalytics: boolean }> =
  ({ nodes, isAdmin, onSelect, showAnalytics }) => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
    {nodes.map(node => (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <MatrixCard node={node} isAdmin={isAdmin} onSelect={onSelect} showAnalytics={showAnalytics} />
        {node.children?.length ? (
          <>
            <div style={{ width: 2, height: 20, background: `${node.avatarColor}40` }} />
            <OrgColumn nodes={node.children} isAdmin={isAdmin} onSelect={onSelect} showAnalytics={showAnalytics} />
          </>
        ) : null}
      </div>
    ))}
  </div>
);

/* ─────────────────── Profile Drawer ─────────────────── */
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
    <span style={{ color: '#64748b', marginTop: 1, flexShrink: 0 }}>{icon}</span>
    <div>
      <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{value}</span>
    </div>
  </div>
);

const ProfileDrawer: React.FC<{ node: StaffNode | null; onClose: () => void; showAnalytics: boolean }> =
  ({ node, onClose, showAnalytics }) => {
  const roleLabels: Record<string, string> = {
    OPERATIONAL_MANAGER: t('role.manager', 'مدير إدارة'),
    SECTION_HEAD: t('role.section_head', 'رئيس قسم'),
    TEAM_LEADER: t('role.team_leader', 'رئيس فريق'),
    ENGINEER: t('role.engineer', 'مهندس'),
    TECHNICIAN: t('role.technician', 'فني'),
  };
  const statusConfig: Record<string, { label: string; color: string }> = {
    ACTIVE:  { label: t('admin.status', 'نشط'),       color: '#10b981' },
    OFFLINE: { label: t('status.offline', 'غير متصل'), color: '#64748b' },
    BUSY:    { label: t('status.busy', 'مشغول'),       color: '#f59e0b' },
    LEAVE:   { label: t('status.leave', 'إجازة'),      color: '#6366f1' },
  };
  return (
  <AnimatePresence>
    {node && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', zIndex: 99000 }}
        />
        <motion.div
          initial={{ x: '-100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 390,
            background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(40px) saturate(200%)',
            borderInlineStart: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            zIndex: 99001, display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '28px 24px 20px',
            background: `linear-gradient(135deg, ${node.avatarColor}18, ${node.avatarColor}06)`,
            borderBottom: '1px solid rgba(0,0,0,0.06)', position: 'relative',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 20, left: 20, width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
              }}
            ><X size={16} /></button>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <Avatar node={node} size={60} />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{node.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{node.title}</p>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${node.avatarColor}18`, color: node.avatarColor }}>{roleLabels[node.role]}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[node.status]}15`, color: STATUS_COLORS[node.status] }}>{statusConfig[node.status].label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(0,0,0,0.025)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow icon={<Building2 size={14} />} label={t('ui.department')} value={node.departmentName} />
              {node.teamName && <InfoRow icon={<Users size={14} />} label={t('ui.team')} value={node.teamName} />}
              {node.email  && <InfoRow icon={<Mail size={14} />} label={t('ui.inbox')} value={node.email} />}
              {node.phone  && <InfoRow icon={<Phone size={14} />} label={t('ui.auto_1169') || 'الجوال'} value={node.phone} />}
            </div>

            {showAnalytics && node.completionRate !== undefined && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{t('ui.auto_1179') || t('ui.auto_1179', '📊 مؤشرات الأداء')}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <KpiPill icon={<TrendingUp size={12} />} value={`${node.completionRate}%`} label={t('ui.auto_1129') || 'إنجاز'} color="#10b981" />
                  <KpiPill icon={<Clock size={12} />} value={`${node.avgResponseMin}د`} label={t('ui.auto_1170') || 'متوسط رد'} color="#6366f1" />
                  <KpiPill icon={<Award size={12} />} value={node.totalTickets ?? 0} label={t('ui.auto_1171') || 'إجمالي'} color="#0ea5e9" />
                  <KpiPill icon={<Star size={12} />} value={node.openTickets ?? 0} label={t('ui.auto_1172') || 'مفتوح'} color="#f59e0b" />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{t('ui.auto_1180') || t('ui.auto_1180', 'نسبة الإنجاز الكلية')}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{node.completionRate}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 8, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${node.completionRate}%` }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        height: '100%', borderRadius: 8,
                        background: node.completionRate >= 90 ? 'linear-gradient(90deg,#10b981,#059669)' :
                          node.completionRate >= 75 ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                            'linear-gradient(90deg,#ef4444,#dc2626)',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {node.matrixRoles?.length ? (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{t('ui.auto_1181') || t('ui.auto_1181', '🔗 أدوار إضافية')}</h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {node.matrixRoles.map(r => (
                    <span key={r} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#6366f115', color: '#6366f1', border: '1px solid #6366f130' }}>
                      {r.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', borderRadius: 14, padding: 16, textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <BarChart2 size={28} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{t('ui.auto_1182') || t('ui.auto_1182', 'تحليلات الأداء التفصيلية')}<br /><strong>{t('ui.auto_1183') || t('ui.auto_1183', 'قريباً')}</strong>{t('ui.auto_1184') || t('ui.auto_1184', '— مقارنات زمنية ومسارية')}</p>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export const StaffHierarchy: React.FC<StaffHierarchyProps> = ({
  defaultView = 'tree',
  showAnalytics = true,
  currentUserRole,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'matrix'>(defaultView);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNode, setSelectedNode] = useState<StaffNode | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<StaffNode[]>(MOCK_HIERARCHY);

  // Translated role labels — rebuild when language changes
  const roleLabels = useMemo<Record<string, string>>(() => ({
    OPERATIONAL_MANAGER: t('role.manager', 'مدير إدارة'),
    SECTION_HEAD: t('role.section_head', 'رئيس قسم'),
    TEAM_LEADER: t('role.team_leader', 'رئيس فريق'),
    ENGINEER: t('role.engineer', 'مهندس'),
    TECHNICIAN: t('role.technician', 'فني'),
  }), [t]);

  // Translated status config — rebuild when language changes
  const statusConfig = useMemo<Record<string, { label: string; color: string }>>(() => ({
    ACTIVE:  { label: t('admin.status', 'نشط'),       color: '#10b981' },
    OFFLINE: { label: t('status.offline', 'غير متصل'), color: '#64748b' },
    BUSY:    { label: t('status.busy', 'مشغول'),       color: '#f59e0b' },
    LEAVE:   { label: t('status.leave', 'إجازة'),      color: '#6366f1' },
  }), [t]);

  const isAdmin = useMemo(() => {
    const role = currentUserRole ??
      (() => { try { return JSON.parse(localStorage.getItem('litc_current_user') || '{}')?.role; } catch { return ''; } })();
    return ['super_admin', 'system_director', 'IT_ADMIN'].includes(role ?? '');
  }, [currentUserRole]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => { setData([...MOCK_HIERARCHY]); setIsRefreshing(false); }, 900);
  }, []);

  const allStaff   = useMemo(() => flattenTree(data), [data]);
  const activeCount = allStaff.filter(s => s.status === 'ACTIVE').length;

  const stats = [
    { label: t('staff.total', 'إجمالي الكادر'), value: allStaff.length, icon: <Users size={16} />, color: '#6366f1' },
    { label: t('staff.active', 'نشط الآن'),     value: activeCount,      icon: <Shield size={16} />, color: '#10b981' },
    { label: t('staff.on_leave', 'في إجازة'),   value: allStaff.filter(s => s.status === 'LEAVE').length, icon: <Clock size={16} />, color: '#f59e0b' },
    { label: t('status.busy', 'مشغول'),         value: allStaff.filter(s => s.status === 'BUSY').length,  icon: <Star  size={16} />, color: '#0ea5e9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, direction: 'rtl' }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        style={{ ...glassStyle, padding: '24px 28px' }}
      >
        <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              <Network size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(16px,1.7vw,21px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.4px' }}>{t('ui.auto_551') || t('ui.auto_551', 'إدارة الكادر الوظيفي')}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{t('ui.auto_1185') || t('ui.auto_1185', 'الهيكل التنظيمي الهرمي • {allStaff.length} موظف • {activeCount} نشط')}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 12, padding: 4, gap: 2 }}>
              {(['tree', 'matrix'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding: '7px 13px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: viewMode === m ? '#fff' : 'transparent',
                  color: viewMode === m ? '#6366f1' : '#64748b',
                  boxShadow: viewMode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {m === 'tree' ? <GitBranch size={12} /> : <Layers size={12} />}
                  {m === 'tree' ? t('ui.auto_1176', 'شجري') : t('ui.auto_1177', 'مصفوفة')}
                </button>
              ))}
            </div>

            <button onClick={() => setShowFilters(p => !p)} style={{
              padding: '7px 13px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)',
              background: showFilters ? '#6366f1' : 'rgba(255,255,255,0.8)',
              color: showFilters ? '#fff' : '#64748b',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
            }}>
              <Filter size={12} />{t('ui.auto_1186') || t('ui.auto_1186', 'فلاتر')}</button>

            <button onClick={handleRefresh} style={{
              width: 36, height: 36, borderRadius: 11, border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.8)', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', padding: 0,
            }}>
              <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ duration: 0.8, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}>
                <RefreshCw size={13} />
              </motion.div>
            </button>

            {isAdmin && (
              <button style={{
                padding: '7px 15px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', gap: 5,
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.2s',
              }}>
                <Plus size={13} />{t('ui.auto_1187') || t('ui.auto_1187', 'إضافة موظف')}</button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: 18, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', top: '50%', right: 15, transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('ui.auto_1178') || 'ابحث بالاسم، القسم، الفريق، المسمى الوظيفي...'}
            style={{
              width: '100%', padding: '11px 42px 11px 40px',
              background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)', borderRadius: 13,
              fontSize: 13, color: '#0f172a', outline: 'none', boxSizing: 'border-box',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.3s', direction: 'rtl',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', top: '50%', left: 13, transform: 'translateY(-50%)',
              width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.08)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', padding: 0,
            }}><X size={11} /></button>
          )}
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selStyle}>
                  <option value="">{t('ui.auto_1188') || t('ui.auto_1188', 'كل الأدوار')}</option>
                  {(Object.entries(roleLabels) as [StaffRole, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selStyle}>
                  <option value="">{t('ui.auto_1189') || t('ui.auto_1189', 'كل الحالات')}</option>
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                {(roleFilter || statusFilter || searchQuery) && (
                  <button onClick={() => { setRoleFilter(''); setStatusFilter(''); setSearchQuery(''); }} style={{
                    padding: '7px 13px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.06)', color: '#ef4444',
                    cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                  }}><X size={11} />{t('ui.auto_1190') || t('ui.auto_1190', 'مسح')}</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.03 }} style={{ ...glassStyle, padding: '13px 18px', flex: 1, minWidth: 110, display: 'flex', alignItems: 'center', gap: 11 }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main View ── */}
      <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}
        style={{ ...glassStyle, padding: 28, minHeight: 400, overflowX: viewMode === 'matrix' ? 'auto' : 'visible' }}
      >
        {viewMode === 'tree' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.map(node => (
              <TreeNodeCard key={node.id} node={node} depth={0} isAdmin={isAdmin}
                q={searchQuery} roleF={roleFilter} statusF={statusFilter}
                onSelect={setSelectedNode} showAnalytics={showAnalytics}
                roleLabels={roleLabels} statusConfig={statusConfig} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', minWidth: 700 }}>
            <OrgColumn nodes={data} isAdmin={isAdmin} onSelect={setSelectedNode} showAnalytics={showAnalytics} />
          </div>
        )}
      </motion.div>

      <ProfileDrawer node={selectedNode} onClose={() => setSelectedNode(null)} showAnalytics={showAnalytics} />
    </div>
  );
};

const selStyle: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600,
  color: '#374151', cursor: 'pointer', outline: 'none', direction: 'inherit',
};

export default StaffHierarchy;
