// الانتظار حتى تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }
    
    // ===== بيانات الحلقات مع طلابها (للتشغيل بدون قاعدة بيانات) =====
    // هذه البيانات يمكن جلبها من قاعدة بيانات لاحقاً
    var halaqatWithStudents = {
        1: {
            halqaName: 'حلقة الشجعان',
            mosqueName: 'جامع أُبي بن كعب',
            students: [
                { id: 1, name: 'أحمد محمد العلي', idNumber: 'STD001' },
                { id: 2, name: 'خالد عبدالله السعيد', idNumber: 'STD002' },
                { id: 3, name: 'عمر فهد الراشد', idNumber: 'STD003' }
            ]
        },
        2: {
            halqaName: 'حلقة المتميزين',
            mosqueName: 'جامع أُبي بن كعب',
            students: [
                { id: 4, name: 'يوسف سعد المالكي', idNumber: 'STD004' },
                { id: 5, name: 'محمد علي الغامدي', idNumber: 'STD005' },
                { id: 6, name: 'عبدالرحمن خالد', idNumber: 'STD006' }
            ]
        },
        3: {
            halqaName: 'حلقة النور',
            mosqueName: 'جامع أُبي بن كعب',
            students: [
                { id: 7, name: 'سعود ناصر العتيبي', idNumber: 'STD007' },
                { id: 8, name: 'فيصل محمد الدوسري', idNumber: 'STD008' },
                { id: 9, name: 'تركي سلمان القحطاني', idNumber: 'STD009' },
                { id: 10, name: 'نايف عبدالعزيز', idNumber: 'STD010' }
            ]
        }
    };

    // ===== جلب معرف الحلقة من الرابط =====
    var urlParams = new URLSearchParams(window.location.search);
    var currentHalqaId = urlParams.get('halqaId') || localStorage.getItem('selectedHalqaId') || '1';
    
    // ===== الحصول على بيانات الحلقة الحالية =====
    var currentHalqa = halaqatWithStudents[currentHalqaId] || halaqatWithStudents['1'];
    var studentsData = currentHalqa.students;

    // ===== خيارات الحضور =====
    var attendanceOptions = [
        { value: '', label: '-- اختر --', className: '' },
        { value: 'present', label: 'حاضر', className: 'status-present' },
        { value: 'absent', label: 'غائب', className: 'status-absent' },
        { value: 'late', label: 'متأخر', className: 'status-late' },
        { value: 'excused', label: 'مستأذن', className: 'status-excused' }
    ];

    // ===== حالة الحضور لكل طالب =====
    // نخزن حالة كل طالب هنا (present, absent, late)
    var attendanceState = {};

    // ===== التاريخ الحالي =====
    var currentDate = new Date();

    // ===== الطالب المحدد حالياً (للـ Modal) =====
    var currentStudentId = null;

    // ===== العناصر من الصفحة =====
    var studentsList = document.getElementById('studentsList');
    var studentsCount = document.getElementById('studentsCount');
    var dateDay = document.getElementById('dateDay');
    var dateFull = document.getElementById('dateFull');
    var prevDayBtn = document.getElementById('prevDayBtn');
    var nextDayBtn = document.getElementById('nextDayBtn');
    var todayBtn = document.getElementById('todayBtn');
    var saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
    var backButton = document.getElementById('backButton');
    var optionsButton = document.getElementById('optionsButton');
    
    // عناصر Modal
    var reciteModal = document.getElementById('reciteModal');
    var closeModalBtn = document.getElementById('closeModalBtn');
    var modalStudentName = document.getElementById('modalStudentName');

    // ===== تشغيل الصفحة =====
    initializePage();

    /**
     * دالة تهيئة الصفحة
     * تقوم بتحميل الطلاب وعرض التاريخ وإضافة الأحداث
     */
    async function initializePage() {
        // عرض معلومات الحلقة
        updateHalqaInfo();
        
        // عرض التاريخ الحالي
        updateDateDisplay();
        
        // تحميل قائمة الطلاب
        await loadStudents();
        
        // إضافة أحداث الأزرار
        addButtonEvents();
        addModalEvents();
    }

    /**
     * دالة تحديث معلومات الحلقة في الصفحة
     * تعرض اسم المسجد واسم الحلقة
     */
    function updateHalqaInfo() {
        var mosqueName = document.querySelector('.halqa-mosque-name');
        var halqaName = document.querySelector('.halqa-name');
        
        if (mosqueName) {
            mosqueName.textContent = currentHalqa.mosqueName;
        }
        if (halqaName) {
            halqaName.textContent = currentHalqa.halqaName;
        }
        
        // تحديث عنوان الصفحة
        document.title = 'تحضير - ' + currentHalqa.halqaName;
    }

    /**
     * دالة تحميل وعرض قائمة الطلاب في الجدول
     * تنشئ بطاقة لكل طالب مع أزرار الحضور
     */
    async function loadStudents() {
        var html = '';
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً، نجلب الطلاب منها
        if (useDatabase) {
            var students = await SupabaseDB.getStudents(parseInt(currentHalqaId));
            studentsData = students.map(function(s) {
                return {
                    id: s.id,
                    name: s.name,
                    idNumber: s.idNumber || ('STD' + s.id.toString().padStart(3, '0'))
                };
            });
        }
        
        // المرور على كل طالب وإنشاء بطاقة له
        for (var i = 0; i < studentsData.length; i++) {
            var student = studentsData[i];
            html += createStudentRowHTML(student);
            
            // تعيين الحالة الافتراضية (بدون تحديد)
            attendanceState[student.id] = '';
        }
        
        // إضافة البطاقات للصفحة
        studentsList.innerHTML = html;
        
        // تحديث عدد الطلاب
        studentsCount.textContent = studentsData.length + ' طلاب';
        
        // إضافة أحداث القوائم المنسدلة وأزرار التسميع
        addSelectEvents();
        addReciteButtonEvents();
    }

    /**
     * دالة إنشاء HTML لصف الطالب في الجدول
     * تُنشئ بطاقة تحتوي على معلومات الطالب وأزرار الحضور
     */
    function createStudentRowHTML(student) {
        var html = '';
        html += '<tr data-student-id="' + student.id + '">';
        
        // العمود الأول: اسم الطالب
        html += '  <td class="student-name-cell">';
        html += '    <span class="student-name">' + student.name + '</span>';
        html += '    <span class="student-id">' + student.idNumber + '</span>';
        html += '  </td>';
        
        // العمود الثاني: القائمة المنسدلة للحالة
        html += '  <td>';
        html += '    <select class="status-select" data-student-id="' + student.id + '">';
        for (var j = 0; j < attendanceOptions.length; j++) {
            var option = attendanceOptions[j];
            html += '      <option value="' + option.value + '">' + option.label + '</option>';
        }
        html += '    </select>';
        html += '  </td>';
        
        // العمود الثالث: زر التسميع
        html += '  <td>';
        html += '    <button class="recite-btn" data-student-id="' + student.id + '" data-student-name="' + student.name + '">تسميع</button>';
        html += '  </td>';
        
        html += '</tr>';
        
        return html;
    }

    /**
     * دالة إضافة أحداث القوائم المنسدلة
     * عند تغيير الحالة، يتم تحديث اللون وحفظ الحالة
     */
    function addSelectEvents() {
        var allSelects = document.querySelectorAll('.status-select');
        
        for (var i = 0; i < allSelects.length; i++) {
            allSelects[i].addEventListener('change', handleStatusChange);
        }
    }

    /**
     * دالة معالجة تغيير حالة الحضور
     */
    function handleStatusChange(event) {
        var selectElement = event.target;
        var studentId = selectElement.getAttribute('data-student-id');
        var selectedValue = selectElement.value;
        
        // حفظ الحالة
        attendanceState[studentId] = selectedValue;
        
        // إزالة جميع كلاسات الحالة
        selectElement.classList.remove('status-present', 'status-absent', 'status-late', 'status-excused');
        
        // إضافة كلاس الحالة المختارة
        if (selectedValue !== '') {
            selectElement.classList.add('status-' + selectedValue);
        }
    }

    /**
     * دالة إضافة أحداث أزرار التسميع
     */
    function addReciteButtonEvents() {
        var allReciteButtons = document.querySelectorAll('.recite-btn');
        
        for (var i = 0; i < allReciteButtons.length; i++) {
            allReciteButtons[i].addEventListener('click', handleReciteClick);
        }
    }

    /**
     * دالة معالجة الضغط على زر التسميع
     * تفتح نافذة الخيارات (Modal)
     */
    function handleReciteClick(event) {
        var button = event.target;
        var studentId = button.getAttribute('data-student-id');
        var studentName = button.getAttribute('data-student-name');
        
        // حفظ الطالب الحالي
        currentStudentId = studentId;
        
        // تحديث اسم الطالب في النافذة
        modalStudentName.textContent = studentName;
        
        // إظهار النافذة
        openModal();
    }

    // ===== دوال التحكم بالـ Modal =====

    /**
     * دالة فتح نافذة الخيارات
     */
    function openModal() {
        reciteModal.classList.add('active');
        // منع تمرير الصفحة في الخلفية
        document.body.style.overflow = 'hidden';
    }

    /**
     * دالة إغلاق نافذة الخيارات
     */
    function closeModal() {
        reciteModal.classList.remove('active');
        // إعادة تمرير الصفحة
        document.body.style.overflow = '';
        currentStudentId = null;
    }

    /**
     * دالة إضافة أحداث الـ Modal
     */
    function addModalEvents() {
        // إغلاق عند الضغط على زر X
        closeModalBtn.addEventListener('click', closeModal);
        
        // إغلاق عند الضغط على الخلفية
        reciteModal.addEventListener('click', function(event) {
            if (event.target === reciteModal) {
                closeModal();
            }
        });
        
        // إغلاق عند الضغط على Escape
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && reciteModal.classList.contains('active')) {
                closeModal();
            }
        });
        
        // أحداث أزرار الخيارات
        var modalButtons = document.querySelectorAll('.modal-btn');
        for (var i = 0; i < modalButtons.length; i++) {
            modalButtons[i].addEventListener('click', handleModalButtonClick);
        }
    }

    /**
     * دالة معالجة الضغط على زر في الـ Modal
     * ينتقل لصفحة تسجيل التسميع
     */
    function handleModalButtonClick(event) {
        var button = event.currentTarget;
        var action = button.getAttribute('data-action');
        
        // الحصول على اسم الطالب
        var studentName = modalStudentName.textContent;
        
        // إغلاق النافذة
        closeModal();
        
        // الانتقال لصفحة التسميع مع إرسال البيانات
        var url = 'recitation.html?studentId=' + currentStudentId;
        url += '&studentName=' + encodeURIComponent(studentName);
        url += '&type=' + action;
        
        window.location.href = url;
    }

    // ===== باقي الدوال (التاريخ والحفظ) =====

    /**
     * دالة تحديث عرض التاريخ
     * تعرض اليوم والتاريخ بالتنسيق العربي
     */
    function updateDateDisplay() {
        // أسماء أيام الأسبوع بالعربية
        var daysArabic = [
            'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء',
            'الخميس', 'الجمعة', 'السبت'
        ];
        
        // أسماء الأشهر بالعربية
        var monthsArabic = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        // الحصول على اليوم والشهر والسنة
        var dayIndex = currentDate.getDay();
        var dayNumber = currentDate.getDate();
        var monthIndex = currentDate.getMonth();
        var year = currentDate.getFullYear();
        
        // عرض اليوم
        dateDay.textContent = daysArabic[dayIndex];
        
        // عرض التاريخ الكامل
        dateFull.textContent = dayNumber + ' ' + monthsArabic[monthIndex] + ' ' + year;
    }

    /**
     * دالة الانتقال لليوم السابق
     */
    function goToPreviousDay() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        
        // إعادة تحميل حالة الحضور (من قاعدة البيانات لاحقاً)
        resetAttendanceState();
    }

    /**
     * دالة الانتقال لليوم التالي
     */
    function goToNextDay() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        
        // إعادة تحميل حالة الحضور
        resetAttendanceState();
    }

    /**
     * دالة الذهاب لليوم الحالي
     */
    function goToToday() {
        currentDate = new Date();
        updateDateDisplay();
        
        // إعادة تحميل حالة الحضور
        resetAttendanceState();
    }

    /**
     * دالة إعادة تعيين حالة الحضور
     * تُزيل التحديد من جميع الأزرار
     */
    function resetAttendanceState() {
        // إعادة تعيين الحالات
        for (var studentId in attendanceState) {
            attendanceState[studentId] = '';
        }
        
        // إعادة تعيين القوائم المنسدلة
        var allSelects = document.querySelectorAll('.status-select');
        for (var i = 0; i < allSelects.length; i++) {
            allSelects[i].value = '';
            allSelects[i].classList.remove('status-present', 'status-absent', 'status-late', 'status-excused');
        }
    }

    /**
     * دالة حفظ الحضور
     * تجمع بيانات الحضور وترسلها (أو تعرضها)
     */
    async function saveAttendance() {
        // التحقق من أن جميع الطلاب تم تحديد حالتهم
        var missingStudents = [];
        
        for (var i = 0; i < studentsData.length; i++) {
            var student = studentsData[i];
            if (attendanceState[student.id] === '' || attendanceState[student.id] === null) {
                missingStudents.push(student.name);
            }
        }
        
        // إذا هناك طلاب بدون تحديد
        if (missingStudents.length > 0) {
            alert('يرجى تحديد حالة الحضور لجميع الطلاب.\n\nالطلاب غير المحددين:\n- ' + missingStudents.join('\n- '));
            return;
        }
        
        // جمع البيانات للإرسال
        var dateStr = currentDate.toISOString().split('T')[0];
        var attendanceData = {
            date: dateStr,
            students: []
        };
        
        for (var j = 0; j < studentsData.length; j++) {
            var studentData = studentsData[j];
            attendanceData.students.push({
                studentId: studentData.id,
                halqaId: parseInt(currentHalqaId),
                date: dateStr,
                status: attendanceState[studentData.id],
                name: studentData.name
            });
        }
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            // جلب معرف المعلم الحالي
            var currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            var result = await SupabaseDB.saveAttendance(attendanceData.students, currentUser.id);
            
            if (result.success) {
                alert('تم حفظ الحضور بنجاح! ✓\n\nالتاريخ: ' + dateStr);
                window.location.href = 'dashboard.html';
            } else {
                alert('حدث خطأ أثناء حفظ الحضور: ' + result.message);
            }
            return;
        }
        
        // رسالة نجاح
        alert('تم حفظ الحضور بنجاح! ✓\n\nالتاريخ: ' + attendanceData.date);
        // الرجوع للداشبورد بعد الحفظ
        window.location.href = 'dashboard.html';
    }

    /**
     * دالة إضافة أحداث الأزرار
     * تربط الأزرار بالدوال المناسبة
     */
    function addButtonEvents() {
        // زر اليوم السابق
        prevDayBtn.addEventListener('click', goToPreviousDay);
        
        // زر اليوم التالي
        nextDayBtn.addEventListener('click', goToNextDay);
        
        // زر اليوم الحالي
        todayBtn.addEventListener('click', goToToday);
        
        // زر حفظ الحضور
        saveAttendanceBtn.addEventListener('click', saveAttendance);
        
        // زر الرجوع
        backButton.addEventListener('click', function() {
            window.location.href = 'dashboard.html';
        });
        
        // زر الخيارات
        optionsButton.addEventListener('click', function() {
            alert('خيارات إضافية - قيد التطوير');
        });
    }

});
