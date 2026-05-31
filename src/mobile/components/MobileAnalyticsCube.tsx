import React from 'react';
import { UniversalAnalyticsCube } from '../../components/analytics/UniversalAnalyticsCube';

export const MobileAnalyticsCube: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      <h2 style={{
        color: '#00ffcc',
        textShadow: '0 0 10px rgba(0,255,204,0.5)',
        margin: '0 0 10px 0',
        fontSize: '1.5rem',
        textAlign: 'center'
      }}>
        التحاليل المتقاطعة
      </h2>
      <div style={{
        /* Override grid to be a column on mobile */
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <UniversalAnalyticsCube />
      </div>
    </div>
  );
};
