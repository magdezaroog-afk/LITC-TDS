---
name: api-contract-and-openapi-sync
description: مزامنة وحوكمة عقود واجهات برمجة التطبيقات (API Contract & TypeScript Sync). تضمن التطابق التام بين استجابات خادم Express/Node.js ونماذج الواجهة الأمامية React TypeScript، ومنع أخطاء Types Mismatch وتوثيق المسارات تلقائياً.
---

# مهارة حوكمة ومزامنة عقود واجهات التطبيقات (API Contract & Sync)

## 1. طبيعة عمل المهارة
* **نمط التشغيل:** **تلقائي (Autonomous)** عند بناء أو تعديل أي مسار API أو واجهة استقبال بيانات في الواجهة الأمامية.
* **الهدف:** القضاء النهائي على أخطاء عدم تطابق الحقول (`undefined` properties) بين الباك-إند والفرونت-إند.

---

## 2. معايير هندسة العقود (Contract Engineering)
1. **التعريف الموحد للأنواع (Shared DTOs & Interfaces):**
   - كل كائن يُرجع من مسار API (مثل `TicketDTO`, `UserSession`, `SystemConfig`) يجب أن يكون له تعريف TypeScript موحد أو مستنتج مباشرة من Prisma (`type Ticket = Prisma.TicketGetPayload<...>`).
2. **التحقق من صحة المدخلات بالـ Schemas (Zod Validation):**
   - كافة الحمولات المستقبلة في الباك-إند يجب أن تُفحص عبر Zod Schema للتحقق من أنواع الحقول، أطوال النصوص، وصيغ التواريخ قبل معالجتها.
3. **توحيد بنية الاستجابة (Standard JSON Response):**
   - كافة المسارات تلتزم بالهيكل المؤسسي الموحد:
     ```typescript
     {
       success: boolean;
       data?: T;
       error?: {
         code: string;
         message: string;
         details?: unknown;
       };
       meta?: {
         timestamp: string;
         page?: number;
         total?: number;
       }
     }
     ```

---

## 3. قائمة التحقق قبل التسليم (Checklist)
- [ ] هل تم تحديث استدعاءات `useQuery` / `useMutation` في الفرونت-إند لتعكس الأنواع الجديدة؟
- [ ] هل يتم التعامل مع حالات فشل الشبكة ورموز HTTP (400, 401, 403, 404, 500) بشكل سليم في الواجهة؟
- [ ] هل تم التحقق من خلو الاستجابة من الحقول الحساسة (مثل `passwordHash` أو المفاتيح السرية)؟
