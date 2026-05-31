/**
 * LITC-TS v43.0 - DynamicFormCreator Organism
 * منشئ التذاكر الديناميكي: يدعم ربط الحقول التبعي وتطهير المدخلات وحقن هويات الموظفين أمنياً.
 */
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { EventBus } from '../../engine/events/EventBus';
import { SecurityUtils } from '../../utils/SecurityUtils';
import { TicketRepository } from '../../services/TicketRepository';
import { BaseCard } from '../atoms/BaseCard';
import { BaseInput } from '../atoms/BaseInput';
import { BaseButton } from '../atoms/BaseButton';

// قائمة التصنيفات والأقسام الفرعية التبعية
const subCategoriesByDept: Record<string, string[]> = {
  IT: ['مشكلة بالشبكة (Network)', 'خلل برمجيات (Software)', 'صيانة عتاد (Hardware)'],
  Maintenance: ['انقطاع كهرباء (Power)', 'سباكة (Plumbing)', 'أعطال تكييف (HVAC)'],
  HR: ['استفسار رواتب (Salary)', 'طلب إجازة (Vacation)', 'شؤون موظفين (Admin)']
};

export const DynamicFormCreator: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('IT');
  const [subCategory, setSubCategory] = useState('');
  const [location, setLocation] = useState('المقر الرئيسي - الدور الأول'); // سحب القيمة الافتراضية
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // تحديث الخيار الفرعي تلقائياً عند تغيير القسم الرئيسي
  useEffect(() => {
    const availableSubs = subCategoriesByDept[department] || [];
    if (availableSubs.length > 0) {
      setSubCategory(availableSubs[0]);
    } else {
      setSubCategory('');
    }
  }, [department]);

  if (!user) {
    return React.createElement('div', null, 'يرجى تسجيل الدخول لإنشاء التذاكر.');
  }

  const handleSubmit = async () => {
    try {
      setSuccessMessage(null);
      setErrorMessage(null);

      if (!title.trim() || !description.trim()) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة (العنوان والوصف).');
      }

      // 1. تجميع البيانات وحقن الهوية والموقع الافتراضي تلقائياً وأمنياً
      const ticketPayload = {
        title,
        description,
        status: 'new' as const,
        mainCategory: department,
        subCategory,
        attachments: [],
        location,
        department,
        creatorId: user.id, // حقن الهوية تلقائياً
        childTicketIds: []
      };

      // 2. تطهير البيانات إجبارياً قبل الإرسال لمنع Stored XSS
      const sanitizedPayload = SecurityUtils.sanitizeObject(ticketPayload);

      // 3. إرسال وحفظ التذكرة عبر الـ Repository المركزي
      const newTicket = await TicketRepository.createTicket(sanitizedPayload);

      setSuccessMessage(`تم إنشاء التذكرة بنجاح بالمعرف: ${newTicket.id}`);
      setTitle('');
      setDescription('');
      
      // 4. إرسال حدث عبر الـ EventBus لتنبيه باقي المكونات بالتحديث
      EventBus.emit('TICKET_REFRESH', { ticketId: newTicket.id });
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.sm,
    border: `1px solid ${theme.colors.secondary}`,
    borderRadius: '4px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,
    boxSizing: 'border-box',
    marginBottom: theme.spacing.sm
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.xs,
    fontSize: '13px',
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily
  };

  return React.createElement(
    BaseCard,
    { title: 'إنشاء تذكرة جديدة ديناميكية' },
    React.createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: theme.spacing.sm } },
      
      // معلومات الهوية التلقائية المشفرة
      React.createElement(
        'div',
        { 
          style: { 
            padding: theme.spacing.sm, 
            backgroundColor: theme.colors.secondary, 
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: theme.spacing.sm
          } 
        },
        React.createElement('span', null, 'سيتم إنشاء التذكرة بهوية الموظف: '),
        React.createElement('strong', null, user.id),
        React.createElement('span', null, ' وبموقعه الافتراضي: '),
        React.createElement('strong', null, location)
      ),

      React.createElement(BaseInput, {
        label: 'عنوان التذكرة',
        value: title,
        onChange: setTitle,
        placeholder: 'أدخل عنواناً واضحاً للمشكلة'
      }),

      React.createElement(BaseInput, {
        label: 'وصف المشكلة بالتفصيل',
        value: description,
        onChange: setDescription,
        placeholder: 'اكتب تفاصيل العطل هنا...'
      }),

      // اختيار القسم الرئيسي
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'القسم التشغيلي المسؤول (الرئيسي)'),
        React.createElement('select', {
          value: department,
          onChange: (e) => setDepartment(e.target.value),
          style: selectStyle
        },
          React.createElement('option', { value: 'IT' }, 'تقنية المعلومات (IT)'),
          React.createElement('option', { value: 'Maintenance' }, 'الصيانة العامة (Maintenance)'),
          React.createElement('option', { value: 'HR' }, 'الموارد البشرية (HR)')
        )
      ),

      // اختيار القسم الفرعي التبعي (Conditional dropdown)
      React.createElement('div', null,
        React.createElement('label', { style: labelStyle }, 'التصنيف الفرعي للمشكلة'),
        React.createElement('select', {
          value: subCategory,
          onChange: (e) => setSubCategory(e.target.value),
          style: selectStyle
        },
          (subCategoriesByDept[department] || []).map((sub, idx) => 
            React.createElement('option', { key: idx, value: sub }, sub)
          )
        )
      ),

      // حقل الموقع
      React.createElement(BaseInput, {
        label: 'موقع حدوث المشكلة',
        value: location,
        onChange: setLocation,
        placeholder: 'تأكيد موقع العمل'
      }),

      successMessage && React.createElement(
        'div',
        { style: { color: theme.colors.success, fontSize: '13px', margin: `${theme.spacing.sm} 0` } },
        `✓ ${successMessage}`
      ),
      errorMessage && React.createElement(
        'div',
        { style: { color: theme.colors.error, fontSize: '13px', margin: `${theme.spacing.sm} 0` } },
        `❌ ${errorMessage}`
      ),

      React.createElement(
        'div',
        { style: { marginTop: theme.spacing.md } },
        React.createElement(BaseButton, {
          label: 'إرسال التذكرة',
          onClick: handleSubmit,
          variant: 'primary'
        })
      )
    )
  );
};
