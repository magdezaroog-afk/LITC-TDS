---
name: git-semantic-release-and-changelog
description: إدارة وحوكمة النسخ الاحتياطية وإصدارات Git المؤسسية (Semantic Git & Automated Checkpoints). تنفيذ الالتزام الدوري بحفظ نسخة Commit/Push كل 5 مهام رئيسية وفق معايير Conventional Commits، وتوليد سجل التغييرات الرسمي لمدير المشروع.
---

# مهارة حوكمة Git وحفظ النسخ كل 5 مهام (Semantic Git Checkpoint)

## 1. طبيعة عمل المهارة
* **نمط التشغيل:** **تلقائي (Autonomous)** بعد إنجاز كل 5 مهام رئيسية، أو **عند الطلب (On-Demand)** بناءً على توجيه صريح من سعادة مدير المشروع.
* **الهدف:** استدامة الشيفرة البرمجية وضمان عدم ضياع أي مجهود، وتوفير سجل تتبع هندسي فائق النزاهة والوضوح.

---

## 2. معايير رسائل الـ Commit (Conventional Commits)
تُصاغ رسائل الـ Commit بصيغة احترافية ثنائية (إنجليزية/عربية) تحدد نوع الإنجاز بدقة:
- `feat(module):` إضافة ميزة جديدة أو شاشة جديدة.
- `fix(module):` إصلاح خلل أو خطأ برمجي.
- `refactor(module):` إعادة هيكلة الكود لتحسين الأداء أو ترشيق الملفات.
- `security(module):` ترقيات أمنية، إغلاق ثغرات، أو إضافة أدوات فحص.
- `docs(module):` تحديث الوثائق أو سجل خارطة الطريق.

مثال:
```bash
git commit -m "security(core): integrate nuclei, semgrep, and trivy triple security suite"
```

---

## 3. مسار التنفيذ الآلي لحفظ النسخة
1. التحقق من حالة الملفات النظيفة:
   ```bash
   git status
   ```
2. استبعاد أي ملفات مؤقتة أو مفاتيح سرية (`.env`, `node_modules`).
3. إضافة الملفات المنجزة:
   ```bash
   git add <specific_files_or_directories>
   ```
4. تسجيل الـ Commit بالرسالة المناسبة.
5. تحديث ملف `.agents/PROJECT_ROADMAP_AND_STATE.md` لتوثيق رقم الـ Commit وما تم إنجازه فيه.
6. تقديم ملخص تنفيذي موجز لسعادة مدير المشروع.
