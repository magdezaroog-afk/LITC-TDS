#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LITC Full System Localizer v2 - Fixed
Extracts ALL Arabic UI strings, maps them to t() keys, rewrites source files.
"""

import os
import re
import json

SRC_DIR = "src"
AR_JSON = "src/locales/ar.json"
EN_JSON = "src/locales/en.json"

SKIP_PATHS = [
    'backend', 'node_modules', '__pycache__',
    'LanguageContext', 'AuthContext', 'orgStructureTypes',
    'mockJourneyData', 'mock.layout', 'EventBus', 'WorkflowEngine',
    'PolicyManager', 'ComponentRegistry', 'PageRenderer',
    'useArchiveData', 'useRealTimeConnection', 'useWorkspaceLayout',
    'SlaMonitorJob', 'UserController', 'api.client', 'GarbageCollectionCore',
    'RealTimeSynchronizer', 'TicketRepository', 'TicketStateService',
    'theme.ts', 'component.types', 'dynamicFields', 'searchUtils', 'SecurityUtils',
]

MANUAL_TRANSLATIONS = {
    # Auth / Login
    "بوابة الوصول الآمن": "Secure Access Gateway",
    "الدخول بحساب الشركة (Microsoft 365)": "Login with Corporate Account (Microsoft 365)",
    "الدخول المباشر للتجربة (Credential Login)": "Direct Login for Testing (Credential Login)",
    "اسم المستخدم (مثل: admin, tech, emp)": "Username (e.g. admin, tech, emp)",
    "كلمة المرور (admin123)": "Password (admin123)",
    "دخول للنظام": "System Login",
    "دخول مدير النظام المطلق (Master Builder)": "Master Builder Login",
    "يرجى إدخال اسم المستخدم وكلمة المرور": "Please enter username and password",
    "فشل تسجيل الدخول": "Login failed",
    "حدث خطأ في الاتصال بالخادم": "Server connection error",

    # Profile / Nav
    "الملف الشخصي": "Profile",
    "الإعدادات": "Settings",
    "تسجيل الخروج": "Logout",
    "لوحة التحكم": "Dashboard",
    "حسابي": "My Account",

    # Roles
    "مسؤول": "Admin",
    "مشرف": "Supervisor",
    "موظف": "Employee",
    "رئيس قسم": "Section Head",
    "مدير": "Director",
    "مدير القسم": "Department Head",
    "مدير النظام": "System Admin",
    "مدير النظام المطلق": "Master Builder",
    "رئيس": "Head",
    "نائب": "Deputy",
    "مساعد": "Assistant",

    # Toast / Alerts
    "إشعار جديد": "New Notification",
    "تم بنجاح": "Done Successfully",
    "خطأ": "Error",
    "تحذير": "Warning",
    "معلومة": "Info",
    "حدث خطأ": "An error occurred",
    "يرجى المحاولة مرة أخرى": "Please try again",
    "تم الحفظ": "Saved",
    "لم يتم العثور على نتائج": "No results found",

    # Mobile Nav
    "الرئيسية": "Home",
    "البريد": "Inbox",
    "التذاكر": "Tickets",
    "أرشيف": "Archive",
    "الفريق": "Team",
    "البحث": "Search",
    "القائمة": "Menu",

    # Mobile Shell
    "لوحة التحكم الرئيسية": "Main Dashboard",
    "إدارة التذاكر": "Ticket Management",
    "صندوق الوارد": "Inbox",
    "مساحة العمل": "Workspace",

    # PersonaSwitcher
    "محاكي أدوار النظام": "System Role Simulator",
    "اختر دور للمحاكة": "Select a role to simulate",
    "اختر دور للمحاكاة": "Select a role to simulate",
    "إلغاء المحاكاة": "Exit Simulation",
    "تفعيل المحاكاة": "Activate Simulation",
    "الدور الحالي": "Current Role",

    # Staff Hierarchy
    "الهيكل الوظيفي": "Staff Hierarchy",
    "الهيكل التنظيمي": "Organizational Structure",
    "البحث عن موظف": "Search Employee",
    "لا يوجد موظفون": "No Employees Found",
    "لا توجد بيانات": "No Data",

    # Action Modals / Common Buttons
    "تأكيد الإجراء": "Confirm Action",
    "هل أنت متأكد؟": "Are you sure?",
    "تأكيد": "Confirm",
    "إلغاء": "Cancel",
    "حذف": "Delete",
    "تعديل": "Edit",
    "إضافة": "Add",
    "حفظ": "Save",
    "إغلاق": "Close",
    "عرض": "View",
    "إضافة جديد": "Add New",
    "بحث...": "Search...",
    "تحديث": "Refresh",
    "تطبيق": "Apply",
    "مسح الكل": "Clear All",
    "اختر...": "Select...",
    "كل": "All",
    "تأكيد الحذف": "Confirm Deletion",
    "هل تريد حذف هذا العنصر؟": "Are you sure you want to delete this item?",
    "نعم، احذف": "Yes, Delete",
    "لا، تراجع": "No, Cancel",
    "نعم": "Yes",
    "لا": "No",

    # Operational Inbox
    "صندوق الوارد التشغيلي": "Operational Inbox",
    "التذاكر المعلقة": "Pending Tickets",
    "تذاكر جديدة": "New Tickets",
    "لا توجد تذاكر": "No Tickets Found",
    "عرض الكل": "View All",
    "البحث في التذاكر": "Search Tickets",
    "الأولوية": "Priority",
    "الحالة": "Status",
    "تاريخ الإنشاء": "Created At",
    "منخفضة": "Low",
    "متوسطة": "Medium",
    "عالية": "High",
    "حرجة": "Critical",
    "مفتوحة": "Open",
    "مغلقة": "Closed",
    "قيد المعالجة": "In Progress",
    "معلقة": "Pending",

    # Ticket Operations
    "لوحة عمليات التذكرة": "Ticket Operations Panel",
    "تفاصيل التذكرة": "Ticket Details",
    "رقم التذكرة": "Ticket Number",
    "الوصف": "Description",
    "المرسل": "Sender",
    "المستلم": "Recipient",
    "القسم": "Division",
    "الإدارة": "Department",
    "الفريق": "Team",
    "الملاحظات": "Notes",
    "إضافة ملاحظة": "Add Note",
    "إرسال": "Send",
    "تحويل": "Transfer",
    "رفض": "Reject",
    "قبول": "Accept",
    "إغلاق التذكرة": "Close Ticket",
    "إعادة فتح": "Reopen",

    # Ticket creation
    "إنشاء تذكرة جديدة": "Create New Ticket",
    "نوع الطلب": "Request Type",
    "عنوان الطلب": "Request Title",
    "تفاصيل الطلب": "Request Details",
    "المرفقات": "Attachments",
    "إرفاق ملف": "Attach File",
    "اختر نوع الطلب": "Select Request Type",
    "اختر الأولوية": "Select Priority",
    "يرجى ملء جميع الحقول": "Please fill all required fields",
    "تم إرسال الطلب بنجاح": "Request submitted successfully",

    # Dynamic Form
    "منشئ النماذج الديناميكية": "Dynamic Form Builder",
    "اسم الحقل": "Field Name",
    "نوع الحقل": "Field Type",
    "مطلوب": "Required",
    "اختياري": "Optional",
    "إضافة حقل": "Add Field",
    "حذف الحقل": "Delete Field",
    "نص": "Text",
    "رقم": "Number",
    "تاريخ": "Date",
    "قائمة منسدلة": "Dropdown",
    "مربع اختيار": "Checkbox",

    # Layout Engine
    "هندسة وتخصيص الواجهات": "UI Layout Engine",
    "محرك الواجهات المرنة": "Flexible UI Engine",
    "إنشاء واجهة جديدة": "Create New Interface",
    "واجهاتي": "My Interfaces",
    "واجهات الكل": "All Interfaces",
    "نشط": "Active",
    "معطل": "Inactive",
    "مسودة": "Draft",
    "تعديل الواجهة": "Edit Interface",
    "حذف الواجهة": "Delete Interface",
    "معاينة": "Preview",

    # Institutional / Operational Structure
    "الهيكل المؤسسي": "Institutional Structure",
    "الهيكل التشغيلي (Operational Structure)": "Operational Structure",
    "إضافة مستوى": "Add Level",
    "المستوى الأول": "Level 1",
    "المستوى الثاني": "Level 2",
    "المستوى الثالث": "Level 3",
    "اسم المؤسسة": "Institution Name",
    "إضافة إدارة تشغيلية": "Add Department",
    "إضافة قسم": "Add Division",
    "إضافة فريق/وحدة": "Add Team/Unit",

    # User Matrix
    "مصفوفة الأدوار العامة": "Global User Matrix",
    "إضافة مستخدم": "Add User",
    "تعديل الصلاحيات": "Edit Permissions",
    "اسم المستخدم": "Username",
    "البريد الإلكتروني": "Email",
    "الدور الوظيفي": "Job Role",
    "الوحدة التنظيمية": "Organizational Unit",
    "الصلاحيات": "Permissions",
    "فعّال": "Active",
    "غير فعّال": "Inactive",

    # Security Control
    "التحكم الأمني": "Security Control",
    "سجل النشاط": "Activity Log",
    "محاولات الدخول": "Login Attempts",
    "الجلسات النشطة": "Active Sessions",
    "إنهاء الجلسة": "End Session",
    "تغيير كلمة المرور": "Change Password",

    # Policy Veto
    "سياسات النقض": "Veto Policies",
    "إضافة سياسة": "Add Policy",
    "تعديل السياسة": "Edit Policy",
    "حذف السياسة": "Delete Policy",
    "الشرط": "Condition",
    "الإجراء": "Action",

    # Branding
    "الهوية البصرية": "Branding",
    "شعار المؤسسة": "Organization Logo",
    "اسم المؤسسة": "Organization Name",
    "الألوان الرئيسية": "Primary Colors",
    "اللون الأساسي": "Primary Color",
    "لون الخلفية": "Background Color",
    "الخط الرئيسي": "Primary Font",
    "تحميل الشعار": "Upload Logo",
    "حفظ التغييرات": "Save Changes",
    "معاينة التصميم": "Preview Design",

    # Operational Dashboard
    "لوحة التحكم التشغيلية": "Operational Dashboard",
    "إجمالي التذاكر": "Total Tickets",
    "التذاكر المفتوحة": "Open Tickets",
    "التذاكر المغلقة": "Closed Tickets",
    "متوسط وقت الحل": "Avg. Resolution Time",
    "مؤشرات الأداء": "Performance Indicators",
    "التذاكر حسب القسم": "Tickets by Department",
    "النشاط الأسبوعي": "Weekly Activity",

    # Dept Head Workspace
    "مساحة عمل رئيس القسم": "Department Head Workspace",
    "فريقي": "My Team",
    "تقارير الأداء": "Performance Reports",
    "إدارة الموافقات": "Manage Approvals",
    "طلبات معلقة": "Pending Requests",
    "الإحصائيات": "Statistics",

    # Archive
    "الأرشيف": "Archive",
    "تاريخ الأرشفة": "Archive Date",
    "البحث في الأرشيف": "Search Archive",
    "تصفية": "Filter",
    "تصدير": "Export",
    "طباعة": "Print",
    "عرض التفاصيل": "View Details",

    # System health
    "صحة النظام": "System Health",
    "حالة الخادم": "Server Status",
    "استخدام المعالج": "CPU Usage",
    "استخدام الذاكرة": "Memory Usage",
    "وقت الاستجابة": "Response Time",
    "جيد": "Good",
    "خطر": "Critical",

    # Common time
    "اليوم": "Today",
    "الأسبوع": "This Week",
    "الشهر": "This Month",
    "نتيجة": "Result",
    "نتائج": "Results",

    # Ticket types/status
    "طلب جديد": "New Request",
    "شكوى": "Complaint",
    "استفسار": "Inquiry",
    "بلاغ": "Report",
    "طارئ": "Emergency",
    "مرفوضة": "Rejected",
    "موافق عليها": "Approved",
    "بانتظار الموافقة": "Awaiting Approval",
    "تم التحويل": "Transferred",

    # Form fields
    "الاسم": "Name",
    "الاسم الكامل": "Full Name",
    "الوظيفة": "Job Title",
    "رقم الموظف": "Employee ID",
    "تاريخ التوظيف": "Hire Date",
    "الجنسية": "Nationality",
    "رقم الهاتف": "Phone Number",
    "تحميل...": "Loading...",

    # Supervisor Policy Modal
    "سياسة المشرف": "Supervisor Policy",
    "قواعد الإشعار": "Notification Rules",
    "تصعيد تلقائي": "Auto Escalation",
    "حفظ السياسة": "Save Policy",
    "الحد الأقصى للوقت": "Max Time Limit",
    "الإجراء عند الانتهاء": "Action on Expiry",

    # Floating Window
    "تصغير": "Minimize",
    "تكبير": "Maximize",
    "إغلاق النافذة": "Close Window",
    "سحب": "Drag",
    "نقل": "Move",

    # Admin Taskbar
    "تغيير الاتجاه": "Toggle Direction",
    "أفقي": "Horizontal",
    "عمودي": "Vertical",
    "اسحب لتصغير": "Drag to Resize",
    "تكبير سعة الشريط": "Expand Taskbar",
    "إعدادات شريط المهام": "Taskbar Settings",
    "موضع الشريط": "Taskbar Position",
    "أسفل": "Bottom",
    "يمين": "Right",
    "يسار": "Left",
    "حجم الشريط": "Taskbar Size",
    "حفظ وإغلاق": "Save & Close",
}

# Load existing locale files
ar_dict = json.loads(open(AR_JSON, encoding='utf-8').read())
en_dict = json.loads(open(EN_JSON, encoding='utf-8').read())

# Pre-populate dictionaries with manual translations
_used_keys = set(ar_dict.keys())

def make_key(en_text):
    slug = en_text.lower()
    slug = re.sub(r"[^a-z0-9]+", "_", slug).strip("_")
    slug = slug[:45]
    key = f"ui.{slug}"
    orig = key
    i = 2
    while key in _used_keys:
        key = f"{orig}_{i}"
        i += 1
    _used_keys.add(key)
    return key

def get_or_create_key(arabic_text):
    """Return existing key for arabic_text, or create one from MANUAL_TRANSLATIONS."""
    stripped = arabic_text.strip()
    # Check if already in ar_dict
    for k, v in ar_dict.items():
        if v == stripped:
            return k
    if stripped in MANUAL_TRANSLATIONS:
        en_text = MANUAL_TRANSLATIONS[stripped]
        key = make_key(en_text)
        ar_dict[key] = stripped
        en_dict[key] = en_text
        return key
    return None

def should_skip(filepath):
    norm = filepath.replace('/', os.sep)
    for skip in SKIP_PATHS:
        if skip in norm:
            return True
    return False

def compute_relative_import(filepath):
    """Compute relative import path from filepath to LanguageContext."""
    # Normalize to forward slashes relative to src/
    rel = filepath.replace('\\', '/').replace('src/', '')
    depth = rel.count('/') 
    prefix = '../' * depth
    return f"{prefix}engine/ui-loader/LanguageContext"

# Walk tsx files
def walk_tsx(directory):
    results = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '__pycache__', 'backend', 'dist']]
        for file in files:
            if file.endswith('.tsx'):
                fp = os.path.join(root, file)
                if not should_skip(fp):
                    results.append(fp)
    return results

files = walk_tsx(SRC_DIR)
print(f"Processing {len(files)} TSX files...\n")

modified = []
ARABIC_RE = re.compile(r'[\u0600-\u06FF]')

for filepath in files:
    content = open(filepath, encoding='utf-8').read()
    if not ARABIC_RE.search(content):
        continue

    already_has_lang = 'useLanguage' in content
    new_content = content
    replacements = []

    # Step 1: Find JSX text nodes >...arabic...<
    # Pattern: text between > and < that contains Arabic
    # We do this carefully to avoid matching JSX tags
    jsx_pattern = re.compile(r'(?<=>)([^<>{}\n]*[\u0600-\u06FF][^<>{}\n]*)(?=<)', re.UNICODE)
    
    for m in jsx_pattern.finditer(new_content):
        arabic_text = m.group(1).strip()
        if not arabic_text or not ARABIC_RE.search(arabic_text):
            continue
        key = get_or_create_key(arabic_text)
        if key:
            replacements.append((m.group(1), f" {{t('{key}')}} "))

    # Apply JSX replacements
    for old, new in replacements:
        new_content = new_content.replace(old, new, 1)

    changed = new_content != content
    
    # Step 2: String literals with Arabic
    # 'arabic text' -> t('key') 
    def sub_str(m):
        inner = m.group(1)
        if not ARABIC_RE.search(inner):
            return m.group(0)
        key = get_or_create_key(inner)
        if key:
            return f"t('{key}')"
        return m.group(0)
    
    new_content2 = re.sub(r"(?<!')(?<![a-zA-Z])'([^'\n\\]{2,}[\u0600-\u06FF][^'\n\\]*)'", sub_str, new_content)
    new_content2 = re.sub(r'"([^"\n\\]{2,}[\u0600-\u06FF][^"\n\\]*)"', sub_str, new_content2)
    
    if new_content2 != new_content:
        new_content = new_content2
        changed = True

    # Step 3: Inject useLanguage if we made changes and it's not already there
    if changed and not already_has_lang:
        rel_import = compute_relative_import(filepath)
        import_line = f"import {{ useLanguage }} from '{rel_import}';\n"
        
        # Find last import statement
        imports = list(re.finditer(r'^import\s+.+?;\s*$', new_content, re.MULTILINE))
        if imports:
            ins_pos = imports[-1].end()
            new_content = new_content[:ins_pos] + '\n' + import_line + new_content[ins_pos:]
        else:
            new_content = import_line + new_content

        # Inject hook: after first opening brace of a React component
        hook_line = "\n  const { t } = useLanguage();\n"
        # Match const ComponentName: React.FC or const ComponentName = () => or export default function
        comp_match = re.search(
            r'(export\s+(?:default\s+)?(?:const|function)\s+\w+[^{]*\{)',
            new_content
        )
        if comp_match:
            ins_pos = comp_match.end()
            new_content = new_content[:ins_pos] + hook_line + new_content[ins_pos:]

    if changed:
        open(filepath, 'w', encoding='utf-8').write(new_content)
        modified.append(filepath)
        print(f"  OK {os.path.basename(filepath)}")

# Save updated locale files
open(AR_JSON, 'w', encoding='utf-8').write(json.dumps(ar_dict, ensure_ascii=False, indent=2))
open(EN_JSON, 'w', encoding='utf-8').write(json.dumps(en_dict, ensure_ascii=False, indent=2))

print(f"\n{'='*60}")
print(f"DONE - Modified {len(modified)} files")
print(f"ar.json keys: {len(ar_dict)}")
print(f"en.json keys: {len(en_dict)}")
print(f"{'='*60}")
