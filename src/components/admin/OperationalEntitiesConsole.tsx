import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';

export const OperationalEntitiesConsole: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

    const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('litc_token') || 'system_token_123';
      
      const [deptRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/operational/departments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/v1/admin/operational/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const depts = await deptRes.json();
      const usersData = await usersRes.json();

      setDepartments(Array.isArray(depts) ? depts : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, userId: number) => {
    e.dataTransfer.setData('userId', userId.toString());
  };

  const handleDrop = async (e: React.DragEvent, teamId: number) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData('userId');
    if (!userId) return;

    try {
      const token = localStorage.getItem('litc_token') || 'system_token_123';
      await fetch('/api/v1/admin/operational/users/assign', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, teamId })
      });
      // Optionally fetch data again or optimistic update
      fetchData();
    } catch (err) {
      console.error('Failed to assign user', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (loading) return <div style={{ color: '#fff', padding: '20px' }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff', display: 'flex', gap: '20px' }}>
      
      {/* Users Panel (Draggable) */}
      <div style={{
        flex: 1,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>المستخدمين (Drag)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
          {users.map(u => (
            <div 
              key={u.id}
              draggable
              onDragStart={(e) => handleDragStart(e, u.id)}
              style={{
                padding: '12px',
                background: 'rgba(0, 160, 255, 0.1)',
                border: '1px solid rgba(0, 160, 255, 0.3)',
                borderRadius: '8px',
                cursor: 'grab'
              }}
            >
              {u.fullName} (@{u.username})
            </div>
          ))}
        </div>
      </div>

      {/* Departments & Teams Panel (Dropzone) */}
      <div style={{
        flex: 2,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>الأقسام والفرق (Drop)</h3>
        
        {departments.map(dept => (
          <div key={dept.id} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: '15px'
          }}>
            <h4 style={{ color: theme.colors.primary }}>{dept.name}</h4>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
              {dept.teams?.map((team: any) => (
                <div
                  key={team.id}
                  onDrop={(e) => handleDrop(e, team.id)}
                  onDragOver={handleDragOver}
                  style={{
                    flex: '1 1 200px',
                    minHeight: '100px',
                    padding: '10px',
                    background: 'rgba(0, 255, 120, 0.05)',
                    border: '1px dashed rgba(0, 255, 120, 0.3)',
                    borderRadius: '8px'
                  }}
                >
                  <strong style={{ color: '#00ff78' }}>{team.name}</strong>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '10px' }}>
                    اسحب المستخدمين وأفلتهم هنا لتنسيبهم لهذا الفريق.
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
