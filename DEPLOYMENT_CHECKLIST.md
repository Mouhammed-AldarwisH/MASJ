# قائمة التحقق قبل النشر - MAS
# Deployment Checklist

<div dir="rtl">

## ✅ قائمة التحقق للنشر

استخدم هذه القائمة للتأكد من جاهزية التطبيق للنشر.

---

### 1️⃣ قاعدة البيانات (Supabase)

- [ ] إنشاء مشروع جديد في Supabase
- [ ] تنفيذ `database/schema-production.sql` في SQL Editor
- [ ] التحقق من إنشاء جميع الجداول بنجاح
- [ ] التحقق من تفعيل RLS على جميع الجداول
- [ ] نسخ Project URL
- [ ] نسخ anon public key

---

### 2️⃣ ملف الإعدادات (js/config.js)

- [ ] تحديث `SUPABASE_URL` برابط المشروع
- [ ] تحديث `SUPABASE_ANON_KEY` بالمفتاح
- [ ] تغيير `IS_DEVELOPMENT` إلى `false`
- [ ] تغيير `ENABLE_LOGGING` إلى `false`

```javascript
// تأكد من أن الإعدادات تبدو هكذا:
IS_DEVELOPMENT: false,
ENABLE_LOGGING: false,
SUPABASE_URL: 'https://xxxxx.supabase.co',  // رابط حقيقي
SUPABASE_ANON_KEY: 'eyJhbGc...',             // مفتاح حقيقي
```

---

### 3️⃣ الملفات والمجلدات

الملفات المطلوبة للرفع:

```
✓ index.html
✓ login.html
✓ login.js
✓ login.css
✓ create-complex.html
✓ create-complex.js
✓ dashboard.html
✓ dashboard.js
✓ dashboard.css
✓ supervisor-dashboard.html
✓ supervisor-dashboard.js
✓ supervisor-dashboard.css
✓ parent-dashboard.html
✓ parent-dashboard.js
✓ parent-dashboard.css
✓ students.html
✓ students.js
✓ students.css
✓ teachers.html
✓ teachers.js
✓ teachers.css
✓ halaqat.html
✓ halaqat.js
✓ halaqa-details.html
✓ halaqa-details.js
✓ attendance.html
✓ attendance.js
✓ attendance.css
✓ recitation.html
✓ recitation.js
✓ recitation.css
✓ student-details.html
✓ student-details.js
✓ student-details.css
✓ index.css
✓ manifest.json
✓ js/config.js        ← مهم جداً!
✓ js/supabase-db.js
```

---

### 4️⃣ اختبارات ما قبل النشر

- [ ] فتح الموقع في المتصفح
- [ ] التحقق من عدم ظهور "البيانات التجريبية"
- [ ] إنشاء مجمع جديد من صفحة `create-complex.html`
- [ ] تسجيل الدخول بالمستخدم الجديد
- [ ] إضافة معلم جديد
- [ ] إضافة حلقة جديدة
- [ ] إضافة طالب جديد
- [ ] تسجيل حضور
- [ ] تسجيل تسميع
- [ ] تسجيل الخروج وإعادة الدخول

---

### 5️⃣ الأمان

- [ ] عدم مشاركة ملف config.js مع أحد
- [ ] عدم رفع مجلد `database/` للاستضافة العامة (اختياري)
- [ ] التأكد من إزالة أي بيانات حساسة

---

### 6️⃣ ملاحظات الاستضافة

**للاستضافة المجانية (Netlify/Vercel/GitHub Pages):**
- ارفع جميع الملفات كما هي
- لا حاجة لـ server-side code

**للاستضافة التقليدية:**
- ارفع الملفات إلى مجلد `public_html` أو `www`
- تأكد من أن `index.html` هو الملف الرئيسي

---

### 7️⃣ بعد النشر

- [ ] اختبار جميع الصفحات
- [ ] اختبار على الهاتف المحمول
- [ ] إنشاء أول مستخدم مشرف
- [ ] تغيير كلمة المرور الأولية

---

## ⚠️ تحذيرات مهمة

1. **لا تنشر** ملف `schema.sql` (للتطوير فقط)
2. **احتفظ** بنسخة احتياطية من `config.js` محلياً
3. **غيّر** كلمات المرور الافتراضية فوراً
4. **راقب** لوحة تحكم Supabase للأنشطة المشبوهة

---

## 🔗 روابط مفيدة

- [Supabase Dashboard](https://app.supabase.com)
- [Netlify](https://netlify.com) - استضافة مجانية
- [Vercel](https://vercel.com) - استضافة مجانية
- [GitHub Pages](https://pages.github.com) - استضافة مجانية


 ملاحظات للنشر:
نشر Edge Function في Supabase Dashboard
تفعيل Email OTP في إعدادات Supabase Auth
تغيير IS_DEVELOPMENT: false في config.js


</div>
