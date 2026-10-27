---
name: security-auditing
description: فحص وتدقيق الأمان السيبراني الشامل لمنظومة NEXUS TDS وأي نظام مؤسسي باستخدام حزمة الأدوات الثلاثية المعتمدة (Nuclei لفحص ثغرات الـ Endpoints والـ Web APIs، Semgrep للفحص الساكن للكود المصدر SAST قبل كل Commit، و Trivy لفحص الحزم والاعتماديات Dependencies).
---

# مهارة التدقيق والفحص الأمني السيبراني المؤسسي (Enterprise Security Auditing)

## 1. طبيعة عمل المهارة
* **نمط التشغيل:** **عند الطلب (On-Demand)** بتوجيه من مدير المشروع، أو **تلقائياً (Autonomous)** كفحص SAST إلزامي قبل أي Commit رئيسي.
* **الأدوات المستخدمة:** `Nuclei v3.11.1`، `Semgrep v1.182.1`، `Trivy v0.76.1` المثبتة محلياً في `security-tools\bin`.

---

## 2. مهام الأدوات الثلاث

### أ. أداة Semgrep (فحص الكود المصدري الساكن - SAST)
- **الدور:** فحص الكود المصدري في الواجهة والباك-إند للكشف عن ثغرات الحقن، تسريب الأسرار، ضعف المصادقة، والبيانات الوهمية.
- **أمر التشغيل:**
  ```powershell
  & "security-tools\bin\semgrep.exe" scan --config "p/security-audit" --config "p/secrets" src/
  ```

### ب. أداة Nuclei (فحص ثغرات الـ Endpoints والـ Web APIs)
- **الدور:** فحص المسارات الحية للـ API والـ Endpoints بالقوالب الأمنية لاكتشاف ثغرات الـ CORS المفتوحة، تسريب الترويسات الأمنية، وتخطي الصلاحيات.
- **أمر التشغيل:**
  ```powershell
  & "security-tools\bin\nuclei.exe" -u http://localhost:5555 -t security-tools\templates -duc
  ```

### ج. أداة Trivy (فحص الحزم والاعتماديات والمكتبات - SCA)
- **الدور:** مسح ملفات `package-lock.json` و `node_modules` للكشف عن المكتبات التي تحتوي على ثغرات أمنية حرجة معروفة (CVEs).
- **أمر التشغيل:**
  ```powershell
  & "security-tools\bin\trivy.exe" fs --scanners vuln --severity HIGH,CRITICAL .
  ```

---

## 3. التشغيل الموحد بنقرة واحدة
لفحص المنظومة كاملة بالأدوات الثلاث معاً وتقديم تقرير موحد:
```powershell
powershell -ExecutionPolicy Bypass -File security-tools\test_security_tools.ps1
```

---

## 4. معايير القبول والرفض (Pass/Fail Gates)
- **حظر الثغرات الحرجة (Zero Criticals):** يمنع دمج أي كود يحتوي على ثغرة High أو Critical من Semgrep أو Trivy.
- **إلزامية المعالجة الفورية:** عند اكتشاف أي مسار غير محمي، يتم تصحيح الصلاحيات أو تحديث الحزمة قبل تسليم المهمة لمدير المشروع.
