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
  CornerDownLeft,
  Star,
  CheckCircle2,
  Building2,
  User,
  AlertCircle,
  Sparkles,
  Info
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
  // 1. CALCULATE TOPOLOGICAL NODES
  // Coordinates are set inside an SVG viewBox of 680 x 210 (RTL: Starts on Right x~610, Ends on Left x~70)
  // ──────────────────────────────────────────────────────────────────────────
  const nodes: JourneyMapNode[] = [];

  // Find submission step timestamp
  const submissionStep = journeySteps.find((s) =>
    s.id === 'step-0' || s.label?.includes('تقديم') || s.action?.includes('تقديم')
  );
  const submitTime = submissionStep?.timestamp || request.date || '';

  // 1. Start Node (تقديم الطلب)
  const isStartDone = true;
  nodes.push({
    id: 'node-start',
    type: 'start',
    title: 'تقديم الطلب',
    subtitle: 'الموظف صاحب المعاملة',
    time: submitTime,
    status: 'completed',
    x: 610,
    y: 55,
    notes: 'تم تسجيل الطلب وتوثيقه بالنظام بنجاح.'
  });

  // 2. Primary Processing Node (الاستلام والمعالجة الرئيسية)
  // If no sub-tickets and not closed, this is current
  const isPrimaryStarted = journeySteps.length > 1 || request.status !== 'pending';
  const isPrimaryCurrent = isPrimaryStarted && !hasSubs && !isMainClosed;
  nodes.push({
    id: 'node-primary',
    type: 'primary',
    title: 'المستلم الرئيسي',
    subtitle: request.department || 'إدارة تقنية المعلومات',
    actor: primaryAssignee,
    status: isMainClosed || (hasSubs && !hasOpenSubTickets) || (hasSubs && hasOpenSubTickets)
      ? 'completed'
      : isPrimaryCurrent
      ? 'current'
      : 'pending',
    x: 440,
    y: 55,
    notes: `المعاملة بحوزة المستلم الرئيسي (${primaryAssignee}) في (${request.department || 'الإدارة المختصة'}).`
  });

  // 3. Sub-Tickets Branch Nodes (التفرعات والمهام الفرعية)
  if (hasSubs) {
    if (subTickets.length === 1) {
      const st = subTickets[0];
      const isDone = st.isClosed || ['CLOSED', 'RESOLVED'].includes(st.statusName);
      nodes.push({
        id: `node-sub-${st.id}`,
        type: 'sub_ticket',
        title: `مهمة فرعية: ${st.department || 'إدارة مساندة'}`,
        subtitle: st.title || 'إجراء فني مساند',
        actor: st.assignedTech || st.department,
        status: isDone ? 'completed' : 'current',
        x: 300,
        y: 145,
        isSubBranch: true,
        notes: isDone
          ? `أنجز الطرف المستلم (${st.department}) المهمة وأقفلها من حسابه.`
          : `المعاملة الآن قيد المعالجة لدى الطرف المستلم (${st.department}${st.assignedTech ? ` - ${st.assignedTech}` : ''}).`,
        extraBadge: isDone ? 'مكتملة ومقفلة' : 'قيد المعالجة لديهم',
        subTicketData: st
      });
    } else {
      // 2 or more sub-tickets: spread them along the lower branch
      const count = Math.min(subTickets.length, 3);
      const spacing = 110;
      const startX = 350;

      subTickets.slice(0, 3).forEach((st, idx) => {
        const isDone = st.isClosed || ['CLOSED', 'RESOLVED'].includes(st.statusName);
        const isCurrentActiveSub = !isDone && (idx === 0 || subTickets.slice(0, idx).every((prev: any) => prev.isClosed));

        nodes.push({
          id: `node-sub-${st.id}`,
          type: 'sub_ticket',
          title: `مهمة فرعية (${idx + 1}): ${st.department}`,
          subtitle: st.title || 'مهمة مساندة',
          actor: st.assignedTech || st.department,
          status: isDone ? 'completed' : isCurrentActiveSub ? 'current' : 'pending',
          x: startX - idx * spacing,
          y: 145,
          isSubBranch: true,
          notes: isDone
            ? `تم إنجاز المهمة وإقفالها من قبل (${st.department}).`
            : `الطلب متوقف بانتظار إنجاز هذه المهمة من طرف (${st.department}).`,
          extraBadge: isDone ? 'أنجزت' : 'جارية',
          subTicketData: st
        });
      });
    }

    // 4. Handback Node (محطة العودة للمستلم الرئيسي بعد قفل التذاكر الفرعية)
    const isHandbackDone = !hasOpenSubTickets;
    const isHandbackCurrent = isHandbackDone && !isMainClosed;
    nodes.push({
      id: 'node-handback',
      type: 'handback',
      title: 'عادت للمستلم الرئيسي',
      subtitle: primaryAssignee,
      status: isMainClosed ? 'completed' : isHandbackCurrent ? 'current' : 'pending',
      x: 180,
      y: 55,
      notes: isHandbackDone
        ? `اكتملت جميع المهام الفرعية وأقفلت رسمياً. المعاملة الآن بحوزة مستلم الطلب الرئيسي (${primaryAssignee}) للاعتماد والإغلاق النهائي.`
        : `المعاملة بانتظار إقفال كافة المهام الفرعية لتعود بالكامل لمستلم الطلب الرئيسي (${primaryAssignee}).`
    });
  }

  // 5. Final Closure Node (الإغلاق النهائي والتقييم)
  nodes.push({
    id: 'node-closure',
    type: 'closure',
    title: 'الإغلاق والتقييم',
    subtitle: isMainClosed ? 'مكتملة ومقفلة نهائياً' : 'بانتظار الإغلاق النهائي',
    status: isMainClosed ? 'completed' : 'pending',
    x: 65,
    y: 55,
    notes: isMainClosed
      ? 'تم إنجاز المعاملة بالكامل وتقييم الخدمة وإغلاقها نهائياً.'
      : 'المحطة النهائية لإغلاق التذكرة بعد استيفاء جميع المتطلبات وتقييم الخدمة.'
  });

  // Find the ACTIVE node where the request is right now!
  const activeNode =
    nodes.find((n) => n.status === 'current') ||
    (isMainClosed ? nodes[nodes.length - 1] : nodes[1] || nodes[0]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SVG PATHS & TOPOLOGY (الانحناءات والمحطات التبولوجية)
  // ──────────────────────────────────────────────────────────────────────────
  // Main straight path from Start to Primary
  const pathStartToPrimary = `M 610 55 L 440 55`;

  // Branch curve downwards (Looping down as the user sketched)
  let branchDownPath = '';
  let branchHorizontalPath = '';
  let branchLoopUpPath = '';
  let mainBridgePath = '';

  if (hasSubs) {
    if (subTickets.length === 1) {
      // Curve down from (440, 55) to (300, 145)
      branchDownPath = `M 440 55 C 380 55, 360 145, 300 145`;
      // Curve up from (300, 145) to (180, 55)
      branchLoopUpPath = `M 300 145 C 240 145, 220 55, 180 55`;
    } else {
      const firstSubX = 350;
      const lastSubX = 350 - (Math.min(subTickets.length, 3) - 1) * 110;
      // Curve down into the first sub-ticket
      branchDownPath = `M 440 55 C 400 55, 390 145, ${firstSubX} 145`;
      // Horizontal line along the branch nodes
      branchHorizontalPath = `M ${firstSubX} 145 L ${lastSubX} 145`;
      // Curve back up from last sub-ticket to the handback node (180, 55)
      branchLoopUpPath = `M ${lastSubX} 145 C ${lastSubX - 35} 145, 210 55, 180 55`;
    }

    // Direct main bridge from Primary to Handback (dashed translucent guide)
    mainBridgePath = `M 440 55 L 180 55`;
  } else {
    // No sub-tickets: standard straight main journey line
    mainBridgePath = `M 440 55 L 65 55`;
  }

  // Path from Handback to Closure
  const pathHandbackToClosure = `M 180 55 L 65 55`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '12px',
        backgroundColor: darkMode ? 'rgba(10, 16, 30, 0.72)' : '#f8fafc',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        padding: '14px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: darkMode ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.03)',
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
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <GitBranch size={14} />
          </div>
          <div>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 800,
                color: darkMode ? '#ffffff' : '#0f172a',
                fontFamily: "'Tajawal', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>خارطة مسار وتفرعات الطلب الحية</span>
              {hasSubs && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  مسار فرعي متفرع
                </span>
              )}
            </span>
            <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>
              تتبع مسار معاملتك وانتقالها بين الإدارات والمهام الفرعية لحظة بلحظة
            </div>
          </div>
        </div>

        {/* Dynamic "YOU ARE HERE" Live Pulse Badge */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor:
              activeNode.type === 'sub_ticket'
                ? 'rgba(245, 158, 11, 0.14)'
                : activeNode.type === 'closure'
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(59, 130, 246, 0.14)',
            border: `1px solid ${
              activeNode.type === 'sub_ticket'
                ? 'rgba(245, 158, 11, 0.4)'
                : activeNode.type === 'closure'
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(59, 130, 246, 0.4)'
            }`,
            fontSize: '11px',
            fontWeight: 800,
            color:
              activeNode.type === 'sub_ticket'
                ? '#fbbf24'
                : activeNode.type === 'closure'
                ? '#34d399'
                : '#60a5fa',
            boxShadow:
              activeNode.type === 'sub_ticket'
                ? '0 0 12px rgba(245, 158, 11, 0.25)'
                : '0 0 12px rgba(59, 130, 246, 0.25)',
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
                    : '#3b82f6',
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
                    : '#3b82f6',
              }}
            />
          </span>
          <span>المعاملة الآن: {activeNode.title}</span>
        </motion.div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SVG TOPOLOGICAL CIRCUIT MAP
         ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: hasSubs ? '195px' : '110px',
          transition: 'height 0.3s ease',
        }}
      >
        <svg
          viewBox={hasSubs ? '0 0 680 195' : '0 0 680 110'}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Gradients for Paths */}
            <linearGradient id="mainFlowGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            <linearGradient id="subBranchGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor={hasOpenSubTickets ? '#f59e0b' : '#10b981'} />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Glowing Drop Shadows for Nodes */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" floodOpacity="0.5" />
            </filter>
            <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.5" />
            </filter>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. Base Tracks (Background faint paths) */}
          <path
            d={pathStartToPrimary}
            stroke={darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {hasSubs ? (
            <>
              {/* Translucent Main Bridge while sub-ticket is in progress */}
              <path
                d={mainBridgePath}
                stroke={darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Downward Curve into Sub-ticket Branch */}
              <path
                d={branchDownPath}
                stroke="url(#subBranchGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Horizontal Sub-ticket branch connector (if multiple) */}
              {branchHorizontalPath && (
                <path
                  d={branchHorizontalPath}
                  stroke={hasOpenSubTickets ? '#f59e0b' : '#10b981'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Return Loop Upwards to Primary Assignee */}
              <path
                d={branchLoopUpPath}
                stroke={hasOpenSubTickets ? 'rgba(245, 158, 11, 0.4)' : '#10b981'}
                strokeWidth="3.5"
                strokeDasharray={hasOpenSubTickets ? '5 5' : 'none'}
                strokeLinecap="round"
                fill="none"
              />

              {/* Handback to Final Closure Track */}
              <path
                d={pathHandbackToClosure}
                stroke={
                  isMainClosed
                    ? '#10b981'
                    : !hasOpenSubTickets
                    ? darkMode
                      ? 'rgba(255, 255, 255, 0.25)'
                      : '#cbd5e1'
                    : darkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#f1f5f9'
                }
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          ) : (
            <path
              d={mainBridgePath}
              stroke={darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* 2. Active Flowing Light Particle (مؤشر التدفق الضوئي المتحرك) */}
          {hasSubs && (
            <circle r="3.5" fill={hasOpenSubTickets ? '#fbbf24' : '#34d399'}>
              <animateMotion
                path={
                  hasOpenSubTickets
                    ? branchDownPath
                    : `${branchDownPath} ${branchHorizontalPath} ${branchLoopUpPath} ${pathHandbackToClosure}`
                }
                dur={hasOpenSubTickets ? '2.5s' : '5s'}
                repeatCount="indefinite"
              />
            </circle>
          )}

          {/* 3. Branch Direction & Handback Label Badges inside SVG */}
          {hasSubs && (
            <g>
              {/* Branch Down Arrow / Label */}
              <rect
                x="355"
                y="95"
                width="72"
                height="18"
                rx="4"
                fill={darkMode ? '#131b2e' : '#ffffff'}
                stroke="rgba(245, 158, 11, 0.35)"
                strokeWidth="1"
              />
              <text
                x="391"
                y="108"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fontFamily="Cairo, sans-serif"
                fill="#fbbf24"
              >
                إحالة فرعية ↷
              </text>

              {/* Loop Return Label */}
              <rect
                x="195"
                y="95"
                width="76"
                height="18"
                rx="4"
                fill={darkMode ? '#131b2e' : '#ffffff'}
                stroke={hasOpenSubTickets ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.4)'}
                strokeWidth="1"
              />
              <text
                x="233"
                y="108"
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fontFamily="Cairo, sans-serif"
                fill={hasOpenSubTickets ? '#94a3b8' : '#34d399'}
              >
                {hasOpenSubTickets ? '↩ في انتظار القفل' : '↩ عودة للمستلم'}
              </text>
            </g>
          )}

          {/* 4. RENDER NODES (النقاط والمحطات) */}
          {nodes.map((node) => {
            const isCompleted = node.status === 'completed';
            const isCurrent = node.status === 'current';
            const isPending = node.status === 'pending';

            let nodeColor = '#64748b';
            let strokeColor = 'rgba(255, 255, 255, 0.15)';
            let filterId = 'none';

            if (isCompleted) {
              nodeColor = '#10b981';
              strokeColor = 'rgba(16, 185, 129, 0.5)';
              filterId = 'url(#glowGreen)';
            } else if (isCurrent) {
              if (node.type === 'sub_ticket') {
                nodeColor = '#f59e0b';
                strokeColor = 'rgba(245, 158, 11, 0.6)';
                filterId = 'url(#glowAmber)';
              } else {
                nodeColor = '#3b82f6';
                strokeColor = 'rgba(59, 130, 246, 0.6)';
                filterId = 'url(#glowBlue)';
              }
            }

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Sonar Radar Pulse Ring for CURRENT node */}
                {isCurrent && (
                  <>
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
                        values="14;24;14"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Outer Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="13"
                  fill={darkMode ? '#0b1222' : '#ffffff'}
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  filter={filterId}
                />

                {/* Inner Core Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="7"
                  fill={nodeColor}
                />

                {/* Icon inside completed nodes */}
                {isCompleted && (
                  <path
                    d={`M ${node.x - 3.5} ${node.y} L ${node.x - 1} ${node.y + 2.5} L ${node.x + 3.5} ${node.y - 2.5}`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Node Title & Subtitle Labels */}
                <text
                  x={node.x}
                  y={node.isSubBranch ? node.y + 24 : node.y - 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fontFamily="Cairo, sans-serif"
                  fill={isCurrent ? (node.type === 'sub_ticket' ? '#fbbf24' : '#60a5fa') : isCompleted ? (darkMode ? '#ffffff' : '#0f172a') : '#64748b'}
                >
                  {node.title}
                </text>

                <text
                  x={node.x}
                  y={node.isSubBranch ? node.y + 36 : node.y - 8}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="Cairo, sans-serif"
                  fill={darkMode ? '#94a3b8' : '#64748b'}
                >
                  {node.subtitle}
                </text>

                {/* Time or Actor below/above */}
                {node.actor && (
                  <text
                    x={node.x}
                    y={node.isSubBranch ? node.y + 47 : node.y + 26}
                    textAnchor="middle"
                    fontSize="8.5"
                    fontFamily="Cairo, sans-serif"
                    fill={darkMode ? '#cbd5e1' : '#475569'}
                  >
                    {node.actor}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ──────────────────────────────────────────────────────────
          NODE DETAILS POPOVER / BOTTOM BANNER
         ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              marginTop: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: darkMode ? 'rgba(21, 30, 48, 0.85)' : '#ffffff',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor:
                    selectedNode.status === 'completed'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : selectedNode.status === 'current'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(100, 116, 139, 0.12)',
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
                ) : selectedNode.type === 'handback' ? (
                  <CornerDownLeft size={16} />
                ) : selectedNode.status === 'completed' ? (
                  <Check size={16} />
                ) : (
                  <Clock size={16} />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                    {selectedNode.title}
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
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
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
