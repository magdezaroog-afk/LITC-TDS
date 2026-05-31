import React, { useState } from 'react';

export interface ThemeConfig {
  palette: 'CYBER_BLUE' | 'EMERALD_MAINTENANCE' | 'AURORA_PURPLE';
  glassOpacity: number; // 0 to 100
}

interface ThemePreferencesProps {
  initialTheme: ThemeConfig;
  onThemeChange: (newTheme: ThemeConfig) => void;
}

export const ThemePreferences: React.FC<ThemePreferencesProps> = ({ initialTheme, onThemeChange }) => {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme);

  const handlePaletteSelect = (palette: ThemeConfig['palette']) => {
    const newTheme = { ...theme, palette };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = { ...theme, glassOpacity: parseInt(e.target.value) };
    setTheme(newTheme);
    onThemeChange(newTheme);
  };

  const palettes = [
    { id: 'CYBER_BLUE', name: 'Cyber Blue', color: '#22d3ee' },
    { id: 'EMERALD_MAINTENANCE', name: 'Emerald Maintenance', color: '#34d399' },
    { id: 'AURORA_PURPLE', name: 'Aurora Purple', color: '#c084fc' }
  ] as const;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(51, 65, 85, 0.4)',
      borderRadius: '16px',
      padding: '24px',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      marginTop: '24px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🎨</span> تخصيص واجهة المستخدم (UI Customization Suite)
      </h3>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          ألوان النيون (Neon Palettes)
        </label>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {palettes.map(p => {
            const isActive = theme.palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePaletteSelect(p.id)}
                style={{
                  background: isActive ? `rgba(${hexToRgb(p.color)}, 0.15)` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isActive ? p.color : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? p.color : '#94a3b8',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 15px rgba(${hexToRgb(p.color)}, 0.2)` : 'none'
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                <span style={{ fontSize: '12px', fontWeight: isActive ? 'bold' : 'normal' }}>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          <span>شفافية الزجاج (Glassmorphic Opacity & Blur)</span>
          <span style={{ color: palettes.find(p => p.id === theme.palette)?.color }}>{theme.glassOpacity}%</span>
        </label>
        <input 
          type="range" 
          min="10" 
          max="100" 
          value={theme.glassOpacity} 
          onChange={handleOpacityChange}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: palettes.find(p => p.id === theme.palette)?.color
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '5px' }}>
          <span>شفاف جداً</span>
          <span>معتم</span>
        </div>
      </div>

    </div>
  );
};

// Helper for dynamic RGB colors
function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '255,255,255';
}
