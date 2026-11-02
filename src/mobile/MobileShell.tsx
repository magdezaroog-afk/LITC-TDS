import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WorkModeShell } from '../functional_ui/pages/ops/WorkModeShell';
import { AdminGovernanceConsole } from '../pages/admin/AdminGovernanceConsole';
import { MobileAnalyticsCube } from './components/MobileAnalyticsCube';

export const MobileShell: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(to bottom, #0a0f1d, #1a1f2e)',
      color: '#fff',
      overflow: 'hidden'
    }}>
      {/* Main Content Area without any disruptive bottom bar */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0'
      }}>
        <Routes>
          <Route path="/" element={<WorkModeShell />} />
          <Route path="/admin" element={<AdminGovernanceConsole />} />
          <Route path="/mobile/analytics" element={<MobileAnalyticsCube />} />
        </Routes>
      </div>
    </div>
  );
};
