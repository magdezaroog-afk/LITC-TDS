/**
 * LITC-TS v43.0 - Component Registry (Secure & Immutable Edition)
 * سجل المكونات الموثقة والآمنة للتطبيق لمنع عمليات الحقن والـ Prototype Pollution.
 */

import React from 'react';
import { ComponentType } from '../../types/component.types';

// استيراد المكونات بشكل كسول (Lazy Loading) من خلال الـ Dynamic Imports
const ActionButton = React.lazy(() => 
  import('../../components/atoms/ActionButton').then(m => ({ default: m.ActionButton }))
);

const StatsWidget = React.lazy(() => 
  import('../../components/atoms/StatsWidget').then(m => ({ default: m.StatsWidget }))
);

const SystemHealthWidget = React.lazy(() => 
  import('../../components/organisms/SystemHealthWidget').then(m => ({ default: m.SystemHealthWidget }))
);

// المكونات الذرية الجديدة
const BaseButton = React.lazy(() => 
  import('../../components/atoms/BaseButton').then(m => ({ default: m.BaseButton }))
);

const BaseCard = React.lazy(() => 
  import('../../components/atoms/BaseCard').then(m => ({ default: m.BaseCard }))
);

const BaseInput = React.lazy(() => 
  import('../../components/atoms/BaseInput').then(m => ({ default: m.BaseInput }))
);

const BaseText = React.lazy(() => 
  import('../../components/atoms/BaseText').then(m => ({ default: m.BaseText }))
);

// مكون لوحة العمليات منشئ التذاكر الديناميكي
const TicketOperationPanel = React.lazy(() => 
  import('../../components/organisms/TicketOperationPanel').then(m => ({ default: m.TicketOperationPanel }))
);

const DynamicFormCreator = React.lazy(() => 
  import('../../components/organisms/DynamicFormCreator').then(m => ({ default: m.DynamicFormCreator }))
);

const OperationalDashboard = React.lazy(() => 
  import('../../components/dashboard/OperationalDashboard').then(m => ({ default: m.OperationalDashboard }))
);

const AdminGovernanceConsole = React.lazy(() => 
  import('../../components/admin/AdminGovernanceConsole').then(m => ({ default: m.AdminGovernanceConsole }))
);

const GovernanceAnalytics = React.lazy(() => 
  import('../../components/admin/GovernanceAnalytics').then(m => ({ default: m.GovernanceAnalytics }))
);

// سجل المكونات المتاح للوصول السريع
const registry = new Map<ComponentType, React.ComponentType<any>>();

// تسجيل المكونات المعتمدة والآمنة (White-listed)
registry.set('ActionButton', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(ActionButton, props)
  )
);

registry.set('StatsWidget', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(StatsWidget, props)
  )
);

registry.set('SystemHealthWidget', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(SystemHealthWidget, props)
  )
);

// تسجيل المكونات الذرية في سجل المكونات الموثقة
registry.set('BaseButton', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(BaseButton, props)
  )
);

registry.set('BaseCard', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(BaseCard, props)
  )
);

registry.set('BaseInput', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(BaseInput, props)
  )
);

registry.set('BaseText', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(BaseText, props)
  )
);

// تسجيل لوحة عمليات التذكرة
registry.set('TicketOperationPanel', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(TicketOperationPanel, props)
  )
);

// تسجيل منشئ التذاكر الديناميكي
registry.set('DynamicFormCreator', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(DynamicFormCreator, props)
  )
);

registry.set('OperationalDashboard', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(OperationalDashboard, props)
  )
);

registry.set('AdminGovernanceConsole', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(AdminGovernanceConsole, props)
  )
);

registry.set('GovernanceAnalytics', (props) => 
  React.createElement(
    React.Suspense,
    { fallback: React.createElement('div', null, 'جاري التحميل...') },
    React.createElement(GovernanceAnalytics, props)
  )
);

// قفل السجل وجعله غير قابل للتعديل أثناء التشغيل لمنع الـ Prototype Pollution
export const ComponentRegistry = Object.freeze({
  register: (type: ComponentType, component: React.ComponentType<any>) => {
    throw new Error(`SECURITY_VIOLATION: ComponentRegistry is locked. Cannot register "${type}" at runtime.`);
  },
  
  get: (type: ComponentType) => {
    return registry.get(type);
  },

  has: (type: string): boolean => {
    return registry.has(type as ComponentType);
  }
});
