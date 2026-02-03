# دليل إعداد قاعدة بيانات Supabase

## نظام إدارة الحلقات القرآنية (MAS)

هذا الدليل يشرح كيفية ربط الموقع بقاعدة بيانات Supabase.

---

## الخطوة 1: إنشاء حساب ومشروع في Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساباً جديداً (مجاني)
3. أنشئ مشروعاً جديداً (New Project)
4. اختر:
   - اسم المشروع
   - كلمة مرور قوية لقاعدة البيانات
   - المنطقة الأقرب لك (مثلاً: Frankfurt)
5. انتظر دقيقة أو دقيقتين حتى يجهز المشروع

---

## الخطوة 2: إنشاء الجداول

1. من القائمة الجانبية، اضغط على **SQL Editor**
2. اضغط على **New query**
3. افتح ملف `database/schema.sql` من مجلد المشروع
4. انسخ كل محتوى الملف والصقه في SQL Editor
5. اضغط على زر **Run** (أو Ctrl+Enter)
6. يجب أن ترى رسالة "Success. No rows returned"

---

## الخطوة 3: الحصول على مفاتيح الاتصال

1. من القائمة الجانبية، اضغط على **Settings** (أيقونة الترس)
2. اضغط على **API**
3. ستجد:
   - **Project URL**: رابط المشروع
   - **anon public key**: المفتاح العام

---

## الخطوة 4: ربط الموقع بقاعدة البيانات

1. افتح ملف `js/supabase-db.js`
2. غيّر القيم في أعلى الملف:

```javascript
var SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
var SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

استبدل:
- `YOUR_PROJECT_ID` بـ Project URL من Supabase
- `YOUR_ANON_KEY_HERE` بـ anon public key من Supabase

---

## الخطوة 5: إضافة مكتبة Supabase للصفحات

أضف هذا السطر في كل ملف HTML قبل إغلاق `</body>`:

```html
<!-- مكتبة Supabase للاتصال بقاعدة البيانات -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- ملف إعدادات قاعدة البيانات -->
<script src="js/supabase-db.js"></script>
```

**ملاحظة:** يجب أن يكون هذا السطر **قبل** ملف JavaScript الخاص بالصفحة.

---

## هيكل قاعدة البيانات

### الجداول الرئيسية:

| الجدول | الوصف |
|--------|-------|
| `Users` | المستخدمون (مشرفين، معلمين، أولياء أمور) |
| `Mosques` | المساجد |
| `Halaqat` | الحلقات القرآنية |
| `Students` | الطلاب |
| `Teachers_Halaqat` | ربط المعلمين بالحلقات |
| `Attendance_Records` | سجلات الحضور |
| `Recitation_Records` | سجلات التسميع |
| `Surahs` | سور القرآن (جدول مرجعي) |
| `Complexes` | المجمعات / المراكز التي تضم حلقات ومساجد |

### العلاقات:

```
Users ─────┬───────────────── Teachers_Halaqat
           │                        │
           │                        │
           ▼                  ▼
Complexes ──┬──────── Users ─────┬───────────────── Teachers_Halaqat
            │                  │
            │                  │
            ▼                  ▼
Mosques ── Halaqat ─────────────────┤
           │                        │
           │                        │
           ▼                        │
        Students ───────────────────┤
           │                        │
           │                        │
           ▼                        ▼
    Attendance_Records       Recitation_Records
```

---

## بيانات تسجيل الدخول التجريبية

| البريد الإلكتروني | كلمة المرور | الدور |
|------------------|-------------|-------|
| admin@masjed.com | admin123 | مشرف |
| teacher@masjed.com | teacher123 | معلم |
| parent1@email.com | parent123 | ولي أمر |

---

## استخدام الموقع بدون قاعدة بيانات

الموقع يعمل بشكل كامل بدون قاعدة بيانات باستخدام `localStorage`.
البيانات تُخزّن في المتصفح محلياً.

إذا لم تُعدّ قاعدة البيانات:
- سيستخدم الموقع البيانات الوهمية المدمجة
- البيانات تُحفظ في المتصفح فقط
- ستُفقد البيانات عند مسح ذاكرة المتصفح

---

## الدوال المتاحة في SupabaseDB

```javascript
// المصادقة
SupabaseDB.login(email, password)

// المستخدمين
SupabaseDB.getUsers(role)
SupabaseDB.addUser(userData)

// الحلقات
SupabaseDB.getHalaqat()
SupabaseDB.getTeacherHalaqat(teacherId)

// الطلاب
SupabaseDB.getStudents(halqaId)
SupabaseDB.addStudent(studentData)
SupabaseDB.deleteStudent(studentId)

// الحضور
SupabaseDB.saveAttendance(attendanceData, recordedBy)
SupabaseDB.getStudentAttendance(studentId, startDate, endDate)

// التسميع
SupabaseDB.getSurahs()
SupabaseDB.saveRecitation(recitationData, recordedBy)
SupabaseDB.getStudentRecitations(studentId, date)

// الإحصائيات
SupabaseDB.getSupervisorStats()
```

---

## حل المشاكل الشائعة

### الخطأ: "مكتبة Supabase غير موجودة"
- تأكد من إضافة سطر `<script>` لمكتبة Supabase في HTML

### الخطأ: "تنبيه: يرجى تحديث إعدادات Supabase"
- غيّر قيم `SUPABASE_URL` و `SUPABASE_ANON_KEY` في `supabase-db.js`

### البيانات لا تُحفظ
- تأكد من تنفيذ ملف `schema.sql` في Supabase
- تأكد من صحة المفاتيح

### تسجيل الدخول لا يعمل
- تأكد من وجود المستخدم في جدول `Users`
- تأكد من أن `is_active = true`

---

## الأمان

**تنبيه:** الإعداد الحالي مناسب للتطوير والتجربة فقط.

للإنتاج، يُنصح بـ:
1. تفعيل Row Level Security (RLS)
2. استخدام Supabase Auth للمصادقة
3. تشفير كلمات المرور (حالياً مخزنة كنص)
4. إضافة سياسات أمان للجداول
