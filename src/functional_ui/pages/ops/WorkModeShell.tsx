import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { PageRenderer } from '../../../engine/ui-loader/PageRenderer';
import { OperationalQueueView } from './OperationalQueueView';
import { Loader2 } from 'lucide-react';

export const WorkModeShell: React.FC = () => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Fetch the dynamic interface from the resolution engine
    const token = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/v1/org/users/${user.id}/interface`, {
      credentials: 'include',
      headers
    })
      .then(r => r.json())
      .then(res => {
        // Only use PageRenderer if components are standard atomic components in registry
        if (
          res.success && 
          res.interface && 
          Array.isArray(res.interface.config) && 
          res.interface.config.length > 0 &&
          res.interface.config.some((c: any) => c.type !== 'QUEUE_VIEW' && c.type !== 'ANALYTICS_VIEW')
        ) {
          setLayout({ components: res.interface.config });
        } else {
          setLayout('FALLBACK'); // Render the full OperationalQueueView
        }
      })
      .catch(err => {
        console.error('Failed to load user interface layout', err);
        setLayout('FALLBACK');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px', color: '#64748b' }}>
        <Loader2 size={32} className="animate-spin" color="#4f46e5" />
        <div style={{ fontSize: '15px', fontWeight: 600 }}>جاري بناء وضع العمل (Work Mode)...</div>
      </div>
    );
  }

  // If the dynamic UI engine hasn't been configured by the admin yet, we fallback to the standalone Queue View.
  // Later, we will register OperationalQueueView as a Widget inside ComponentRegistry!
  if (layout === 'FALLBACK') {
    return (
      <div className="operational-shell" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <OperationalQueueView />
      </div>
    );
  }

  // If a custom dynamic layout is found, render it using the Enterprise PageRenderer
  return (
    <div className="operational-shell" style={{ minHeight: '100vh', background: '#f8fafc', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <PageRenderer layout={layout} />
      </div>
    </div>
  );
};
