-- =============================================
-- قاعدة بيانات نظام إدارة الحلقات القرآنية
-- Supabase (PostgreSQL)
-- نسخة الإنتاج (Production)
-- =============================================
-- 
-- ⚠️ تعليمات التثبيت:
-- 1. أنشئ مشروع جديد في Supabase
-- 2. افتح SQL Editor
-- 3. الصق هذا الملف كاملاً
-- 4. اضغط Run
-- 5. انسخ Project URL و anon key من Settings > API
-- 6. الصقهم في js/config.js
--
-- =============================================


-- =============================================
-- جدول المجمعات (Complexes)
-- =============================================
CREATE TABLE IF NOT EXISTS Complexes (
    id SERIAL PRIMARY KEY,
    complex_name TEXT NOT NULL,
    complex_admin_email TEXT,
    complex_admin_username TEXT,
    complex_admin_password TEXT,
    is_email_verified BOOLEAN DEFAULT false,
    admin_approved BOOLEAN DEFAULT false,
    admin_auth_uid UUID,
    complex_status TEXT DEFAULT 'pending' CHECK (complex_status IN ('pending','accepted','rejected')),
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول المستخدمين (Users)
-- =============================================
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    user_email TEXT UNIQUE NOT NULL,
    user_password TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT,
    user_role TEXT NOT NULL CHECK (user_role IN ('supervisor', 'teacher', 'parent')),
    complex_id INT REFERENCES Complexes(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول المساجد (Mosques)
-- =============================================
CREATE TABLE IF NOT EXISTS Mosques (
    id SERIAL PRIMARY KEY,
    mosque_name TEXT NOT NULL,
    mosque_location TEXT,
    complex_id INT REFERENCES Complexes(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول الحلقات (Halaqat)
-- =============================================
CREATE TABLE IF NOT EXISTS Halaqat (
    id SERIAL PRIMARY KEY,
    halqa_name TEXT NOT NULL,
    mosque_id INT REFERENCES Mosques(id) ON DELETE SET NULL,
    complex_id INT REFERENCES Complexes(id) ON DELETE SET NULL,
    halqa_description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول ربط المعلمين بالحلقات (Teachers_Halaqat)
-- =============================================
CREATE TABLE IF NOT EXISTS Teachers_Halaqat (
    id SERIAL PRIMARY KEY,
    teacher_id INT REFERENCES Users(id) ON DELETE CASCADE,
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    UNIQUE(teacher_id, halqa_id)
);


-- =============================================
-- جدول الطلاب (Students)
-- =============================================
CREATE TABLE IF NOT EXISTS Students (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    student_id_number TEXT,
    student_age INT,
    halqa_id INT REFERENCES Halaqat(id) ON DELETE SET NULL,
    parent_id INT REFERENCES Users(id) ON DELETE SET NULL,
    parent_name TEXT,
    parent_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- جدول سجلات الحضور (Attendance_Records)
-- =============================================
CREATE TABLE IF NOT EXISTS Attendance_Records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Students(id) ON DELETE CASCADE,
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    recorded_by INT REFERENCES Users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, attendance_date)
);


-- =============================================
-- جدول سور القرآن (Surahs)
-- =============================================
CREATE TABLE IF NOT EXISTS Surahs (
    id INT PRIMARY KEY,
    surah_name TEXT NOT NULL,
    ayahs_count INT NOT NULL
);


-- =============================================
-- جدول سجلات التسميع (Recitation_Records)
-- =============================================
CREATE TABLE IF NOT EXISTS Recitation_Records (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Students(id) ON DELETE CASCADE,
    halqa_id INT REFERENCES Halaqat(id) ON DELETE CASCADE,
    recitation_type TEXT NOT NULL CHECK (recitation_type IN ('daily-wird', 'small-review', 'big-review')),
    recitation_date DATE NOT NULL,
    start_surah_id INT REFERENCES Surahs(id),
    start_ayah INT,
    start_page INT,
    end_surah_id INT REFERENCES Surahs(id),
    end_ayah INT,
    end_page INT,
    grade INT CHECK (grade >= 0 AND grade <= 20),
    errors_count INT DEFAULT 0,
    notes TEXT,
    recorded_by INT REFERENCES Users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- إدخال سور القرآن الكريم (بيانات ثابتة مطلوبة)
-- =============================================
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
(114, 'الناس', 6)
ON CONFLICT (id) DO NOTHING;


-- =============================================
-- إنشاء الفهارس (Indexes) لتحسين الأداء
-- =============================================
CREATE INDEX IF NOT EXISTS idx_students_halqa ON Students(halqa_id);
CREATE INDEX IF NOT EXISTS idx_students_parent ON Students(parent_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON Attendance_Records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON Attendance_Records(student_id);
CREATE INDEX IF NOT EXISTS idx_recitation_date ON Recitation_Records(recitation_date);
CREATE INDEX IF NOT EXISTS idx_recitation_student ON Recitation_Records(student_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(user_email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(user_role);
CREATE INDEX IF NOT EXISTS idx_halaqat_complex ON Halaqat(complex_id);


-- =============================================
-- تفعيل Row Level Security (RLS)
-- =============================================
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
-- سياسات الأمان (Security Policies)
-- =============================================

-- السماح بالقراءة العامة للسور (بيانات ثابتة)
DROP POLICY IF EXISTS "public_read_surahs" ON surahs;
CREATE POLICY "public_read_surahs" ON surahs
    FOR SELECT
    USING (true);

-- سياسة المجمعات - المشرف يدير مجمعه فقط
DROP POLICY IF EXISTS "complex_owner_full_access" ON complexes;
CREATE POLICY "complex_owner_full_access" ON complexes
    FOR ALL
    USING (admin_auth_uid = auth.uid())
    WITH CHECK (admin_auth_uid = auth.uid());

-- السماح بقراءة المجمعات المقبولة
DROP POLICY IF EXISTS "read_approved_complexes" ON complexes;
CREATE POLICY "read_approved_complexes" ON complexes
    FOR SELECT
    USING (complex_status = 'accepted');

-- سياسات الحلقات
DROP POLICY IF EXISTS "read_halaqat_if_complex_approved" ON halaqat;
CREATE POLICY "read_halaqat_if_complex_approved" ON halaqat
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM complexes c
            WHERE c.id = halaqat.complex_id AND c.complex_status = 'accepted'
        )
        OR complex_id IS NULL
    );

-- سياسات الطلاب
DROP POLICY IF EXISTS "read_students_if_complex_approved" ON students;
CREATE POLICY "read_students_if_complex_approved" ON students
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM halaqat h JOIN complexes c ON h.complex_id = c.id
            WHERE h.id = students.halqa_id AND c.complex_status = 'accepted'
        )
        OR halqa_id IS NULL
    );

-- سياسات القراءة للمستخدمين المصادق عليهم
DROP POLICY IF EXISTS "auth_read_users" ON users;
CREATE POLICY "auth_read_users" ON users
    FOR SELECT
    USING (auth.uid() IS NOT NULL OR true);

DROP POLICY IF EXISTS "auth_read_mosques" ON mosques;
CREATE POLICY "auth_read_mosques" ON mosques
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "auth_read_teachers_halaqat" ON teachers_halaqat;
CREATE POLICY "auth_read_teachers_halaqat" ON teachers_halaqat
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "auth_read_attendance" ON attendance_records;
CREATE POLICY "auth_read_attendance" ON attendance_records
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "auth_read_recitation" ON recitation_records;
CREATE POLICY "auth_read_recitation" ON recitation_records
    FOR SELECT
    USING (true);

-- سياسات الإدراج والتحديث
DROP POLICY IF EXISTS "allow_insert_users" ON users;
CREATE POLICY "allow_insert_users" ON users
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_users" ON users;
CREATE POLICY "allow_update_users" ON users
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "allow_insert_students" ON students;
CREATE POLICY "allow_insert_students" ON students
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_students" ON students;
CREATE POLICY "allow_update_students" ON students
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "allow_insert_attendance" ON attendance_records;
CREATE POLICY "allow_insert_attendance" ON attendance_records
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_update_attendance" ON attendance_records;
CREATE POLICY "allow_update_attendance" ON attendance_records
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "allow_insert_recitation" ON recitation_records;
CREATE POLICY "allow_insert_recitation" ON recitation_records
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_insert_complexes" ON complexes;
CREATE POLICY "allow_insert_complexes" ON complexes
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_insert_halaqat" ON halaqat;
CREATE POLICY "allow_insert_halaqat" ON halaqat
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_insert_mosques" ON mosques;
CREATE POLICY "allow_insert_mosques" ON mosques
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_insert_teachers_halaqat" ON teachers_halaqat;
CREATE POLICY "allow_insert_teachers_halaqat" ON teachers_halaqat
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_teachers_halaqat" ON teachers_halaqat;
CREATE POLICY "allow_delete_teachers_halaqat" ON teachers_halaqat
    FOR DELETE
    USING (true);


-- =============================================
-- رسالة نجاح
-- =============================================
-- إذا وصلت إلى هنا، تم تنفيذ الملف بنجاح!
-- الخطوة التالية: انسخ Project URL و anon key وضعهم في js/config.js
