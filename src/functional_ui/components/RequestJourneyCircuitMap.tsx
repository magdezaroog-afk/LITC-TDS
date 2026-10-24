/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Clock,
  GitBranch,
  Star,
  CheckCircle2,
  Building2,
  User,
  AlertCircle,
  Sparkles,
  Info,
  Compass
} from 'lucide-react';
import { UserRecentRequest } from '../types';

interface JourneyMapNode {
  id: string;
  type: 'start' | 'primary' | 'sub_ticket' | 'handback' | 'closure';
  title: string;
  subtitle: string;
  actor?: string;
  time?: string;
  status: 'completed' | 'current' | 'pending';
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom';
  regionLabel: string;
  isSubBranch?: boolean;
  notes?: string;
  extraBadge?: string;
  subTicketData?: any;
}

interface RequestJourneyCircuitMapProps {
  request: UserRecentRequest;
  journeySteps: any[];
  subTickets: any[];
  hasOpenSubTickets: boolean;
  darkMode?: boolean;
  primaryAssignee?: string;
}

export const RequestJourneyCircuitMap: React.FC<RequestJourneyCircuitMapProps> = ({
  request,
  journeySteps,
  subTickets,
  hasOpenSubTickets,
  darkMode = true,
  primaryAssignee = 'مستلم الطلب الرئيسي'
}) => {
  const [selectedNode, setSelectedNode] = useState<JourneyMapNode | null>(null);

  const isMainClosed =
    request.status === 'completed' ||
    request.status === 'approved' ||
    (request as any).statusName === 'CLOSED' ||
    (request as any).statusName === 'RESOLVED';

  const hasSubs = subTickets && subTickets.length > 0;

  // ──────────────────────────────────────────────────────────────────────────
  // 1. CALCULATE TOPOLOGICAL NODES ALONG THE AUTHENTIC CONTOUR
  // Coordinate Geometry (ViewBox: 0 0 800 230):
  // West Station (Tripoli Area: x=175, y=81)
  // Central Basin (Brega / Sirte Plunge: x=460, y=200)
  // Cyrenaica Convex Ridge (Green Mountain: x=665, y=42)
  // Eastern Station (Tobruk Area: x=755, y=114)
  // First & Last station are the employee himself.
  // ──────────────────────────────────────────────────────────────────────────
  const nodes: JourneyMapNode[] = [];

  // Find submission step timestamp
  const submissionStep = journeySteps.find((s) =>
    s.id === 'step-0' || s.label?.includes('تقديم') || s.action?.includes('تقديم')
  );
  const submitTime = submissionStep?.timestamp || request.date || '';

  // 1. Start Node: تقديم الطلب (الموظف نفسه) — West Station
  nodes.push({
    id: 'node-start',
    type: 'start',
    title: 'تقديم المعاملة',
    subtitle: 'الموظف صاحب الطلب',
    regionLabel: 'نقطة الانطلاق',
    time: submitTime,
    status: 'completed',
    x: 175,
    y: 81,
    labelPosition: 'top',
    notes: 'تم تسجيل الطلب وتوثيقه بالنظام بنجاح بواسطة الموظف.'
  });

  // 2. Primary Processing Node: المستلم الرئيسي — Central Processing Basin
  const isPrimaryStarted = journeySteps.length > 1 || request.status !== 'pending';
  const isPrimaryCurrent = isPrimaryStarted && !hasSubs && !isMainClosed;
  nodes.push({
    id: 'node-primary',
    type: 'primary',
    title: 'المستلم الرئيسي',
    subtitle: request.department || 'الإدارة المختصة',
    regionLabel: 'محطة المعالجة المركزية',
    actor: primaryAssignee,
    status: isMainClosed || (hasSubs && !hasOpenSubTickets) || (hasSubs && hasOpenSubTickets)
      ? 'completed'
      : isPrimaryCurrent
      ? 'current'
      : 'pending',
    x: 460,
    y: 200,
    labelPosition: 'top',
    notes: `المعاملة بحوزة المستلم الرئيسي (${primaryAssignee}) في (${request.department || 'الإدارة المختصة'}).`
  });

  // 3. Sub-Tickets Branch Nodes (المهام الفنية المساندة - إن وُجدت) — Convex Peak Station
  if (hasSubs) {
    const st = subTickets[0];
    const isDone = st.isClosed || ['CLOSED', 'RESOLVED'].includes(st.statusName);
    nodes.push({
      id: `node-sub-${st.id}`,
      type: 'sub_ticket',
      title: subTickets.length > 1 ? `مهام فرعية (${subTickets.length})` : `مهمة مساندة: ${st.department}`,
      subtitle: st.title || 'إجراء فني مساند',
      regionLabel: 'محطة الإسناد الفني',
      actor: st.assignedTech || st.department,
      status: isDone && !hasOpenSubTickets ? 'completed' : 'current',
      x: 665,
      y: 42,
      labelPosition: 'bottom',
      isSubBranch: true,
      notes: isDone && !hasOpenSubTickets
        ? `أنجزت الأطراف المستلمة (${st.department}) كافة المهام الفرعية وأقفلتها.`
        : `المعاملة قيد المعالجة لدى الإدارات والفرق المساندة (${st.department}${st.assignedTech ? ` - ${st.assignedTech}` : ''}).`,
      extraBadge: isDone && !hasOpenSubTickets ? 'مكتملة ومقفلة' : 'قيد المعالجة',
      subTicketData: st
    });
  }

  // 4. Final Closure & Rating Node: الإغلاق والتقييم (الموظف نفسه) — Eastern Terminus
  // أول نقطة وآخر نقطة هي الموظف نفسه
  nodes.push({
    id: 'node-closure',
    type: 'closure',
    title: 'اكتمال الحل والتقييم',
    subtitle: 'الموظف نفسه (اعتماد الإغلاق)',
    regionLabel: 'المحطة الختامية',
    status: isMainClosed ? 'completed' : 'pending',
    x: 755,
    y: 114,
    labelPosition: 'bottom',
    notes: isMainClosed
      ? 'عادت المعاملة للموظف وتم التحقق من حل المشكلة وتقييم الخدمة وإغلاقها نهائياً.'
      : 'المحطة الختامية: تعود المعاملة للموظف نفسه لاعتماد الحل والتقييم النهائي فور إنجازها.'
  });

  // Active current node
  const activeNode =
    nodes.find((n) => n.status === 'current') ||
    (isMainClosed ? nodes[nodes.length - 1] : nodes[1] || nodes[0]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. AUTHENTIC GEOMETRIC CONTOUR PATH (بدون أي تحريف أو قوسين تقليديين)
  // غرباً من رأس أجدير وزوارة مروراً بطرابلس ورأس مصراتة، ثم الانحناء الجنوبي
  // لخليج سرت حتى البريقة، ثم الصعود شمالاً عبر بنغازي والرأس المحدب للجبل الأخضر،
  // ثم خليج البمبة وصولاً إلى طبرق والبردية شرقاً.
  // ──────────────────────────────────────────────────────────────────────────
  const authenticContourPath = `M 35,100 C 60,96 90,92 120,90 C 145,88 175,82 205,80 C 235,78 265,85 290,92 C 305,96 320,98 335,102 C 350,118 360,140 375,162 C 395,188 425,200 460,200 C 495,200 520,185 540,152 C 555,130 568,105 585,82 C 605,60 635,42 665,42 C 690,42 705,58 718,78 C 728,90 735,104 742,108 C 752,112 765,116 775,120`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '14px',
        backgroundColor: darkMode ? '#0b1324' : '#f8fafc',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        padding: '16px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: darkMode ? 'inset 0 1px 3px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      {/* ──────────────────────────────────────────────────────────
          TOP STATUS BAR & ACTIVE POSITION BADGE
         ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(14, 165, 233, 0.14)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <Compass size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: darkMode ? '#ffffff' : '#0f172a',
                fontFamily: "'Cairo', 'Tajawal', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>المسار الزمني الميداني للمعاملة</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.14)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                دورة المعاملة: من الموظف وإلى الموظف نفسه
              </span>
            </div>
            <div style={{ fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
              محطات تتابع الطلب تبدأ من صاحب المعاملة وتعود إليه للاعتماد والتقييم النهائي
            </div>
          </div>
        </div>

        {/* Dynamic Live Pulse Badge */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor:
              activeNode.type === 'sub_ticket'
                ? 'rgba(245, 158, 11, 0.14)'
                : activeNode.type === 'closure'
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(14, 165, 233, 0.14)',
            border: `1px solid ${
              activeNode.type === 'sub_ticket'
                ? 'rgba(245, 158, 11, 0.4)'
                : activeNode.type === 'closure'
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(14, 165, 233, 0.4)'
            }`,
            fontSize: '11px',
            fontWeight: 800,
            color:
              activeNode.type === 'sub_ticket'
                ? '#fbbf24'
                : activeNode.type === 'closure'
                ? '#34d399'
                : '#38bdf8',
            boxShadow:
              activeNode.type === 'sub_ticket'
                ? '0 0 12px rgba(245, 158, 11, 0.25)'
                : '0 0 12px rgba(14, 165, 233, 0.25)',
          }}
        >
          <span
            style={{
              position: 'relative',
              display: 'flex',
              width: '8px',
              height: '8px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor:
                  activeNode.type === 'sub_ticket'
                    ? '#f59e0b'
                    : activeNode.type === 'closure'
                    ? '#10b981'
                    : '#0ea5e9',
                opacity: 0.75,
                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                width: '8px',
                height: '8px',
                backgroundColor:
                  activeNode.type === 'sub_ticket'
                    ? '#f59e0b'
                    : activeNode.type === 'closure'
                    ? '#10b981'
                    : '#0ea5e9',
              }}
            />
          </span>
          <span>المعاملة الآن: {activeNode.title} ({activeNode.regionLabel})</span>
        </motion.div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          AUTHENTIC NEON CIRCUIT CONTOUR (SVG)
         ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '190px',
        }}
      >
        <svg
          viewBox="0 0 800 230"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Multi-layered High-Performance Neon Glow */}
            <filter id="circuitNeonGlow" x="-20%" y="-30%" width="140%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glowing Contour Gradient: Emerald -> Cyan -> Sky -> Emerald */}
            <linearGradient id="circuitTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#0ea5e9" />
              <stop offset="65%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="glowGreen" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#10b981" floodOpacity="0.75" />
            </filter>
            <filter id="glowAmber" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#f59e0b" floodOpacity="0.75" />
            </filter>
            <filter id="glowCyan" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#0ea5e9" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* 1. Base Subtle Guide Path for Background Depth */}
          <path
            d={authenticContourPath}
            stroke={darkMode ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0'}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* 2. Main Neon Glowing Contour Track */}
          <path
            d={authenticContourPath}
            stroke="url(#circuitTrackGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
            filter="url(#circuitNeonGlow)"
          />

          {/* 3. Core Laser Highlight Line (Crisp Precision Center) */}
          <path
            d={authenticContourPath}
            stroke={darkMode ? '#ffffff' : '#f0fdf4'}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* 4. Active Flowing Light Particle along the Authentic Contour */}
          <circle r="4.5" fill={isMainClosed ? '#34d399' : activeNode.type === 'sub_ticket' ? '#fbbf24' : '#38bdf8'} filter="url(#glowCyan)">
            <animateMotion
              path={authenticContourPath}
              dur={isMainClosed ? '6s' : '4.5s'}
              repeatCount="indefinite"
            />
          </circle>

          {/* 5. RENDER STATIONS ALONG THE CONTOUR */}
          {nodes.map((node) => {
            const isCompleted = node.status === 'completed';
            const isCurrent = node.status === 'current';

            let nodeColor = '#64748b';
            let strokeColor = 'rgba(255, 255, 255, 0.2)';
            let filterId = 'none';

            if (isCompleted) {
              nodeColor = '#10b981';
              strokeColor = 'rgba(16, 185, 129, 0.7)';
              filterId = 'url(#glowGreen)';
            } else if (isCurrent) {
              if (node.type === 'sub_ticket') {
                nodeColor = '#f59e0b';
                strokeColor = 'rgba(245, 158, 11, 0.8)';
                filterId = 'url(#glowAmber)';
              } else {
                nodeColor = '#0ea5e9';
                strokeColor = 'rgba(14, 165, 233, 0.8)';
                filterId = 'url(#glowCyan)';
              }
            }

            const titleY = node.labelPosition === 'top' ? node.y - 20 : node.y + 24;
            const subtitleY = node.labelPosition === 'top' ? node.y - 8 : node.y + 36;

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Sonar Radar Pulse Ring for CURRENT active station */}
                {isCurrent && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="16"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1.5"
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="13;23;13"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.65;0;0.65"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Outer Station Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="13"
                  fill={darkMode ? '#0b1324' : '#ffffff'}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  filter={filterId}
                />

                {/* Inner Icon / Status Indicator */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="7.5"
                  fill={nodeColor}
                />

                {/* Station Checkmark Indicator when completed */}
                {isCompleted && (
                  <path
                    d={`M ${node.x - 3.5} ${node.y} L ${node.x - 1} ${node.y + 2.5} L ${node.x + 3.5} ${node.y - 2.5}`}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}

                {/* Station Labels */}
                <g>
                  {/* Title */}
                  <text
                    x={node.x}
                    y={titleY}
                    textAnchor="middle"
                    fontSize="11.5"
                    fontFamily="Cairo, sans-serif"
                    fontWeight="800"
                    fill={darkMode ? '#ffffff' : '#0f172a'}
                  >
                    {node.title}
                  </text>

                  {/* Subtitle */}
                  <text
                    x={node.x}
                    y={subtitleY}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontFamily="Cairo, sans-serif"
                    fontWeight="600"
                    fill={isCurrent ? '#38bdf8' : isCompleted ? '#34d399' : (darkMode ? '#94a3b8' : '#64748b')}
                  >
                    {node.subtitle}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STATION DETAILS POPOVER / BOTTOM BANNER
         ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              marginTop: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.96)' : '#ffffff',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor:
                    selectedNode.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.14)'
                      : selectedNode.status === 'current'
                      ? 'rgba(245, 158, 11, 0.14)'
                      : 'rgba(100, 116, 139, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    selectedNode.status === 'completed'
                      ? '#10b981'
                      : selectedNode.status === 'current'
                      ? '#f59e0b'
                      : '#64748b',
                }}
              >
                {selectedNode.type === 'sub_ticket' ? (
                  <GitBranch size={16} />
                ) : selectedNode.type === 'start' || selectedNode.type === 'closure' ? (
                  <User size={16} />
                ) : selectedNode.status === 'completed' ? (
                  <Check size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                    {selectedNode.title} • {selectedNode.regionLabel}
                  </span>
                  {selectedNode.extraBadge && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          selectedNode.status === 'completed'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color: selectedNode.status === 'completed' ? '#10b981' : '#f59e0b',
                        fontWeight: 700,
                      }}
                    >
                      {selectedNode.extraBadge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: darkMode ? '#cbd5e1' : '#475569', marginTop: '2px' }}>
                  {selectedNode.notes}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: darkMode ? '#94a3b8' : '#64748b',
                cursor: 'pointer',
                fontSize: '11.5px',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              إغلاق التفاصيل ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
