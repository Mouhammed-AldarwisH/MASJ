-- =============================================
-- قاعدة بيانات نظام إدارة الحلقات القرآنية
-- Supabase (PostgreSQL)
-- =============================================
-- هذا الملف يحتوي على هيكل قاعدة البيانات الكامل
-- يمكن تنفيذه في Supabase SQL Editor
-- =============================================


-- =============================================
-- جدول المستخدمين (Users)
-- =============================================
-- هذا الجدول يخزن جميع المستخدمين في النظام
-- سواء كانوا مشرفين أو معلمين أو أولياء أمور

-- =============================================
-- جدول المجمعات (Complexes)
-- =============================================
-- هذا الجدول يمثل المجمعات أو المراكز التي قد تضم مساجداً وحلقات
CREATE TABLE Complexes (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,

    -- اسم المجمع
    complex_name TEXT NOT NULL,

    -- بريد مشرف المجمع (يستخدم للاتصال أو كمعلومة تسجيل)
    -- ملاحظة: يمكن لاحقاً ربط ذلك بمستخدم في جدول Users أو استخدام Supabase Auth
    complex_admin_email TEXT,

    -- اسم مستخدم مشرف المجمع (مخزن هنا لأغراض البساطة)
    complex_admin_username TEXT,

    -- كلمة مرور المشرف للمجتمع (حالياً نص للاختبار فقط - يجب تجزئتها قبل الإنتاج)
    complex_admin_password TEXT,

    -- هل تم التحقق من بريد المشرف أم لا (للتحقق من ملكية البريد)
    is_email_verified BOOLEAN DEFAULT false,

    -- هل اعتمد المسؤول المجمع رسميًا؟ (يقرر المشرف العام قبول المجمع أو عدم قبوله)
    admin_approved BOOLEAN DEFAULT false,

    -- هذا الحقل يخزن معرف المستخدم في نظام المصادقة (auth.uid()) لربط المجمع بمستخدم مشرفه
    -- يُستخدم لاحقاً في سياسات RLS للسماح للمشرف المُسجل فقط بإدارة مجمعه
    admin_auth_uid UUID,

    -- حالة قبول المجمع: pending (قيد الانتظار), accepted (مقبول), rejected (مرفوض)
    complex_status TEXT DEFAULT 'pending' CHECK (complex_status IN ('pending','accepted','rejected')),

    -- تاريخ إضافة المجمع
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE Users (
    -- المفتاح الأساسي - رقم تعريف فريد لكل مستخدم
    id SERIAL PRIMARY KEY,
    
    -- البريد الإلكتروني للمستخدم - يستخدم لتسجيل الدخول
    user_email TEXT UNIQUE NOT NULL,
    
    -- كلمة المرور المشفرة - لن نخزنها كنص عادي
    user_password TEXT NOT NULL,
    
    -- اسم المستخدم الكامل للعرض
    user_name TEXT NOT NULL,
    
    -- رقم الجوال للتواصل (اختياري)
    user_phone TEXT,
    
    -- دور المستخدم: supervisor (مشرف) / teacher (معلم) / parent (ولي أمر)
    -- هذا يحدد صلاحيات المستخدم وواجهته
    user_role TEXT NOT NULL CHECK (user_role IN ('supervisor', 'teacher', 'parent')),
    
    -- هذا العمود يربط المستخدم بالمجمع الذي يعمل أو يتبع له (اختياري)
    -- مثال: مشرف المجمع أو معلم تابع لمجمع معين
    complex_id INT REFERENCES Complexes(id) ON DELETE SET NULL,
    
    -- حالة الحساب: هل هو نشط أم معطل
    is_active BOOLEAN DEFAULT true,
    
    -- تاريخ إنشاء الحساب
    created_at TIMESTAMP DEFAULT NOW()
);

-- تعليق: نستخدم TEXT بدلاً من VARCHAR لأنها أكثر مرونة في PostgreSQL


-- =============================================
-- جدول المساجد (Mosques)
-- =============================================
-- يخزن معلومات المساجد التي تحتوي على حلقات

CREATE TABLE Mosques (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- اسم المسجد
    mosque_name TEXT NOT NULL,
    
    -- موقع المسجد (اختياري)
    mosque_location TEXT,
    
    -- تاريخ الإضافة
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول الحلقات (Halaqat)
-- =============================================
-- يخزن معلومات الحلقات القرآنية
-- كل حلقة تنتمي لمسجد واحد

CREATE TABLE Halaqat (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- اسم الحلقة (مثل: حلقة الشجعان)
    halqa_name TEXT NOT NULL,
    
    -- هذا العمود يربط الحلقة بالمسجد الذي تتبع له
    mosque_id INT REFERENCES Mosques(id) ON DELETE SET NULL,

    -- هذا العمود يربط الحلقة بالمجمع الذي تتبع له (اختياري)
    -- يتيح أن يكون لكل مجمع حلقاته الخاصة
    complex_id INT REFERENCES Complexes(id) ON DELETE SET NULL,
    
    -- وصف إضافي للحلقة (اختياري)
    halqa_description TEXT,
    
    -- تاريخ إنشاء الحلقة
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول ربط المعلمين بالحلقات (Teachers_Halaqat)
-- =============================================
-- جدول وسيط يربط المعلمين بالحلقات
-- لأن المعلم الواحد قد يدرّس في عدة حلقات
-- والحلقة الواحدة قد يدرّس فيها عدة معلمين

CREATE TABLE Teachers_Halaqat (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- هذا العمود يربط السجل بالمعلم
    teacher_id INT REFERENCES Users(id) ON DELETE CASCADE,
    
    -- هذا العمود يربط السجل بالحلقة
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    
    -- منع التكرار: لا يمكن ربط نفس المعلم بنفس الحلقة مرتين
    UNIQUE(teacher_id, halqa_id)
);


-- =============================================
-- جدول الطلاب (Students)
-- =============================================
-- يخزن معلومات الطلاب المسجلين في الحلقات

CREATE TABLE Students (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- اسم الطالب الكامل
    student_name TEXT NOT NULL,
    
    -- رقم التعريف (الرقم المميز للطالب في الحلقة)
    student_id_number TEXT,
    
    -- عمر الطالب (بالسنوات)
    student_age INT,
    
    -- هذا العمود يربط الطالب بالحلقة التي يدرس فيها
    halqa_id INT REFERENCES Halaqat(id) ON DELETE SET NULL,
    
    -- هذا العمود يربط الطالب بولي أمره
    -- نستخدمه لإظهار بيانات الطالب لولي الأمر
    parent_id INT REFERENCES Users(id) ON DELETE SET NULL,
    
    -- اسم ولي الأمر (للعرض السريع)
    parent_name TEXT,
    
    -- رقم جوال ولي الأمر للتواصل
    parent_phone TEXT,
    
    -- حالة الطالب: نشط أم منسحب
    is_active BOOLEAN DEFAULT true,
    
    -- تاريخ تسجيل الطالب
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول سجلات الحضور (Attendance_Records)
-- =============================================
-- يخزن حضور وغياب الطلاب يومياً

CREATE TABLE Attendance_Records (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- هذا العمود يربط السجل بالطالب
    student_id INT REFERENCES Students(id) ON DELETE CASCADE,
    
    -- هذا العمود يربط السجل بالحلقة
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    
    -- تاريخ الحضور (بدون وقت)
    attendance_date DATE NOT NULL,
    
    -- حالة الحضور: present (حاضر) / absent (غائب) / late (متأخر) / excused (مستأذن)
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
    
    -- ملاحظات إضافية (مثل: سبب الغياب)
    notes TEXT,
    
    -- هذا العمود يربط السجل بالمعلم الذي سجّل الحضور
    recorded_by INT REFERENCES Users(id) ON DELETE SET NULL,
    
    -- وقت تسجيل الحضور
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- منع التكرار: لا يمكن تسجيل حضور نفس الطالب مرتين في نفس اليوم
    UNIQUE(student_id, attendance_date)
);


-- =============================================
-- جدول سور القرآن (Surahs)
-- =============================================
-- جدول مرجعي يحتوي على أسماء وأرقام السور
-- يسهّل عملية اختيار السورة في التسميع

CREATE TABLE Surahs (
    -- رقم السورة (1-114)
    id INT PRIMARY KEY,
    
    -- اسم السورة بالعربية
    surah_name TEXT NOT NULL,
    
    -- عدد آيات السورة
    ayahs_count INT NOT NULL
);


-- =============================================
-- جدول سجلات التسميع (Recitation_Records)
-- =============================================
-- يخزن سجلات تسميع الطلاب للقرآن

CREATE TABLE Recitation_Records (
    -- المفتاح الأساسي
    id SERIAL PRIMARY KEY,
    
    -- هذا العمود يربط السجل بالطالب
    student_id INT REFERENCES Students(id) ON DELETE CASCADE,
    
    -- هذا العمود يربط السجل بالحلقة
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    
    -- نوع التسميع: daily-wird (ورد يومي) / small-review (مراجعة صغرى) / big-review (مراجعة كبرى)
    recitation_type TEXT NOT NULL CHECK (recitation_type IN ('daily-wird', 'small-review', 'big-review')),
    
    -- تاريخ التسميع
    recitation_date DATE NOT NULL,
    
    -- === بيانات البداية ===
    -- رقم سورة البداية
    start_surah_id INT REFERENCES Surahs(id),
    
    -- رقم آية البداية
    start_ayah INT,
    
    -- رقم صفحة البداية (اختياري)
    start_page INT,
    
    -- === بيانات النهاية ===
    -- رقم سورة النهاية
    end_surah_id INT REFERENCES Surahs(id),
    
    -- رقم آية النهاية
    end_ayah INT,
    
    -- رقم صفحة النهاية (اختياري)
    end_page INT,
    
    -- === التقييم ===
    -- الدرجة (من 0 إلى 20)
    grade INT CHECK (grade >= 0 AND grade <= 20),
    
    -- عدد الأخطاء
    errors_count INT DEFAULT 0,
    
    -- ملاحظات المعلم
    notes TEXT,
    
    -- هذا العمود يربط السجل بالمعلم الذي سجّل التسميع
    recorded_by INT REFERENCES Users(id) ON DELETE SET NULL,
    
    -- وقت التسجيل
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- إدخال البيانات الأولية
-- =============================================

-- إدخال سور القرآن الكريم
INSERT INTO Surahs (id, surah_name, ayahs_count) VALUES
(1, 'الفاتحة', 7),
(2, 'البقرة', 286),
(3, 'آل عمران', 200),
(4, 'النساء', 176),
(5, 'المائدة', 120),
(6, 'الأنعام', 165),
(7, 'الأعراف', 206),
(8, 'الأنفال', 75),
(9, 'التوبة', 129),
(10, 'يونس', 109),
(11, 'هود', 123),
(12, 'يوسف', 111),
(13, 'الرعد', 43),
(14, 'إبراهيم', 52),
(15, 'الحجر', 99),
(16, 'النحل', 128),
(17, 'الإسراء', 111),
(18, 'الكهف', 110),
(19, 'مريم', 98),
(20, 'طه', 135),
(21, 'الأنبياء', 112),
(22, 'الحج', 78),
(23, 'المؤمنون', 118),
(24, 'النور', 64),
(25, 'الفرقان', 77),
(26, 'الشعراء', 227),
(27, 'النمل', 93),
(28, 'القصص', 88),
(29, 'العنكبوت', 69),
(30, 'الروم', 60),
(31, 'لقمان', 34),
(32, 'السجدة', 30),
(33, 'الأحزاب', 73),
(34, 'سبأ', 54),
(35, 'فاطر', 45),
(36, 'يس', 83),
(37, 'الصافات', 182),
(38, 'ص', 88),
(39, 'الزمر', 75),
(40, 'غافر', 85),
(41, 'فصلت', 54),
(42, 'الشورى', 53),
(43, 'الزخرف', 89),
(44, 'الدخان', 59),
(45, 'الجاثية', 37),
(46, 'الأحقاف', 35),
(47, 'محمد', 38),
(48, 'الفتح', 29),
(49, 'الحجرات', 18),
(50, 'ق', 45),
(51, 'الذاريات', 60),
(52, 'الطور', 49),
(53, 'النجم', 62),
(54, 'القمر', 55),
(55, 'الرحمن', 78),
(56, 'الواقعة', 96),
(57, 'الحديد', 29),
(58, 'المجادلة', 22),
(59, 'الحشر', 24),
(60, 'الممتحنة', 13),
(61, 'الصف', 14),
(62, 'الجمعة', 11),
(63, 'المنافقون', 11),
(64, 'التغابن', 18),
(65, 'الطلاق', 12),
(66, 'التحريم', 12),
(67, 'الملك', 30),
(68, 'القلم', 52),
(69, 'الحاقة', 52),
(70, 'المعارج', 44),
(71, 'نوح', 28),
(72, 'الجن', 28),
(73, 'المزمل', 20),
(74, 'المدثر', 56),
(75, 'القيامة', 40),
(76, 'الإنسان', 31),
(77, 'المرسلات', 50),
(78, 'النبأ', 40),
(79, 'النازعات', 46),
(80, 'عبس', 42),
(81, 'التكوير', 29),
(82, 'الانفطار', 19),
(83, 'المطففين', 36),
(84, 'الانشقاق', 25),
(85, 'البروج', 22),
(86, 'الطارق', 17),
(87, 'الأعلى', 19),
(88, 'الغاشية', 26),
(89, 'الفجر', 30),
(90, 'البلد', 20),
(91, 'الشمس', 15),
(92, 'الليل', 21),
(93, 'الضحى', 11),
(94, 'الشرح', 8),
(95, 'التين', 8),
(96, 'العلق', 19),
(97, 'القدر', 5),
(98, 'البينة', 8),
(99, 'الزلزلة', 8),
(100, 'العاديات', 11),
(101, 'القارعة', 11),
(102, 'التكاثر', 8),
(103, 'العصر', 3),
(104, 'الهمزة', 9),
(105, 'الفيل', 5),
(106, 'قريش', 4),
(107, 'الماعون', 7),
(108, 'الكوثر', 3),
(109, 'الكافرون', 6),
(110, 'النصر', 3),
(111, 'المسد', 5),
(112, 'الإخلاص', 4),
(113, 'الفلق', 5),
(114, 'الناس', 6);


-- =============================================
-- إدخال بيانات تجريبية
-- =============================================

-- إدخال مسجد
INSERT INTO Mosques (mosque_name, mosque_location) VALUES
('جامع أُبي بن كعب', 'حي النور');

-- إدخال الحلقات
-- إدخال مجمع تجريبي
INSERT INTO Complexes (complex_name, complex_admin_email, complex_admin_username, complex_admin_password, complex_status) VALUES
('مجمع النور', 'admin@complex.com', 'complex_admin', 'complex123', 'accepted');

-- إدخال الحلقات (مع ربطها بالمجمع رقم 1)
INSERT INTO Halaqat (halqa_name, mosque_id, complex_id, halqa_description) VALUES
('حلقة الشجعان', 1, 1, 'حلقة للمبتدئين'),
('حلقة المتميزين', 1, 1, 'حلقة للمتوسطين'),
('حلقة النور', 1, 1, 'حلقة للمتقدمين');

-- إدخال المستخدمين (كلمات المرور للتجربة فقط - يجب تشفيرها في الإنتاج)
INSERT INTO Users (user_email, user_password, user_name, user_phone, user_role) VALUES
('admin@masjed.com', 'admin123', 'المشرف العام', '0500000000', 'supervisor'),
('teacher@masjed.com', 'teacher123', 'الأستاذ أحمد', '0511111111', 'teacher'),
('teacher2@masjed.com', 'teacher123', 'الأستاذ محمد', '0522222222', 'teacher'),
('parent1@email.com', 'parent123', 'أبو أحمد', '0533333333', 'parent'),
('parent2@email.com', 'parent123', 'أبو خالد', '0544444444', 'parent');

-- ربط المعلمين بالحلقات
-- المعلم الأول (id=2) يدرّس في حلقة الشجعان والمتميزين
INSERT INTO Teachers_Halaqat (teacher_id, halqa_id) VALUES
(2, 1),
(2, 2);

-- المعلم الثاني (id=3) يدرّس في حلقة النور
INSERT INTO Teachers_Halaqat (teacher_id, halqa_id) VALUES
(3, 3);

-- إدخال طلاب تجريبيين
INSERT INTO Students (student_name, student_id_number, student_age, halqa_id, parent_id, parent_name, parent_phone) VALUES
('أحمد محمد العلي', 'STD001', 10, 1, 4, 'أبو أحمد', '0533333333'),
('خالد عبدالله السعيد', 'STD002', 11, 1, 4, 'أبو أحمد', '0533333333'),
('عمر فهد الراشد', 'STD003', 9, 1, 5, 'أبو خالد', '0544444444'),
('يوسف سعد المالكي', 'STD004', 12, 2, 4, 'أبو أحمد', '0533333333'),
('محمد علي الغامدي', 'STD005', 10, 2, 5, 'أبو خالد', '0544444444'),
('عبدالرحمن خالد', 'STD006', 11, 2, NULL, 'ولي أمر عبدالرحمن', '0555555555'),
('سعود ناصر العتيبي', 'STD007', 13, 3, NULL, 'ولي أمر سعود', '0566666666'),
('فيصل محمد الدوسري', 'STD008', 12, 3, NULL, 'ولي أمر فيصل', '0577777777'),
('تركي سلمان القحطاني', 'STD009', 14, 3, NULL, 'ولي أمر تركي', '0588888888'),
('نايف عبدالعزيز', 'STD010', 11, 3, NULL, 'ولي أمر نايف', '0599999999');

-- إدخال سجلات حضور تجريبية (لآخر أسبوع)
INSERT INTO Attendance_Records (student_id, halqa_id, attendance_date, attendance_status, recorded_by) VALUES
-- اليوم (نفترض أنه 2026-01-19)
(1, 1, '2026-01-19', 'present', 2),
(2, 1, '2026-01-19', 'present', 2),
(3, 1, '2026-01-19', 'late', 2),
(4, 2, '2026-01-19', 'present', 2),
(5, 2, '2026-01-19', 'absent', 2),
-- أمس
(1, 1, '2026-01-18', 'present', 2),
(2, 1, '2026-01-18', 'present', 2),
(3, 1, '2026-01-18', 'present', 2),
(4, 2, '2026-01-18', 'excused', 2),
(5, 2, '2026-01-18', 'present', 2);

-- إدخال سجلات تسميع تجريبية
INSERT INTO Recitation_Records (student_id, halqa_id, recitation_type, recitation_date, start_surah_id, start_ayah, start_page, end_surah_id, end_ayah, end_page, grade, errors_count, recorded_by) VALUES
(1, 1, 'daily-wird', '2026-01-19', 78, 1, 582, 78, 40, 583, 18, 2, 2),
(2, 1, 'daily-wird', '2026-01-19', 67, 1, 562, 67, 15, 563, 15, 3, 2),
(4, 2, 'small-review', '2026-01-19', 1, 1, 1, 2, 20, 4, 19, 1, 2),
(1, 1, 'big-review', '2026-01-18', 78, 1, 582, 80, 42, 585, 17, 4, 2);


-- =============================================
-- إنشاء الفهارس (Indexes)
-- =============================================
-- الفهارس تسرّع عمليات البحث والاستعلام

-- فهرس للبحث السريع عن الطلاب حسب الحلقة
CREATE INDEX idx_students_halqa ON Students(halqa_id);

-- فهرس للبحث السريع عن الطلاب حسب ولي الأمر
CREATE INDEX idx_students_parent ON Students(parent_id);

-- فهرس للبحث السريع في سجلات الحضور حسب التاريخ
CREATE INDEX idx_attendance_date ON Attendance_Records(attendance_date);

-- فهرس للبحث السريع في سجلات الحضور حسب الطالب
CREATE INDEX idx_attendance_student ON Attendance_Records(student_id);

-- فهرس للبحث السريع في سجلات التسميع حسب التاريخ
CREATE INDEX idx_recitation_date ON Recitation_Records(recitation_date);

-- فهرس للبحث السريع في سجلات التسميع حسب الطالب
CREATE INDEX idx_recitation_student ON Recitation_Records(student_id);


-- =============================================
-- تفعيل Row Level Security (RLS) - اختياري
-- =============================================
-- هذا يضيف طبقة أمان إضافية في Supabase
-- يمكنك تفعيله لاحقاً حسب الحاجة

-- --------------------------------------------------
-- تفعيل RLS على جميع الجداول
-- --------------------------------------------------
-- تفعيل RLS يمنع الوصول إلى الصفوف ما لم تُكتب سياسات صريحة
-- لذا نفعّل RLS ثم نضيف سياسات لكل جدول أو سياسات عامة للمصادَق عليهم

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE halaqat ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers_halaqat ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recitation_records ENABLE ROW LEVEL SECURITY;


-- =============================================
-- سياسات أمان (Policies)
-- =============================================

-- 1) سياسات لجدول `complexes`
-- السبب: نريد أن يتمكن مشرف المجمع (الذي يمتلك auth.uid()) من إنشاء/قراءة/تعديل/حذف بيانات مجمعه
-- لذلك نسمح فقط للـ auth.uid() المطابق لحقل `admin_auth_uid` بالتعامل مع صفوف مجمعه.

-- السماح بقراءة/تعديل/حذف/إدراج من قبل مشرف المجمع نفسه فقط
CREATE POLICY "complex_owner_full_access" ON complexes
    FOR ALL
    USING (admin_auth_uid = auth.uid())
    WITH CHECK (admin_auth_uid = auth.uid());


-- 2) سياسات لجدول `halaqat`
-- السبب: نريد السماح بالقراءة فقط للحلقات التي تنتمي لمجمع معتمد (`admin_approved = true`)
-- الشرط يقرأ حالة المجمع المرتبط بالحلقة عبر `complex_id`.
CREATE POLICY "read_halaqat_if_complex_approved" ON halaqat
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM complexes c
            WHERE c.id = halaqat.complex_id AND c.admin_approved = true
        )
    );


-- 3) سياسات لجدول `students`
-- السبب: نسمح بالقراءة فقط للطلاب إذا كانت الحلقة التي ينتمون إليها تتبع مجمعاً معتمداً
-- نستخدم علاقة عبر جدول `halaqat` للوصول إلى `complex_id` ثم نتحقق من `admin_approved`.
CREATE POLICY "read_students_if_complex_approved" ON students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM halaqat h JOIN complexes c ON h.complex_id = c.id
            WHERE h.id = students.halqa_id AND c.admin_approved = true
        )
    );


-- 4) سياسات مساعدة عامة لقراءة الجداول الأخرى للمستخدمين المصادقين
-- السبب: بعد تفعيل RLS، من الضروري السماح لمستخدمي النظام المصادقين بالقراءة الأساسية
-- هذه السياسات بسيطة وتسمح للمستخدمين الذين لديهم `auth.uid()` بالقراءة.

CREATE POLICY "auth_read_users" ON users
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_mosques" ON mosques
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_teachers_halaqat" ON teachers_halaqat
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_attendance" ON attendance_records
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_recitation" ON recitation_records
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_read_surahs" ON surahs
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ملاحظة:
-- يمكن لاحقاً تضييق هذه السياسات (مثل السماح للمعلمين فقط برؤية حضور حلقاتهم)
-- أو إضافة سياسات INSERT/UPDATE/DELETE دقيقة لكل جدول حسب متطلبات الأدوار.
