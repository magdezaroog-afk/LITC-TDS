import React, { useState } from 'react';
import { ProfileHeader, UserIdentity } from './ProfileHeader';
import { ProfileContactForm, ContactData } from './ProfileContactForm';
import { ThemePreferences, ThemeConfig } from './ThemePreferences';
import { NotificationPreferences, NotificationSetting, UserRole } from './NotificationPreferences';

export const DynamicUserProfile: React.FC = () => {
  // Mock User Data simulating a Microsoft Graph SSO Hydration
  const [identity] = useState<UserIdentity>({
    id: 'USR-2026-001',
    fullName: 'المهندس أحمد',
    officialEmail: 'ahmed@company.com',
    department: 'إدارة تقنية المعلومات (IT)',
    systemRole: 'رئيس قسم التشغيل',
    avatarUrl: '' // Empty to show default avatar
  });

  const [contactData] = useState<ContactData>({
    primaryPhone: '+966 50 123 4567',
    secondaryPhone: '+966 55 987 6543',
    enterpriseId: 'EID-847291',
    officialTitle: 'IT Operations Lead'
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    palette: 'CYBER_BLUE',
    glassOpacity: 60
  });

  const [notificationSettings] = useState<NotificationSetting[]>([
    { id: 'TKT_COMPLETED', label: 'إكمال التذكرة', inApp: true, email: true, whatsapp: false },
    { id: 'TKT_REASSIGNED', label: 'إعادة التعيين والتوجيه', inApp: true, email: false, whatsapp: false },
    { id: 'DEPT_TRANSFER', label: 'التحويل بين الأقسام', inApp: true, email: true, whatsapp: true, isHighPriority: true },
    { id: 'SUB_TICKET', label: 'إنشاء تذاكر فرعية', inApp: true, email: false, whatsapp: false },
    // SLA Settings (Only visible to managers due to the component logic)
    { id: 'SLA_NOT_OPENED', label: 'تأخر المهندس في فتح التذكرة', inApp: true, email: true, whatsapp: true, isHighPriority: true, isSLASetting: true, slaThresholdMinutes: 15 },
    { id: 'SLA_RESOLUTION_DELAY', label: 'تأخر المهندس في الحل', inApp: true, email: true, whatsapp: false, isSLASetting: true, slaThresholdMinutes: 60 },
  ]);

  const currentUserRole: UserRole = 'DEPT_HEAD'; // Mock role - would come from context

  const handleThemeChange = (newTheme: ThemeConfig) => {
    setThemeConfig(newTheme);
    // In a real app, you would apply this to the global context or CSS root variables
    // document.documentElement.style.setProperty('--glass-opacity', (newTheme.glassOpacity / 100).toString());
  };

  // Determine wrapper opacity based on theme settings
  const dynamicOpacity = themeConfig.glassOpacity / 100;

  return (
    <div style={{
      padding: '24px',
      maxWidth: '900px',
      margin: '0 auto',
      // Apply theme changes to the container itself as a demonstration of the dynamic UI
      opacity: Math.max(0.4, dynamicOpacity),
      transition: 'opacity 0.3s ease'
    }}>
      <ProfileHeader identity={identity} isAdmin={false} />
      <ProfileContactForm initialData={contactData} />
      <NotificationPreferences role={currentUserRole} initialSettings={notificationSettings} isSlaLockedByAdmin={true} />
      <ThemePreferences initialTheme={themeConfig} onThemeChange={handleThemeChange} />
    </div>
  );
};
