// الانتظار حتى تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {

    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }

    // ===== المتغيرات العامة =====
    
    var logoutButton = document.getElementById('logoutButton');
    var settingsButton = document.getElementById('settingsButton');
    var manageTeachersBtn = document.getElementById('manageTeachersBtn');
    var manageStudentsBtn = document.getElementById('manageStudentsBtn');
    var manageCirclesBtn = document.getElementById('manageCirclesBtn');
    
    // عناصر الإحصائيات
    var teachersCount = document.getElementById('teachersCount');
    var studentsCount = document.getElementById('studentsCount');
    var circlesCount = document.getElementById('circlesCount');

    // ===== تحميل الإحصائيات =====
    
    loadStatistics();

    /**
     * تحميل وعرض الإحصائيات من قاعدة البيانات أو التخزين المحلي
     */
    async function loadStatistics() {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var stats = await SupabaseDB.getSupervisorStats();
            teachersCount.textContent = stats.teachersCount;
            studentsCount.textContent = stats.studentsCount;
            circlesCount.textContent = stats.halaqatCount;
            return;
        }
        
        // ===== استخدام التخزين المحلي =====
        // جلب عدد المعلمين
        var teachers = localStorage.getItem('teachers');
        if (teachers) {
            var teachersArray = JSON.parse(teachers);
            teachersCount.textContent = teachersArray.length;
        } else {
            teachersCount.textContent = '0';
        }
        
        // جلب عدد الطلاب
        var students = localStorage.getItem('students');
        if (students) {
            var studentsArray = JSON.parse(students);
            studentsCount.textContent = studentsArray.length;
        } else {
            studentsCount.textContent = '0';
        }
        
        // عدد الحلقات (ثابت حالياً - يمكن تغييره لاحقاً)
        circlesCount.textContent = '3';
    }

    // ===== أحداث أزرار الإدارة =====

    /**
     * الانتقال لصفحة إدارة المعلمين
     */
    manageTeachersBtn.addEventListener('click', function() {
        window.location.href = 'teachers.html';
    });

    /**
     * الانتقال لصفحة إدارة الطلاب
     */
    manageStudentsBtn.addEventListener('click', function() {
        window.location.href = 'students.html';
    });

    /**
     * الانتقال لصفحة إدارة الحلقات
     */
    manageCirclesBtn.addEventListener('click', function() {
        // الانتقال إلى صفحة إدارة الحلقات التي أنشأناها
        window.location.href = 'halaqat.html';
    });

    // ===== أحداث الأزرار العلوية =====

    /**
     * تسجيل الخروج
     */
    logoutButton.addEventListener('click', function() {
        var confirmed = confirm('هل أنت متأكد من تسجيل الخروج؟');
        
        if (confirmed) {
            // حذف بيانات المستخدم الحالي
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentTeacher');
            
            // الانتقال لصفحة تسجيل الدخول
            window.location.href = 'index.html';
        }
    });

    /**
     * فتح الإعدادات
     */
    settingsButton.addEventListener('click', function() {
        alert('صفحة الإعدادات - قيد التطوير');
        // يمكن تغييرها لاحقاً: window.location.href = 'settings.html';
    });

});
