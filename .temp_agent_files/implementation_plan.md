# ربط الواجهة الوظيفية وتطبيق نظام الصلاحيات

يهدف هذا التحديث إلى التخلص من البيانات الوهمية (Mock Data) في `HubContext.tsx` وربطها بشكل كامل بمسارات الواجهة الخلفية الفعلية، بالإضافة إلى تطبيق نظام صلاحيات النشر (Publishing Authority) المعتمد في `FunctionalController.ts`.

## User Review Required

> [!IMPORTANT]
> يرجى مراجعة الخطة واعتمادها قبل التنفيذ. التعديلات ستشمل الواجهة الأمامية والخلفية وسينتج عنها تغيير في طريقة جلب وعرض البيانات في الواجهة الوظيفية (Employee Hub).

## Open Questions

> [!WARNING]
> - في الواجهة الأمامية، يتم جمع المنشورات العادية والأخبار (News) وعرضها في `posts`. هل تفضل دمج مخرجات مسار الـ `/news` والـ `/posts` معاً في حالة `posts` داخل `HubContext` (مع تحويل الـ News إلى Object من نوع `Post`)، أم أنك تفضل فصلها إلى حالتين مختلفتين (States) بالرغم من أن الواجهة مصممة لاستخدام `posts` لعرض كليهما؟ سيتم حالياً دمجهم معاً وتنسيقهم حسب الواجهة.

## Proposed Changes

---

### Backend (FunctionalController.ts)

- تحديث دالة `createNews` للتحقق من وجود `departmentId` الخاص بالمستخدم في جدول `PublishingAuthority` والتأكد من أن `canPublishNews === true`. في حال عدم توفر الصلاحية سيتم إرجاع خطأ `403 Forbidden`.
- تحديث دالة `createChallenge` للتحقق من نفس الجدول والتأكد من أن `canPublishChallenges === true`. سيتم إرجاع `403` في حال عدم وجود صلاحية.
- التأكد من جلب بيانات كافية من خلال `getPosts` و `getChallenges` لتلبية احتياجات الواجهة الأمامية.

#### [MODIFY] [FunctionalController.ts](file:///c:/Users/majdi.alzarrouk/OneDrive%20-%20LITC/Desktop/المشاريع/v43_Production/src/backend/controllers/FunctionalController.ts)

---

### Frontend (HubContext.tsx)

- إزالة الثوابت الوهمية مثل `MOCK_POSTS` و `MOCK_CHALLENGES` والدوال المرتبطة بتوليدها.
- تهيئة المتغيرات `posts` و `challenges` لتكون مصفوفات فارغة افتراضياً `[]`.
- إنشاء دالة `fetchFunctionalData` داخل `useEffect` لجلب البيانات من المسارات التالية:
  - `/api/v1/functional/posts`
  - `/api/v1/functional/news`
  - `/api/v1/functional/challenges`
  - `/api/v1/functional/reels`
- صياغة وتوحيد (Mapping) البيانات الراجعة من الواجهة الخلفية لتتطابق مع الـ Types (مثل `Post` و `Challenge`) المستخدمة مسبقاً في `HubContext.tsx`.

#### [MODIFY] [HubContext.tsx](file:///c:/Users/majdi.alzarrouk/OneDrive%20-%20LITC/Desktop/المشاريع/v43_Production/src/functional_ui/context/HubContext.tsx)

## Verification Plan

### Automated Tests
- سيتم التأكد من بناء المشروع دون أية أخطاء (Zero Build Errors) باستخدام الأمر `npm run build` و `npx tsc --noEmit`.

### Manual Verification
- يمكن للمستخدم اختبار تسجيل دخول الموظف، ومحاولة نشر خبر رسمي (سيتم المنع إذا لم تتوفر الصلاحية)، وملاحظة أن البيانات الموجودة في الصفحة الرئيسية للتطبيق هي بيانات حقيقية قادمة من قاعدة البيانات.
