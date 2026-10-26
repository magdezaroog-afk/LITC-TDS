---
name: security-auditing
description: فحص وتدقيق الأمان السيبراني لمنظومة NEXUS TDS باستخدام حزمة الأدوات الأمنية الثلاثية المعتمدة (Nuclei لفحص ثغرات الـ Endpoints والـ Web APIs، Semgrep للفحص الساكن للكود المصدر SAST قبل كل Commit، و Trivy لفحص الحزم والاعتماديات Dependencies).
---

# مهارة التدقيق والفحص الأمني المؤسسي (Security Auditing Skill)
## منظومة NEXUS TDS — المعايير الدفاعية والحصانة الرقمية 2026

تحدد هذه المهارة بروتوكول التشغيل الإلزامي لأدوات الفحص الأمني المعتمدة في المشروع، بما يضمن خلو الكود والخدمات الشبكية والاعتماديات من أي ثغرات أو تجاوزات أمنية.

---

### 1. الأدوار والمسؤوليات المحددة لكل أداة (Core Tool Specializations)

بناءً على التوجيه المعتمد من **سعادة مدير المشروع (Project Director) — م. مجدي الزروق**، تم توزيع مهام الفحص الأمني بدقة وتخصص صارم:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NEXUS TDS — مثلث الحصانة الأمنية                      │
├──────────────────┬─────────────────────────────────────────────────────┤
│ 1. Nuclei        │ فحص الثغرات في الـ Endpoints والـ Web APIs بالقوالب   │
│ 2. Semgrep       │ فحص الكود المصدري الساكن (SAST) قبل كل عملية Commit │
│ 3. Trivy         │ فحص الحزم والاعتمادات والتبعيات (Dependencies)      │
└──────────────────┴─────────────────────────────────────────────────────┘
```

#### 🎯 أولاً: أداة Nuclei
- **الدور المحدد:** تُستعمل حصراً لفحص الثغرات في نقاط النهاية (Endpoints) والـ Web APIs عبر القوالب الجاهزة والمخصصة (Template-based Vulnerability Scanner).
- **نطاق العمل:**
  - فحص نقاط الدخول ومسارات الـ REST APIs (مثل `/api/v1/auth`, `/api/v1/satellites`, `/api/v1/tickets`).
  - رصد ثغرات التكوين الخاطئ للخادم (Server Misconfiguration & Security Headers).
  - اختبار استجابة جدار الحماية للواجهات WAF وكشف تسريب التلميحات الحساسة.
- **أمر الاستدعاء النموذجي:**
  ```powershell
  # فحص خفيف لنقاط النهاية في الخادم المحلي
  nuclei -u http://localhost:5555 -t http/misconfiguration -silent
  ```

#### 🛡️ ثانياً: أداة Semgrep
- **الدور المحدد:** تُستعمل لفحص الكود المصدري الساكن (SAST) قبل كل عملية دمج وحفظ نسخي (Pre-Commit Audit Loop).
- **نطاق العمل:**
  - منع حقن البيانات (SQL Injection) والتأكد من استخدام Prisma الوسيط حصراً.
  - كشف ثغرات تزوير الطلبات المتقاطعة (XSS) ومسارات الملفات غير الآمنة (Path Traversal).
  - حظر وجود المفاتيح السرية الصريحة داخل الكود (Hardcoded Secrets Detection).
  - كشف ثغرات الصلاحيات على مستوى الكائنات (BOLA / IDOR).
- **أمر الاستدعاء النموذجي:**
  ```powershell
  # فحص الكود المصدري قبل كل Commit
  semgrep scan --config auto --metrics=off
  ```

#### 📦 ثالثاً: أداة Trivy
- **الدور المحدد:** تُستعمل لفحص الحزم والاعتمادات (Dependencies & Software Supply Chain).
- **نطاق العمل:**
  - فحص ملف `package.json` وسجل الحزم `node_modules` ضد قواعد بيانات الثغرات المفتوحة (CVEs).
  - رصد المكتبات القديمة ذات الثغرات الحرجة (Critical / High CVEs).
  - تدقيق ملفات الـ Dockerfile وصور الحاويات في حال تشغيل بيئة الإنتاج الموزعة.
- **أمر الاستدعاء النموذجي:**
  ```powershell
  # فحص اعتماديات المشروع ضد الثغرات الحرجة
  trivy fs --scanners vuln --severity CRITICAL,HIGH package.json
  ```

---

### 2. مسارات الأدوات التشغيلية في بيئة المشروع (Environment Paths)

تتواجد الأدوات محلياً وجاهزة في مسار متغيرات البيئة (PATH):
- **مجلد الأدوات المحلي:** `security-tools\bin\`
  - `security-tools\bin\nuclei.exe` (Version: v3.11.1+)
  - `security-tools\bin\trivy.exe` (Version: v0.76.1+)
- **أداة فحص الكود الساكن:**
  - `semgrep` عبر بيئة بايثون `AppData\Local\Programs\Python\Python312\Scripts\semgrep.exe`

---

### 3. بروتوكول التشغيل قبل كل Commit (Pre-Commit Workflow)

قبل اعتماد أي تعديل ودمجه (Commit) في مستودع المشروع، يجب على مهندس الذكاء الاصطناعي (Antigravity):
1. **تشغيل فحص Semgrep:** للتأكد من نظافة الملفات المعدلة من أي ثغرات حقن أو مفاتيح صلبة.
2. **تشغيل فحص Trivy:** عند إضافة أو تعديل أي حزمة جديدة في `package.json`.
3. **تشغيل فحص Nuclei:** عند إضافة مسارات API جديدة للتحقق من حصانتها.
4. **تشغيل سكربت الفحص الموحد:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\security-tools\test_security_tools.ps1
   ```
