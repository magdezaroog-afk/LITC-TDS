/**
 * NEXUS TDS 2026 — Comprehensive Enterprise Icon & Color Library
 * Unified catalog for Ticket Routing, Flow Builder & Functional UI
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface RouteIconItem {
  name: string;
  label: string;
  category: 'it' | 'services' | 'hr' | 'finance' | 'security' | 'logistics' | 'health' | 'comms';
}

export const ICON_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'it', label: '💻 تقنية ومعلومات' },
  { id: 'services', label: '🔧 خدمات ومرافق' },
  { id: 'hr', label: '👥 شؤون إدارية' },
  { id: 'finance', label: '💳 مالية ومشتريات' },
  { id: 'security', label: '🛡️ أمن وسلامة' },
  { id: 'logistics', label: '🚚 نقل ولوجستيات' },
  { id: 'health', label: '🏥 صحة ورعاية' },
  { id: 'comms', label: '📡 اتصالات وإعلام' },
] as const;

export const ROUTE_ICONS: RouteIconItem[] = [
  // ── 1. تقنية المعلومات والأنظمة (IT & Tech) ──
  { name: 'Monitor', label: 'شاشة حاسب', category: 'it' },
  { name: 'Laptop', label: 'حاسب محمول', category: 'it' },
  { name: 'Server', label: 'خادم شبكة', category: 'it' },
  { name: 'Cpu', label: 'معالج وبيانات', category: 'it' },
  { name: 'Database', label: 'قاعدة بيانات', category: 'it' },
  { name: 'HardDrive', label: 'قرص تخزين', category: 'it' },
  { name: 'Wifi', label: 'شبكة لاسلكية', category: 'it' },
  { name: 'Network', label: 'بنية شبكية', category: 'it' },
  { name: 'Terminal', label: 'سطر أوامر', category: 'it' },
  { name: 'Code', label: 'برمجة وتطوير', category: 'it' },
  { name: 'Bug', label: 'إبلاغ عن خطأ', category: 'it' },
  { name: 'Cloud', label: 'سحابة وتخزين', category: 'it' },
  { name: 'ShieldCheck', label: 'أمان رقمي', category: 'it' },
  { name: 'KeyRound', label: 'كلمات المرور', category: 'it' },
  { name: 'Smartphone', label: 'هاتف ذكي', category: 'it' },
  { name: 'Tablet', label: 'جهاز لوحي', category: 'it' },

  // ── 2. الخدمات العامة والمرافق (Facilities & General Services) ──
  { name: 'Building2', label: 'مبنى إداري', category: 'services' },
  { name: 'Building', label: 'مجمع مكاتب', category: 'services' },
  { name: 'Warehouse', label: 'مستودع ومخزن', category: 'services' },
  { name: 'Wrench', label: 'صيانة وإصلاح', category: 'services' },
  { name: 'Hammer', label: 'أعمال مدنية', category: 'services' },
  { name: 'Cog', label: 'تشغيل وصيانة', category: 'services' },
  { name: 'Fuel', label: 'محروقات وطاقة', category: 'services' },
  { name: 'Lightbulb', label: 'كهرباء وإنارة', category: 'services' },
  { name: 'Zap', label: 'تيار عالي', category: 'services' },
  { name: 'Fan', label: 'تكييف وتهوية', category: 'services' },
  { name: 'Droplets', label: 'مياه وسباكة', category: 'services' },
  { name: 'Paintbrush', label: 'دهان وديكور', category: 'services' },
  { name: 'Trash2', label: 'نظافة وإصحاح', category: 'services' },
  { name: 'Key', label: 'مفاتيح وأقفال', category: 'services' },
  { name: 'Construction', label: 'أعمال ومشاريع', category: 'services' },

  // ── 3. الموارد البشرية والشؤون الإدارية (HR & Admin) ──
  { name: 'Users', label: 'فريق عمل', category: 'hr' },
  { name: 'UserPlus', label: 'توظيف واستقطاب', category: 'hr' },
  { name: 'UserCheck', label: 'إجازات وانضباط', category: 'hr' },
  { name: 'Briefcase', label: 'شؤون وظيفية', category: 'hr' },
  { name: 'GraduationCap', label: 'تدريب وتطوير', category: 'hr' },
  { name: 'Award', label: 'مكافآت وتقدير', category: 'hr' },
  { name: 'BadgeCheck', label: 'شهادات واعتماد', category: 'hr' },
  { name: 'FileText', label: 'خطاب رسمي', category: 'hr' },
  { name: 'FileSpreadsheet', label: 'بيانات وجداول', category: 'hr' },
  { name: 'FolderKanban', label: 'إدارة مشاريع', category: 'hr' },
  { name: 'Stamp', label: 'اعتماد وأختام', category: 'hr' },
  { name: 'Contact2', label: 'ملف الموظف', category: 'hr' },
  { name: 'HeartHandshake', label: 'علاقات موظفين', category: 'hr' },
  { name: 'UserCog', label: 'إدارة الصلاحيات', category: 'hr' },
  { name: 'ClipboardList', label: 'مهام ومتابعة', category: 'hr' },

  // ── 4. المالية والمشتريات (Finance & Procurement) ──
  { name: 'CreditCard', label: 'بطاقات دفع', category: 'finance' },
  { name: 'Banknote', label: 'صرف ومستحقات', category: 'finance' },
  { name: 'Coins', label: 'نثريات وعهد', category: 'finance' },
  { name: 'Receipt', label: 'فواتير ومطالبات', category: 'finance' },
  { name: 'Wallet', label: 'محفظة مالية', category: 'finance' },
  { name: 'ShoppingCart', label: 'مشتريات مواد', category: 'finance' },
  { name: 'ShoppingBag', label: 'طلبيات مكتبية', category: 'finance' },
  { name: 'PackageCheck', label: 'استلام فحص', category: 'finance' },
  { name: 'Scale', label: 'ميزانية وتدقيق', category: 'finance' },
  { name: 'Calculator', label: 'حسابات وتكاليف', category: 'finance' },
  { name: 'ArrowLeftRight', label: 'تحويل مالي', category: 'finance' },
  { name: 'Landmark', label: 'معاملات مصرفية', category: 'finance' },

  // ── 5. الأمن والسلامة (Security & Safety) ──
  { name: 'ShieldAlert', label: 'بلاغ أمني عاجل', category: 'security' },
  { name: 'Shield', label: 'حماية وأمن', category: 'security' },
  { name: 'Lock', label: 'أقفال وبوابات', category: 'security' },
  { name: 'Unlock', label: 'تصاريح دخول', category: 'security' },
  { name: 'Eye', label: 'مراقبة ومتابعة', category: 'security' },
  { name: 'Siren', label: 'إنذار وطوارئ', category: 'security' },
  { name: 'Flame', label: 'سلامة ومكافحة حريق', category: 'security' },
  { name: 'AlertTriangle', label: 'مخاطر وسلامة', category: 'security' },
  { name: 'Fingerprint', label: 'بصمة وهويات', category: 'security' },
  { name: 'Camera', label: 'كاميرات مراقبة', category: 'security' },
  { name: 'Video', label: 'تسجيلات فيديو', category: 'security' },
  { name: 'BellRing', label: 'إشعارات أمنية', category: 'security' },

  // ── 6. النقل واللوجستيات (Transport & Logistics) ──
  { name: 'Truck', label: 'شحن ونقل ثقيل', category: 'logistics' },
  { name: 'Car', label: 'سيارات ومركبات', category: 'logistics' },
  { name: 'Bus', label: 'نقل جماعي', category: 'logistics' },
  { name: 'Plane', label: 'تذاكر وسفر', category: 'logistics' },
  { name: 'Navigation', label: 'توجيه ومسارات', category: 'logistics' },
  { name: 'MapPin', label: 'مواقع وعناوين', category: 'logistics' },
  { name: 'Package', label: 'طرود وشحنات', category: 'logistics' },
  { name: 'Boxes', label: 'مخزون وبضائع', category: 'logistics' },
  { name: 'Box', label: 'شحنة محددة', category: 'logistics' },
  { name: 'Send', label: 'إرسال سريع', category: 'logistics' },
  { name: 'Clock', label: 'مواعيد ومهل', category: 'logistics' },

  // ── 7. الصحة والرعاية (Health & Wellness) ──
  { name: 'HeartPulse', label: 'رعاية صحية', category: 'health' },
  { name: 'Stethoscope', label: 'عيادة طبية', category: 'health' },
  { name: 'Activity', label: 'مؤشرات حيوية', category: 'health' },
  { name: 'Thermometer', label: 'فحص حرارة', category: 'health' },
  { name: 'Pill', label: 'أدوية وصيدلية', category: 'health' },
  { name: 'Cross', label: 'إسعاف أولي', category: 'health' },
  { name: 'Sparkles', label: 'بيئة صحية', category: 'health' },
  { name: 'Smile', label: 'رفاهية الموظف', category: 'health' },

  // ── 8. الاتصالات والإعلام (Comms & Media) ──
  { name: 'Phone', label: 'هاتف مكتبي', category: 'comms' },
  { name: 'PhoneCall', label: 'اتصال هاتفي', category: 'comms' },
  { name: 'Mail', label: 'بريد رسمي', category: 'comms' },
  { name: 'MessageSquare', label: 'استفسار ودعم', category: 'comms' },
  { name: 'Megaphone', label: 'إعلانات وتعميم', category: 'comms' },
  { name: 'Radio', label: 'اتصال لاسلكي', category: 'comms' },
  { name: 'Headphones', label: 'مركز اتصال', category: 'comms' },
  { name: 'Printer', label: 'طباعة وماسحات', category: 'comms' },
  { name: 'Share2', label: 'مشاركة ونشر', category: 'comms' },
  { name: 'Archive', label: 'أرشيف وتوثيق', category: 'comms' },
];

export const EXECUTIVE_PALETTE = [
  { hex: '#135d79', name: 'NEXUS Teal (الأزرق النيلي المؤسسي)' },
  { hex: '#f36c21', name: 'NEXUS Orange (البرتقالي الديناميكي)' },
  { hex: '#2563eb', name: 'Royal Blue (أزرق ملكي)' },
  { hex: '#0284c7', name: 'Cyber Cyan (سماوي حديث)' },
  { hex: '#059669', name: 'Imperial Emerald (زمردي فاخر)' },
  { hex: '#10b981', name: 'Forest Jade (أخضر زمردي)' },
  { hex: '#7c3aed', name: 'Midnight Violet (بنفسجي ليلي)' },
  { hex: '#6366f1', name: 'Electric Indigo (نيلي عصري)' },
  { hex: '#9333ea', name: 'Velvet Purple (أرجواني مخملي)' },
  { hex: '#dc2626', name: 'Crimson Ruby (ياقوتي داكن)' },
  { hex: '#e11d48', name: 'Rose Red (وردي أنيق)' },
  { hex: '#d97706', name: 'Warm Amber (كهرماني دافئ)' },
  { hex: '#f97316', name: 'Sunset Coral (مرجاني مشرق)' },
  { hex: '#ca8a04', name: 'Golden Bronze (برونزي ذهبي)' },
  { hex: '#475569', name: 'Slate Graphite (رمادي أردوازي)' },
  { hex: '#64748b', name: 'Titanium (تيتانيوم هادئ)' },
  { hex: '#1e293b', name: 'Deep Charcoal (فحمي داكن)' },
  { hex: '#881337', name: 'Burgundy Wine (عنابي فاخر)' },
];

/**
 * Universal dynamic icon resolver with comprehensive fallback
 */
export const renderRouteIcon = (
  name?: string,
  size: number = 20,
  color?: string,
  strokeWidth: number = 2
): React.ReactElement => {
  if (!name) {
    return React.createElement(LucideIcons.ClipboardList, {
      size,
      color: color || 'currentColor',
      strokeWidth
    });
  }

  const emojiMap: Record<string, string> = {
    '💻': 'Monitor', '🏗️': 'Building2', '📋': 'ClipboardList', '🔧': 'Wrench',
    '📡': 'Radio', '🔒': 'Lock', '📊': 'BarChart3', '🏥': 'HeartPulse',
    '📞': 'Phone', '🖨️': 'Printer', '⚡': 'Zap', '🌐': 'Globe',
    '🗄️': 'Archive', '📱': 'Smartphone', '🔑': 'Key', '🛠️': 'Wrench',
    '👥': 'Users', '🏢': 'Building', '💳': 'CreditCard', '🚚': 'Truck'
  };

  const cleanName = emojiMap[name] || name;
  const IconComp = (LucideIcons as any)[cleanName] || (LucideIcons as any)[cleanName.toLowerCase()] || LucideIcons.ClipboardList;
  return React.createElement(IconComp, {
    size,
    color: color || 'currentColor',
    strokeWidth
  });
};
