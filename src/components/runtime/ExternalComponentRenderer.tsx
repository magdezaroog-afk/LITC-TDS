import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AuditService } from '../../backend/services/AuditService';

export interface ExternalComponentRendererProps {
  entryUrl: string;
  displayMode: string;
  configuredProps: Record<string, any>;
  userContext: {
    userId: string;
    role: string;
    email?: string;
    phone?: string;
    externalAliases?: string;
  };
}

type ComponentStatus = 'LOADING' | 'READY' | 'FAILED';

export const ExternalComponentRenderer: React.FC<ExternalComponentRendererProps> = ({
  entryUrl,
  displayMode,
  configuredProps,
  userContext
}) => {
  const [status, setStatus] = useState<ComponentStatus>('LOADING');
  const [retryCount, setRetryCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Construct the secure URL with cache busting via retryCount
  const secureUrl = useMemo(() => {
    try {
      const url = new URL(entryUrl);
      const token = localStorage.getItem('litc_token') || 'mocked_jwt_token';
      
      url.searchParams.append('token', token);
      url.searchParams.append('userId', userContext.userId);
      url.searchParams.append('role', userContext.role);
      if (userContext.email) url.searchParams.append('email', userContext.email);
      if (userContext.phone) url.searchParams.append('phone', userContext.phone);
      if (userContext.externalAliases) url.searchParams.append('externalAliases', userContext.externalAliases);
      url.searchParams.append('config', encodeURIComponent(JSON.stringify(configuredProps)));
      url.searchParams.append('retry', retryCount.toString());
      
      return url.toString();
    } catch (error) {
      console.error('Invalid entry URL provided to ExternalComponentRenderer', entryUrl);
      return '';
    }
  }, [entryUrl, configuredProps, userContext, retryCount]);

  // Timeout Boundary Logic
  useEffect(() => {
    // Reset status on retry or new URL
    setStatus('LOADING');
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set 7000ms boundary
    timerRef.current = setTimeout(() => {
      setStatus(prev => {
        if (prev === 'LOADING') {
          AuditService.logSecurityEvent(userContext.userId, 'UECP_FAILURE', { entryUrl, retryCount, reason: 'TIMEOUT' });
          return 'FAILED';
        }
        return prev;
      });
    }, 7000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [secureUrl]);

  
  // Bidirectional Send/Receive Sandbox Testing
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const expectedOrigin = new URL(entryUrl).origin;
        if (event.origin !== expectedOrigin) {
          // Ignore messages from unknown origins
          return;
        }

        if (event.data?.type === 'UECP_READY') {
          console.log('[UECP_SANDBOX] Handshake established with external module:', event.origin);
        } else if (event.data?.type === 'UECP_DATA_SYNC') {
          console.log('[UECP_SANDBOX] Data payload received:', event.data.payload);
        }
      } catch (error) {
        // invalid URL or missing entryUrl
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [entryUrl]);

  const handleIframeLoad = () => {
    setStatus('READY');
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleIframeError = () => {
    setStatus('FAILED');
    AuditService.logSecurityEvent(userContext.userId, 'UECP_FAILURE', { entryUrl, retryCount, reason: 'IFRAME_ERROR' });
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (!secureUrl) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', borderRadius: '12px', border: '1px solid rgba(255, 59, 48, 0.3)', textAlign: 'center' }}>
        <strong>عذراً!</strong> الرابط الخارجي غير صالح أو مفقود.
      </div>
    );
  }

  // Handle IFRAME_CARD specifically
  if (displayMode === 'IFRAME_CARD' || !displayMode) {
    return (
      <div
        style={{
          width: '100%',
          height: '450px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {status === 'LOADING' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', gap: '15px' }}>
            <div style={{ width: '30%', height: '24px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '4px' }}></div>
            <div style={{ width: '100%', height: '150px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px' }}></div>
            <div style={{ width: '100%', height: '150px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px' }}></div>
            <style>
              {`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}
            </style>
          </div>
        )}

        {status === 'FAILED' ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', background: '#fdfbfb', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>المكون قيد الصيانة والتحسين</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              نظام الطرف الثالث لا يستجيب في الوقت الحالي أو أنه يخضع للترقية الفنية.<br/>التطبيق الرئيسي يعمل بشكل مستقر ولم يتأثر بهذا الانقطاع.
            </p>
            <button 
              onClick={handleRetry}
              style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>🔄</span> إعادة المحاولة الذكية
            </button>
          </div>
        ) : (
          <iframe
            src={secureUrl}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title="External Component Workspace"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              display: status === 'LOADING' ? 'none' : 'block'
            }}
          />
        )}
      </div>
    );
  }

  // Fallback for unknown display modes
  return (
    <div style={{ padding: '20px', background: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', borderRadius: '12px', border: '1px solid rgba(255, 149, 0, 0.3)', textAlign: 'center' }}>
      <strong>تنبيه:</strong> وضع العرض ({displayMode}) غير مدعوم حالياً في هذه النسخة.
    </div>
  );
};
