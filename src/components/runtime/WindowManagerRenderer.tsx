import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../../engine/ui-loader/WindowContext';
import { FloatingWindowCard } from './FloatingWindowCard';

// Import real components
import { UserTicketTracker } from '../organisms/UserTicketTracker';
import { ArchiveTable } from '../dashboard/ArchiveTable';
import { UnifiedSmartAnalytics } from '../analytics/UnifiedSmartAnalytics';
import { MOCK_JOURNEYS } from '../dashboard/mockJourneyData';

export const WindowManagerRenderer: React.FC = () => {
  const { activeWindows, closeWindow } = useWindowManager();

  const getWindowTitle = (id: string) => {
    const titles: Record<string, string> = {
      dashboard: 'لوحة القيادة',
      tickets: 'إدارة التذاكر',
      archive: 'الأرشيف المركزي',
      admin_panel: 'التحكم الأمني',
      settings: 'إعدادات النظام'
    };
    return titles[id] || 'نافذة النظام';
  };

  const getWindowContent = (id: string) => {
    switch (id) {
      case 'dashboard':
      case 'tickets':
        return (
          <UserTicketTracker 
            layoutType="grid"
            tickets={[]}
            activeTab="all"
            allowedActions={[]}
            slaEnabled={false}
            journeys={MOCK_JOURNEYS}
          />
        );
      case 'archive':
        return (
          <ArchiveTable settings={{
            enabledUIFilters: ['issue_type'],
            allowSupplementaryAdditionalTickets: true,
            allowCompletedClosedTickets: true,
            archiveScope: 'Department_Only',
            allowExport: false,
            adminOverride: false
          }} />
        );
      case 'settings':
      case 'admin_panel':
        return (
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <UnifiedSmartAnalytics
              title="نظرة عامة على أداء النظام"
              metrics={[
                { id: '1', label: 'معدل الاستجابة', value: 85, trend: 5, target: 90, status: 'warning', icon: '⏱️' },
                { id: '2', label: 'رضا المستخدمين', value: 92, trend: 2, target: 90, status: 'healthy', icon: '😊' }
              ]}
              layout="DENSE"
            />
          </div>
        );
      default:
        return (
          <div className="window-placeholder">
            <div className="window-placeholder__icon">✨</div>
            <p>محتوى [{getWindowTitle(id)}] غير معرّف بعد.</p>
          </div>
        );
    }
  };

  if (activeWindows.length === 0) return null;

  return (
    <div className="window-manager-container">
      <AnimatePresence>
        {activeWindows.map(id => (
          <FloatingWindowCard key={id} id={id} title={getWindowTitle(id)} onClose={() => closeWindow(id)}>
            {getWindowContent(id)}
          </FloatingWindowCard>
        ))}
      </AnimatePresence>
    </div>
  );
};
