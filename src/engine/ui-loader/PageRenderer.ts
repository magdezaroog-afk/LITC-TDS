/**
 * LITC-TS v43.0 - Page Renderer
 * المحرك المسؤول عن بناء الواجهة ديناميكياً بناءً على الـ Metadata مع فحص الصلاحيات والـ ErrorBoundary ومراقبة الأداء والتحصين ضد الاختراقات.
 */

import React from 'react';
import { PageLayout } from '../../types/component.types';
import { ComponentRegistry } from './ComponentRegistry';
import { useAuth } from '../auth/AuthContext'; // استيراد سياق الهوية
import { ErrorBoundary } from './ErrorBoundary'; // استيراد بوابات أمان الأخطاء
import { SystemObserver } from '../monitoring/SystemObserver'; // استيراد مراقب النظام
import { SecurityUtils } from '../../utils/SecurityUtils'; // استيراد أدوات التطهير

/**
 * مكون مغلف لقياس زمن التحميل والرسم الفعلي في المتصفح
 */
const ObservedComponent: React.FC<{ 
  configId: string; 
  Component: React.ComponentType<any>; 
  props: any;
}> = ({ configId, Component, props }) => {
  const startTime = React.useRef(performance.now()).current;

  React.useEffect(() => {
    const duration = performance.now() - startTime;
    SystemObserver.logRender(configId, duration);
  }, []);

  return React.createElement(Component, props);
};

export const PageRenderer: React.FC<{ layout: PageLayout }> = ({ layout }) => {
  const { user, hasPermission } = useAuth(); // استهلاك الهوية الحقيقية

  if (!user) {
    return React.createElement('div', null, 'يرجى تسجيل الدخول...');
  }

  return React.createElement(
    'div',
    { className: 'page-container' },
    layout.components.map((config) => {
      return React.createElement(
        ErrorBoundary,
        { key: config.id, componentId: config.id }, // تمرير معرف المكون لـ ErrorBoundary
        (() => {
          // 1. منطق التحقق من القائمة البيضاء (White-listing Verification)
          // يمنع استدعاء أو تمرير أي مكونات غير مسجلة رسمياً عبر الـ API Payload
          if (!ComponentRegistry.has(config.type)) {
            console.error(`SECURITY_VIOLATION: Unregistered component type "${config.type}" attempted to render.`);
            return null; // حجب المكون غير المسجل تماماً
          }

          // 2. منطق التحقق من الصلاحيات الأمنية للمكون
          const canAccess = config.permissions.some(p => hasPermission(p));
          
          if (!canAccess) {
            console.warn(`SECURITY: User unauthorized to view component ${config.id} of type ${config.type}.`);
            return null; // حجب المكون أمنياً
          }

          const Component = ComponentRegistry.get(config.type);
          
          if (!Component) {
            console.warn(`Component of type ${config.type} not found in registry.`);
            return null;
          }

          // 3. تطهير الخصائص الممررة لمنع هجمات XSS
          const sanitizedProps = SecurityUtils.sanitizeObject(config.props);

          // استخدام المكون المراقب بدلاً من المباشر
          return React.createElement(ObservedComponent, {
            configId: config.id,
            Component,
            props: sanitizedProps
          });
        })()
      );
    })
  );
};
