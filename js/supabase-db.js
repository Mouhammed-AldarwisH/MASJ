/**
 * =============================================
 * ملف إعدادات وربط Supabase
 * نظام إدارة الحلقات القرآنية (MAS)
 * =============================================
 * 
 * ⚠️ للتهيئة:
 * 1. تأكد من تضمين js/config.js قبل هذا الملف
 * 2. قم بتحديث الإعدادات في js/config.js
 * 3. نفّذ database/schema-production.sql في Supabase
 */


// =============================================
// إعدادات الاتصال
// =============================================
// يتم جلب الإعدادات من ملف config.js

var SUPABASE_URL = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.SUPABASE_URL : 'https://YOUR_PROJECT_ID.supabase.co';
var SUPABASE_ANON_KEY = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.SUPABASE_ANON_KEY : 'YOUR_ANON_KEY_HERE';

// متغير لتخزين كائن Supabase
var supabaseClient = null;

// دالة سجل آمنة
function _log(message, data) {
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.IS_DEVELOPMENT && APP_CONFIG.ENABLE_LOGGING) {
        if (data) {
            console.log('[MAS]', message, data);
        } else {
            console.log('[MAS]', message);
        }
    }
}

// دالة خطأ آمنة
function _logError(context, error) {
    if (typeof APP_CONFIG !== 'undefined') {
        APP_CONFIG.logError(context, error);
    }
}


// =============================================
// دالة تهيئة Supabase
// =============================================
/**
 * هذه الدالة تُنشئ الاتصال بـ Supabase
 * يجب استدعاؤها مرة واحدة عند تحميل الصفحة
 * تعتمد على مكتبة Supabase JavaScript المضمنة في HTML
 */
function initSupabase() {
    // التحقق من وجود مكتبة Supabase
    if (typeof supabase === 'undefined') {
        _logError('initSupabase', 'مكتبة Supabase غير موجودة');
        return false;
    }
    
    // التحقق من الإعدادات
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') {
        _log('تنبيه: يرجى تحديث إعدادات Supabase في config.js');
        return false;
    }
    
    // إنشاء عميل Supabase
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    _log('تم الاتصال بـ Supabase بنجاح');
    return true;
}


// =============================================
// دوال المصادقة (Authentication)
// =============================================

/**
 * تسجيل الدخول بالبريد الإلكتروني وكلمة المرور
 * نستخدم جدول Users الخاص بنا بدلاً من Auth المدمج
 * لأنه أبسط للمبتدئين
 * 
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {object} - نتيجة تسجيل الدخول
 */
async function loginUser(email, password) {
    try {
        // البحث عن المستخدم في قاعدة البيانات
        // نطلب معلومات المجمع المرتبط بالمستخدم أيضاً (إن وجد)
        var result = await supabaseClient
            .from('users')
            .select(`*, complexes (complex_status)`)
            .eq('user_email', email.toLowerCase())
            .eq('user_password', password)
            .eq('is_active', true)
            .single();
        
        // التحقق من وجود خطأ
        if (result.error) {
            return {
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            };
        }
        
        // المستخدم موجود - لكن نمنع تسجيل الدخول إذا كان مرتبطاً بمجمع لم يتم قبوله
        var user = result.data;

        // إذا كان للمستخدم مجمع مرتبط، نتحقق من حالة المجمع
        if (user.complex_id) {
            var complexInfo = user.complexes; // تأتي من الاستعلام المرتبط أعلاه
            var status = complexInfo && complexInfo.complex_status ? complexInfo.complex_status : 'pending';

            if (status !== 'accepted') {
                return {
                    success: false,
                    message: status === 'rejected' ? 'تم رفض مجمع المستخدم' : 'انتظار قبول مجمع المستخدم'
                };
            }
        }

        return {
            success: true,
            user: {
                id: user.id,
                name: user.user_name,
                email: user.user_email,
                role: user.user_role,
                phone: user.user_phone,
                complexId: user.complex_id || null
            }
        };
        
    } catch (error) {
        _logError('تسجيل الدخول', error);
        return {
            success: false,
            message: 'حدث خطأ في الاتصال بالخادم'
        };
    }
}


/**
 * الحصول على صفحة التوجيه حسب دور المستخدم
 * 
 * @param {string} role - دور المستخدم
 * @returns {string} - رابط صفحة التوجيه
 */
function getRedirectPage(role) {
    switch (role) {
        case 'supervisor':
            return 'supervisor-dashboard.html';
        case 'teacher':
            return 'dashboard.html';
        case 'parent':
            return 'parent-dashboard.html';
        default:
            return 'index.html';
    }
}


// =============================================
// دوال المستخدمين (Users)
// =============================================

/**
 * جلب جميع المستخدمين
 * 
 * @param {string} role - فلترة حسب الدور (اختياري)
 * @returns {array} - قائمة المستخدمين
 */
async function getUsers(role) {
    try {
        var query = supabaseClient
            .from('users')
            .select('*')
            .eq('is_active', true);
        
        // فلترة حسب الدور إذا تم تحديده
        if (role) {
            query = query.eq('user_role', role);
        }
        
        var result = await query.order('created_at', { ascending: false });
        
        if (result.error) {
            _logError('جلب المستخدمين', result.error);
            return [];
        }
        
        return result.data;
        
    } catch (error) {
        _logError('جلب المستخدمين', error);
        return [];
    }
}


/**
 * إضافة مستخدم جديد
 * 
 * @param {object} userData - بيانات المستخدم
 * @returns {object} - نتيجة الإضافة
 */
async function addUser(userData) {
    try {
        var result = await supabaseClient
            .from('users')
            .insert({
                user_email: userData.email.toLowerCase(),
                user_password: userData.password,
                user_name: userData.name,
                user_phone: userData.phone || null,
                user_role: userData.role
            })
            .select()
            .single();
        
        if (result.error) {
            // التحقق من تكرار البريد الإلكتروني
            if (result.error.code === '23505') {
                return { success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' };
            }
            return { success: false, message: result.error.message };
        }
        
        return { success: true, data: result.data };
        
    } catch (error) {
        _logError('إضافة المستخدم', error);
        return { success: false, message: 'حدث خطأ في الاتصال' };
    }
}


// =============================================
// دوال الحلقات (Halaqat)
// =============================================

/**
 * جلب جميع الحلقات مع معلومات المسجد
 * 
 * @returns {array} - قائمة الحلقات
 */
async function getHalaqat() {
    try {
        var result = await supabaseClient
            .from('halaqat')
            .select(`
                *,
                mosques (mosque_name)
            `)
            .order('id', { ascending: true });
        
        if (result.error) {
            _logError('جلب الحلقات', result.error);
            return [];
        }
        
        // تنسيق البيانات للاستخدام السهل
        var halaqat = result.data.map(function(halqa) {
            return {
                id: halqa.id,
                halqaName: halqa.halqa_name,
                mosqueName: halqa.mosques ? halqa.mosques.mosque_name : 'غير محدد',
                description: halqa.halqa_description
            };
        });
        
        return halaqat;
        
    } catch (error) {
        _logError('جلب الحلقات', error);
        return [];
    }
}


/**
 * جلب الحلقات المسندة لمعلم معين
 * 
 * @param {number} teacherId - رقم المعلم
 * @returns {array} - قائمة الحلقات
 */
async function getTeacherHalaqat(teacherId) {
    try {
        var result = await supabaseClient
            .from('teachers_halaqat')
            .select(`
                halqa_id,
                halaqat (
                    id,
                    halqa_name,
                    mosques (mosque_name)
                )
            `)
            .eq('teacher_id', teacherId);
        
        if (result.error) {
            _logError('جلب حلقات المعلم', result.error);
            return [];
        }
        
        // تنسيق البيانات
        var halaqat = result.data.map(function(item) {
            return {
                id: item.halaqat.id,
                halqaName: item.halaqat.halqa_name,
                mosqueName: item.halaqat.mosques ? item.halaqat.mosques.mosque_name : 'غير محدد'
            };
        });
        
        return halaqat;
        
    } catch (error) {
        _logError('جلب حلقات المعلم', error);
        return [];
    }
}


/**
 * إسناد حلقات لمعلم
 * 
 * @param {number} teacherId - رقم المعلم
 * @param {array} halaqatIds - أرقام الحلقات
 * @returns {object} - نتيجة العملية
 */
async function assignHalaqatToTeacher(teacherId, halaqatIds) {
    try {
        // حذف الإسنادات القديمة أولاً
        await supabaseClient
            .from('teachers_halaqat')
            .delete()
            .eq('teacher_id', teacherId);
        
        // إضافة الإسنادات الجديدة
        var insertData = halaqatIds.map(function(halqaId) {
            return {
                teacher_id: teacherId,
                halqa_id: halqaId
            };
        });
        
        var result = await supabaseClient
            .from('teachers_halaqat')
            .insert(insertData);
        
        if (result.error) {
            return { success: false, message: result.error.message };
        }
        
        return { success: true };
        
    } catch (error) {
        _logError('إسناد الحلقات', error);
        return { success: false, message: 'حدث خطأ' };
    }
}


// =============================================
// دوال الطلاب (Students)
// =============================================

/**
 * جلب جميع الطلاب
 * 
 * @param {number} halqaId - فلترة حسب الحلقة (اختياري)
 * @returns {array} - قائمة الطلاب
 */
async function getStudents(halqaId) {
    try {
        var query = supabaseClient
            .from('students')
            .select(`
                *,
                halaqat (halqa_name)
            `)
            .eq('is_active', true);
        
        // فلترة حسب الحلقة إذا تم تحديدها
        if (halqaId) {
            query = query.eq('halqa_id', halqaId);
        }
        
        var result = await query.order('student_name', { ascending: true });
        
        if (result.error) {
            _logError('جلب الطلاب', result.error);
            return [];
        }
        
        // تنسيق البيانات
        var students = result.data.map(function(student) {
            return {
                id: student.id,
                name: student.student_name,
                idNumber: student.student_id_number,
                age: student.student_age,
                halqaId: student.halqa_id,
                halqaName: student.halaqat ? student.halaqat.halqa_name : 'غير محدد',
                parentId: student.parent_id,
                parentName: student.parent_name,
                parentPhone: student.parent_phone
            };
        });
        
        return students;
        
    } catch (error) {
        _logError('جلب الطلاب', error);
        return [];
    }
}


/**
 * جلب طلاب ولي أمر معين
 * 
 * @param {number} parentId - رقم ولي الأمر
 * @returns {array} - قائمة الطلاب
 */
async function getParentStudents(parentId) {
    try {
        var result = await supabaseClient
            .from('students')
            .select(`
                *,
                halaqat (halqa_name)
            `)
            .eq('parent_id', parentId)
            .eq('is_active', true);
        
        if (result.error) {
            _logError('جلب طلاب ولي الأمر', result.error);
            return [];
        }
        
        // تنسيق البيانات
        var students = result.data.map(function(student) {
            return {
                id: student.id,
                name: student.student_name,
                age: student.student_age,
                halqaId: student.halqa_id,
                halqaName: student.halaqat ? student.halaqat.halqa_name : 'غير محدد'
            };
        });
        
        return students;
        
    } catch (error) {
        _logError('جلب طلاب ولي الأمر', error);
        return [];
    }
}


/**
 * إضافة طالب جديد
 * 
 * @param {object} studentData - بيانات الطالب
 * @returns {object} - نتيجة الإضافة
 */
async function addStudent(studentData) {
    try {
        var result = await supabaseClient
            .from('students')
            .insert({
                student_name: studentData.name,
                student_id_number: studentData.idNumber || null,
                student_age: studentData.age || null,
                halqa_id: studentData.halqaId,
                parent_id: studentData.parentId || null,
                parent_name: studentData.parentName || null,
                parent_phone: studentData.parentPhone || null
            })
            .select()
            .single();
        
        if (result.error) {
            return { success: false, message: result.error.message };
        }
        
        return { success: true, data: result.data };
        
    } catch (error) {
        _logError('إضافة الطالب', error);
        return { success: false, message: 'حدث خطأ في الاتصال' };
    }
}


/**
 * حذف طالب (تعطيل بدلاً من الحذف الفعلي)
 * 
 * @param {number} studentId - رقم الطالب
 * @returns {object} - نتيجة الحذف
 */
async function deleteStudent(studentId) {
    try {
        // نعطّل الطالب بدلاً من حذفه للحفاظ على السجلات
        var result = await supabaseClient
            .from('students')
            .update({ is_active: false })
            .eq('id', studentId);
        
        if (result.error) {
            return { success: false, message: result.error.message };
        }
        
        return { success: true };
        
    } catch (error) {
        _logError('حذف الطالب', error);
        return { success: false, message: 'حدث خطأ' };
    }
}


// =============================================
// دوال الحضور (Attendance)
// =============================================

/**
 * جلب سجلات حضور حلقة في تاريخ معين
 * 
 * @param {number} halqaId - رقم الحلقة
 * @param {string} date - التاريخ (YYYY-MM-DD)
 * @returns {array} - سجلات الحضور
 */
async function getAttendanceByDate(halqaId, date) {
    try {
        var result = await supabaseClient
            .from('attendance_records')
            .select(`
                *,
                students (student_name, student_id_number)
            `)
            .eq('halqa_id', halqaId)
            .eq('attendance_date', date);
        
        if (result.error) {
            _logError('جلب الحضور', result.error);
            return [];
        }
        
        return result.data;
        
    } catch (error) {
        _logError('جلب الحضور', error);
        return [];
    }
}


/**
 * جلب سجلات حضور طالب لأسبوع معين
 * 
 * @param {number} studentId - رقم الطالب
 * @param {string} startDate - تاريخ بداية الأسبوع
 * @param {string} endDate - تاريخ نهاية الأسبوع
 * @returns {array} - سجلات الحضور
 */
async function getStudentAttendance(studentId, startDate, endDate) {
    try {
        var result = await supabaseClient
            .from('attendance_records')
            .select('*')
            .eq('student_id', studentId)
            .gte('attendance_date', startDate)
            .lte('attendance_date', endDate)
            .order('attendance_date', { ascending: true });
        
        if (result.error) {
            _logError('جلب حضور الطالب', result.error);
            return [];
        }
        
        return result.data;
        
    } catch (error) {
        _logError('جلب حضور الطالب', error);
        return [];
    }
}


/**
 * حفظ سجلات الحضور
 * تستخدم upsert لتحديث السجل إذا كان موجوداً أو إنشاء جديد
 * 
 * @param {array} attendanceData - بيانات الحضور
 * @param {number} recordedBy - رقم المعلم المسجّل
 * @returns {object} - نتيجة الحفظ
 */
async function saveAttendance(attendanceData, recordedBy) {
    try {
        // تجهيز البيانات للإدخال
        var records = attendanceData.map(function(item) {
            return {
                student_id: item.studentId,
                halqa_id: item.halqaId,
                attendance_date: item.date,
                attendance_status: item.status,
                notes: item.notes || null,
                recorded_by: recordedBy
            };
        });
        
        // استخدام upsert لتحديث أو إنشاء
        var result = await supabaseClient
            .from('attendance_records')
            .upsert(records, {
                onConflict: 'student_id,attendance_date'
            });
        
        if (result.error) {
            return { success: false, message: result.error.message };
        }
        
        return { success: true };
        
    } catch (error) {
        _logError('حفظ الحضور', error);
        return { success: false, message: 'حدث خطأ في الاتصال' };
    }
}


// =============================================
// دوال التسميع (Recitation)
// =============================================

/**
 * جلب سور القرآن
 * 
 * @returns {array} - قائمة السور
 */
async function getSurahs() {
    try {
        var result = await supabaseClient
            .from('surahs')
            .select('*')
            .order('id', { ascending: true });
        
        if (result.error) {
            _logError('جلب السور', result.error);
            return [];
        }
        
        return result.data;
        
    } catch (error) {
        _logError('جلب السور', error);
        return [];
    }
}


/**
 * جلب سجلات تسميع طالب في تاريخ معين
 * 
 * @param {number} studentId - رقم الطالب
 * @param {string} date - التاريخ
 * @returns {array} - سجلات التسميع
 */
async function getStudentRecitations(studentId, date) {
    try {
        var result = await supabaseClient
            .from('recitation_records')
            .select(`
                *,
                start_surah:surahs!recitation_records_start_surah_id_fkey (surah_name),
                end_surah:surahs!recitation_records_end_surah_id_fkey (surah_name)
            `)
            .eq('student_id', studentId)
            .eq('recitation_date', date)
            .order('created_at', { ascending: false });
        
        if (result.error) {
            _logError('جلب سجلات التسميع', result.error);
            return [];
        }
        
        // تنسيق البيانات
        var recitations = result.data.map(function(rec) {
            return {
                id: rec.id,
                type: rec.recitation_type,
                typeLabel: getRecitationTypeLabel(rec.recitation_type),
                start: {
                    surahId: rec.start_surah_id,
                    surahName: rec.start_surah ? rec.start_surah.surah_name : '',
                    ayah: rec.start_ayah,
                    page: rec.start_page
                },
                end: {
                    surahId: rec.end_surah_id,
                    surahName: rec.end_surah ? rec.end_surah.surah_name : '',
                    ayah: rec.end_ayah,
                    page: rec.end_page
                },
                grade: rec.grade,
                errors: rec.errors_count,
                notes: rec.notes
            };
        });
        
        return recitations;
        
    } catch (error) {
        _logError('جلب سجلات التسميع', error);
        return [];
    }
}


/**
 * تحويل نوع التسميع إلى نص عربي
 */
function getRecitationTypeLabel(type) {
    switch (type) {
        case 'daily-wird':
            return 'ورد يومي';
        case 'small-review':
            return 'مراجعة صغرى';
        case 'big-review':
            return 'مراجعة كبرى';
        default:
            return 'تسميع';
    }
}


/**
 * حفظ سجل تسميع جديد
 * 
 * @param {object} recitationData - بيانات التسميع
 * @param {number} recordedBy - رقم المعلم المسجّل
 * @returns {object} - نتيجة الحفظ
 */
async function saveRecitation(recitationData, recordedBy) {
    try {
        var result = await supabaseClient
            .from('recitation_records')
            .insert({
                student_id: recitationData.studentId,
                halqa_id: recitationData.halqaId,
                recitation_type: recitationData.type,
                recitation_date: recitationData.date,
                start_surah_id: recitationData.startSurahId,
                start_ayah: recitationData.startAyah,
                start_page: recitationData.startPage || null,
                end_surah_id: recitationData.endSurahId,
                end_ayah: recitationData.endAyah,
                end_page: recitationData.endPage || null,
                grade: recitationData.grade,
                errors_count: recitationData.errors || 0,
                notes: recitationData.notes || null,
                recorded_by: recordedBy
            })
            .select()
            .single();
        
        if (result.error) {
            return { success: false, message: result.error.message };
        }
        
        return { success: true, data: result.data };
        
    } catch (error) {
        _logError('حفظ التسميع', error);
        return { success: false, message: 'حدث خطأ في الاتصال' };
    }
}


// =============================================
// دوال الإحصائيات
// =============================================

/**
 * جلب إحصائيات المشرف
 * 
 * @returns {object} - الإحصائيات
 */
async function getSupervisorStats() {
    try {
        // عدد المعلمين
        var teachersResult = await supabaseClient
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('user_role', 'teacher')
            .eq('is_active', true);
        
        // عدد الطلاب
        var studentsResult = await supabaseClient
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true);
        
        // عدد الحلقات
        var halaqatResult = await supabaseClient
            .from('halaqat')
            .select('id', { count: 'exact', head: true });
        
        return {
            teachersCount: teachersResult.count || 0,
            studentsCount: studentsResult.count || 0,
            halaqatCount: halaqatResult.count || 0
        };
        
    } catch (error) {
        _logError('جلب الإحصائيات', error);
        return {
            teachersCount: 0,
            studentsCount: 0,
            halaqatCount: 0
        };
    }
}


// =============================================
// دوال مساعدة
// =============================================

/**
 * تنسيق التاريخ للاستخدام مع قاعدة البيانات
 * 
 * @param {Date} date - كائن التاريخ
 * @returns {string} - التاريخ بصيغة YYYY-MM-DD
 */
function formatDateForDB(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}


/**
 * التحقق من حالة الاتصال بقاعدة البيانات
 * 
 * @returns {boolean} - هل الاتصال فعّال
 */
function isConnected() {
    return supabaseClient !== null;
}


// =============================================
// تصدير الدوال للاستخدام العام
// =============================================
// نجعل الدوال متاحة عالمياً لاستخدامها في الملفات الأخرى

window.SupabaseDB = {
    // التهيئة
    init: initSupabase,
    isConnected: isConnected,
    
    // المصادقة
    login: loginUser,
    getRedirectPage: getRedirectPage,
    
    // المستخدمين
    getUsers: getUsers,
    addUser: addUser,
    
    // الحلقات
    getHalaqat: getHalaqat,
    getTeacherHalaqat: getTeacherHalaqat,
    assignHalaqatToTeacher: assignHalaqatToTeacher,
    
    // الطلاب
    getStudents: getStudents,
    getParentStudents: getParentStudents,
    addStudent: addStudent,
    deleteStudent: deleteStudent,
    
    // الحضور
    getAttendanceByDate: getAttendanceByDate,
    getStudentAttendance: getStudentAttendance,
    saveAttendance: saveAttendance,
    
    // التسميع
    getSurahs: getSurahs,
    getStudentRecitations: getStudentRecitations,
    saveRecitation: saveRecitation,
    
    // الإحصائيات
    getSupervisorStats: getSupervisorStats,
    
    // مساعدة
    formatDateForDB: formatDateForDB
};
