/**
 * LITC-TS v43.0 - Error Boundary Component
 * حاجز الحماية للأخطاء البرمجية: يلتقط الانهيارات ويرسلها لمراقب النظام المركزي.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SystemObserver } from '../monitoring/SystemObserver'; // استيراد مراقب النظام

interface Props {
  children: ReactNode;
  componentId?: string; // معرف المكون المعني بالتتبع
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Component crashed:', error, errorInfo);
    
    // إرسال تقرير الخطأ فوراً لمراقب النظام المركزي
    SystemObserver.logError(this.props.componentId || 'unknown', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          border: '1px dashed #de350b', 
          padding: '10px', 
          margin: '5px', 
          borderRadius: '4px',
          backgroundColor: '#ffebe6',
          color: '#de350b',
          fontSize: '12px'
        }}>
          <strong>حدث خطأ أثناء عرض المكون ({this.props.componentId || 'مجهول'}).</strong>
        </div>
      );
    }

    return this.props.children;
  }
}
