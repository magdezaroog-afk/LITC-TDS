---
name: performance-and-memory-profiling
description: رصد وتحسين الأداء ومنع تسريب الذاكرة (Performance & Memory Profiling) في تطبيقات الويب المؤسسية. إدارة دورة حياة WebSockets، التخلص من Event Listeners عند فك المكونات، تحسين إعادة التصيير في React، وضمان خفة واجهات العمليات.
---

# مهارة رصد الأداء ومنع تسريب الذاكرة (Performance & Memory Profiling)

## 1. طبيعة عمل المهارة
* **نمط التشغيل:** **تلقائي (Autonomous)** عند كتابة hooks أو اتصالات حية (WebSockets / Polling)، و**عند الطلب (On-Demand)** لتحليل كفاءة الشاشات بعد جلسات العمل الطويلة.
* **الهدف:** استقرار المتصفح والخادم بنسبة 100% دون أي تباطؤ أو استنزاف للذاكرة العشوائية (RAM).

---

## 2. معايير منع تسريب الذاكرة (Leak Prevention Rules)
1. **دورة حياة الاتصالات اللحظية (WebSocket / EventSource Lifecycle):**
   - كل اشتراك في قناة بيانات حية يجب أن يحتوي على دالة تنظيف صريحة (`cleanup function`) في `useEffect`:
     ```typescript
     useEffect(() => {
       const socket = initSocket();
       return () => {
         socket.disconnect(); // إغلاق صريح
       };
     }, []);
     ```
2. **إدارة مستمعي الأحداث (Event Listeners & Timers):**
   - أي `window.addEventListener` أو `setInterval` يجب تنظيفه فوراً في `return () => clearInterval(...)`.
3. **تحسين إعادة التصيير (React Re-renders):**
   - استخدام `useMemo` و `useCallback` للدوال والمصفوفات الممررة لمكونات الجداول والقوائم الكبيرة.
   - الاعتماد على التقطيع الافتراضي (Virtual Scrolling) في الجداول التي تتجاوز 100 صف.
4. **ميزانية الحزم البرمجية (Bundle Size & Code Splitting):**
   - استخدام التحميل الكسول (`React.lazy` و `Suspense`) للوحات الإدارة والشاشات الكبيرة غير المستخدمة في أول تحميل.

---

## 3. قائمة التحقق قبل الاعتماد (Checklist)
- [ ] هل تم فحص تبويب Memory في المتصفح والتأكد من هبوط الذاكرة بعد الانتقال بين الصفحات؟
- [ ] هل الحركات والانتقالات تعتمد حصراً على `transform` و `opacity` لتسريع المعالجة عبر كارت الشاشة (GPU)؟
- [ ] هل تم إيقاف أي Polling دوري عند عدم وجود المستخدم في التبويب النشط (`document.hidden`)؟
