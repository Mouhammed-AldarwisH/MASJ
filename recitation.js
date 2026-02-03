// الانتظار حتى تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }
    
    // ===== قائمة سور القرآن الكريم =====
    var surahList = [
        { number: 1, name: 'الفاتحة', ayahs: 7 },
        { number: 2, name: 'البقرة', ayahs: 286 },
        { number: 3, name: 'آل عمران', ayahs: 200 },
        { number: 4, name: 'النساء', ayahs: 176 },
        { number: 5, name: 'المائدة', ayahs: 120 },
        { number: 6, name: 'الأنعام', ayahs: 165 },
        { number: 7, name: 'الأعراف', ayahs: 206 },
        { number: 8, name: 'الأنفال', ayahs: 75 },
        { number: 9, name: 'التوبة', ayahs: 129 },
        { number: 10, name: 'يونس', ayahs: 109 },
        { number: 11, name: 'هود', ayahs: 123 },
        { number: 12, name: 'يوسف', ayahs: 111 },
        { number: 13, name: 'الرعد', ayahs: 43 },
        { number: 14, name: 'إبراهيم', ayahs: 52 },
        { number: 15, name: 'الحجر', ayahs: 99 },
        { number: 16, name: 'النحل', ayahs: 128 },
        { number: 17, name: 'الإسراء', ayahs: 111 },
        { number: 18, name: 'الكهف', ayahs: 110 },
        { number: 19, name: 'مريم', ayahs: 98 },
        { number: 20, name: 'طه', ayahs: 135 },
        { number: 21, name: 'الأنبياء', ayahs: 112 },
        { number: 22, name: 'الحج', ayahs: 78 },
        { number: 23, name: 'المؤمنون', ayahs: 118 },
        { number: 24, name: 'النور', ayahs: 64 },
        { number: 25, name: 'الفرقان', ayahs: 77 },
        { number: 26, name: 'الشعراء', ayahs: 227 },
        { number: 27, name: 'النمل', ayahs: 93 },
        { number: 28, name: 'القصص', ayahs: 88 },
        { number: 29, name: 'العنكبوت', ayahs: 69 },
        { number: 30, name: 'الروم', ayahs: 60 },
        { number: 31, name: 'لقمان', ayahs: 34 },
        { number: 32, name: 'السجدة', ayahs: 30 },
        { number: 33, name: 'الأحزاب', ayahs: 73 },
        { number: 34, name: 'سبأ', ayahs: 54 },
        { number: 35, name: 'فاطر', ayahs: 45 },
        { number: 36, name: 'يس', ayahs: 83 },
        { number: 37, name: 'الصافات', ayahs: 182 },
        { number: 38, name: 'ص', ayahs: 88 },
        { number: 39, name: 'الزمر', ayahs: 75 },
        { number: 40, name: 'غافر', ayahs: 85 },
        { number: 41, name: 'فصلت', ayahs: 54 },
        { number: 42, name: 'الشورى', ayahs: 53 },
        { number: 43, name: 'الزخرف', ayahs: 89 },
        { number: 44, name: 'الدخان', ayahs: 59 },
        { number: 45, name: 'الجاثية', ayahs: 37 },
        { number: 46, name: 'الأحقاف', ayahs: 35 },
        { number: 47, name: 'محمد', ayahs: 38 },
        { number: 48, name: 'الفتح', ayahs: 29 },
        { number: 49, name: 'الحجرات', ayahs: 18 },
        { number: 50, name: 'ق', ayahs: 45 },
        { number: 51, name: 'الذاريات', ayahs: 60 },
        { number: 52, name: 'الطور', ayahs: 49 },
        { number: 53, name: 'النجم', ayahs: 62 },
        { number: 54, name: 'القمر', ayahs: 55 },
        { number: 55, name: 'الرحمن', ayahs: 78 },
        { number: 56, name: 'الواقعة', ayahs: 96 },
        { number: 57, name: 'الحديد', ayahs: 29 },
        { number: 58, name: 'المجادلة', ayahs: 22 },
        { number: 59, name: 'الحشر', ayahs: 24 },
        { number: 60, name: 'الممتحنة', ayahs: 13 },
        { number: 61, name: 'الصف', ayahs: 14 },
        { number: 62, name: 'الجمعة', ayahs: 11 },
        { number: 63, name: 'المنافقون', ayahs: 11 },
        { number: 64, name: 'التغابن', ayahs: 18 },
        { number: 65, name: 'الطلاق', ayahs: 12 },
        { number: 66, name: 'التحريم', ayahs: 12 },
        { number: 67, name: 'الملك', ayahs: 30 },
        { number: 68, name: 'القلم', ayahs: 52 },
        { number: 69, name: 'الحاقة', ayahs: 52 },
        { number: 70, name: 'المعارج', ayahs: 44 },
        { number: 71, name: 'نوح', ayahs: 28 },
        { number: 72, name: 'الجن', ayahs: 28 },
        { number: 73, name: 'المزمل', ayahs: 20 },
        { number: 74, name: 'المدثر', ayahs: 56 },
        { number: 75, name: 'القيامة', ayahs: 40 },
        { number: 76, name: 'الإنسان', ayahs: 31 },
        { number: 77, name: 'المرسلات', ayahs: 50 },
        { number: 78, name: 'النبأ', ayahs: 40 },
        { number: 79, name: 'النازعات', ayahs: 46 },
        { number: 80, name: 'عبس', ayahs: 42 },
        { number: 81, name: 'التكوير', ayahs: 29 },
        { number: 82, name: 'الانفطار', ayahs: 19 },
        { number: 83, name: 'المطففين', ayahs: 36 },
        { number: 84, name: 'الانشقاق', ayahs: 25 },
        { number: 85, name: 'البروج', ayahs: 22 },
        { number: 86, name: 'الطارق', ayahs: 17 },
        { number: 87, name: 'الأعلى', ayahs: 19 },
        { number: 88, name: 'الغاشية', ayahs: 26 },
        { number: 89, name: 'الفجر', ayahs: 30 },
        { number: 90, name: 'البلد', ayahs: 20 },
        { number: 91, name: 'الشمس', ayahs: 15 },
        { number: 92, name: 'الليل', ayahs: 21 },
        { number: 93, name: 'الضحى', ayahs: 11 },
        { number: 94, name: 'الشرح', ayahs: 8 },
        { number: 95, name: 'التين', ayahs: 8 },
        { number: 96, name: 'العلق', ayahs: 19 },
        { number: 97, name: 'القدر', ayahs: 5 },
        { number: 98, name: 'البينة', ayahs: 8 },
        { number: 99, name: 'الزلزلة', ayahs: 8 },
        { number: 100, name: 'العاديات', ayahs: 11 },
        { number: 101, name: 'القارعة', ayahs: 11 },
        { number: 102, name: 'التكاثر', ayahs: 8 },
        { number: 103, name: 'العصر', ayahs: 3 },
        { number: 104, name: 'الهمزة', ayahs: 9 },
        { number: 105, name: 'الفيل', ayahs: 5 },
        { number: 106, name: 'قريش', ayahs: 4 },
        { number: 107, name: 'الماعون', ayahs: 7 },
        { number: 108, name: 'الكوثر', ayahs: 3 },
        { number: 109, name: 'الكافرون', ayahs: 6 },
        { number: 110, name: 'النصر', ayahs: 3 },
        { number: 111, name: 'المسد', ayahs: 5 },
        { number: 112, name: 'الإخلاص', ayahs: 4 },
        { number: 113, name: 'الفلق', ayahs: 5 },
        { number: 114, name: 'الناس', ayahs: 6 }
    ];

    // ===== القيم الحالية =====
    var gradeValue = 15;  // الدرجة الافتراضية
    var errorsValue = 0;  // عدد الأخطاء الافتراضي
    var maxGrade = 20;    // أقصى درجة
    var minGrade = 0;     // أقل درجة

    // ===== جلب العناصر من الصفحة =====
    var startSurahSelect = document.getElementById('startSurah');
    var endSurahSelect = document.getElementById('endSurah');
    var startPageInput = document.getElementById('startPage');
    var endPageInput = document.getElementById('endPage');
    var startAyahInput = document.getElementById('startAyah');
    var endAyahInput = document.getElementById('endAyah');
    
    var gradeValueDisplay = document.getElementById('gradeValue');
    var errorsValueDisplay = document.getElementById('errorsValue');
    var gradePlusBtn = document.getElementById('gradePlus');
    var gradeMinusBtn = document.getElementById('gradeMinus');
    var errorsPlusBtn = document.getElementById('errorsPlus');
    var errorsMinusBtn = document.getElementById('errorsMinus');
    var saveBtn = document.getElementById('saveBtn');
    
    var pageTitle = document.getElementById('pageTitle');
    var studentNameDisplay = document.getElementById('studentName');
    var recitationTypeDisplay = document.getElementById('recitationType');

    // ===== تشغيل الصفحة =====
    initializePage();

    /**
     * دالة تهيئة الصفحة
     * تملأ قوائم السور وتضيف الأحداث
     */
    async function initializePage() {
        // تحميل قوائم السور
        await loadSurahOptions(startSurahSelect);
        await loadSurahOptions(endSurahSelect);
        
        // جلب بيانات الطالب ونوع التسميع من الرابط
        loadStudentData();
        
        // إضافة أحداث الأزرار
        addButtonEvents();
    }

    /**
     * دالة تحميل خيارات السور في القائمة المنسدلة
     */
    async function loadSurahOptions(selectElement) {
        var html = '<option value="">اختر السورة</option>';
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var surahs = await SupabaseDB.getSurahs();
            for (var i = 0; i < surahs.length; i++) {
                var surah = surahs[i];
                html += '<option value="' + surah.id + '">' + surah.surah_name + '</option>';
            }
        } else {
            // استخدام القائمة المحلية
            for (var j = 0; j < surahList.length; j++) {
                var surahLocal = surahList[j];
                html += '<option value="' + surahLocal.number + '">' + surahLocal.name + '</option>';
            }
        }
        
        selectElement.innerHTML = html;
    }

    /**
     * دالة جلب بيانات الطالب من الرابط
     * تقرأ المعلومات المرسلة من صفحة الحضور
     */
    function loadStudentData() {
        // جلب المعلومات من الرابط
        var urlParams = new URLSearchParams(window.location.search);
        var studentId = urlParams.get('studentId');
        var studentName = urlParams.get('studentName');
        var recitationType = urlParams.get('type');
        
        // تحديث اسم الطالب
        if (studentName) {
            studentNameDisplay.textContent = decodeURIComponent(studentName);
        }
        
        // تحديث نوع التسميع
        if (recitationType) {
            var typeText = getRecitationTypeText(recitationType);
            recitationTypeDisplay.textContent = typeText;
        }
    }

    /**
     * دالة تحويل نوع التسميع إلى نص عربي
     */
    function getRecitationTypeText(type) {
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
     * دالة إضافة أحداث الأزرار
     */
    function addButtonEvents() {
        // أزرار الدرجة
        gradePlusBtn.addEventListener('click', function() {
            if (gradeValue < maxGrade) {
                gradeValue++;
                updateGradeDisplay();
            }
        });
        
        gradeMinusBtn.addEventListener('click', function() {
            if (gradeValue > minGrade) {
                gradeValue--;
                updateGradeDisplay();
            }
        });
        
        // أزرار الأخطاء
        errorsPlusBtn.addEventListener('click', function() {
            errorsValue++;
            updateErrorsDisplay();
        });
        
        errorsMinusBtn.addEventListener('click', function() {
            if (errorsValue > 0) {
                errorsValue--;
                updateErrorsDisplay();
            }
        });
        
        // زر الحفظ
        saveBtn.addEventListener('click', handleSave);

        // زر الرجوع لصفحة التحضير
        var backToAttendanceBtn = document.getElementById('backToAttendanceBtn');
        if (backToAttendanceBtn) {
            backToAttendanceBtn.addEventListener('click', function() {
                // يرجع لصفحة التحضير مع تمرير معرف الحلقة إذا كان موجود
                var urlParams = new URLSearchParams(window.location.search);
                var halqaId = localStorage.getItem('selectedHalqaId') || urlParams.get('halqaId') || '';
                var attendanceUrl = 'attendance.html';
                if (halqaId) {
                    attendanceUrl += '?halqaId=' + halqaId;
                }
                window.location.href = attendanceUrl;
            });
        }
    }

    /**
     * دالة تحديث عرض الدرجة
     */
    function updateGradeDisplay() {
        gradeValueDisplay.textContent = gradeValue;
    }

    /**
     * دالة تحديث عرض الأخطاء
     */
    function updateErrorsDisplay() {
        errorsValueDisplay.textContent = errorsValue;
    }

    /**
     * دالة معالجة الحفظ
     * تجمع البيانات وترسلها (أو تعرضها)
     */
    async function handleSave() {
        // جمع بيانات البداية
        var startData = {
            surah: startSurahSelect.value,
            surahName: startSurahSelect.options[startSurahSelect.selectedIndex].text,
            page: startPageInput.value,
            ayah: startAyahInput.value
        };
        
        // جمع بيانات النهاية
        var endData = {
            surah: endSurahSelect.value,
            surahName: endSurahSelect.options[endSurahSelect.selectedIndex].text,
            page: endPageInput.value,
            ayah: endAyahInput.value
        };
        
        // التحقق من إدخال البيانات المطلوبة
        if (!startData.surah || !startData.ayah) {
            alert('يرجى إدخال بيانات بداية التسميع (السورة والآية على الأقل)');
            return;
        }
        
        if (!endData.surah || !endData.ayah) {
            alert('يرجى إدخال بيانات نهاية التسميع (السورة والآية على الأقل)');
            return;
        }
        
        // جلب معلومات الطالب
        var urlParams = new URLSearchParams(window.location.search);
        var studentId = urlParams.get('studentId');
        var recitationType = urlParams.get('type');
        var halqaId = localStorage.getItem('selectedHalqaId') || urlParams.get('halqaId') || '1';
        
        // جمع كل البيانات
        var recitationData = {
            studentId: parseInt(studentId),
            halqaId: parseInt(halqaId),
            type: recitationType,
            date: new Date().toISOString().split('T')[0],
            startSurahId: parseInt(startData.surah),
            startAyah: parseInt(startData.ayah),
            startPage: startData.page ? parseInt(startData.page) : null,
            endSurahId: parseInt(endData.surah),
            endAyah: parseInt(endData.ayah),
            endPage: endData.page ? parseInt(endData.page) : null,
            grade: gradeValue,
            errors: errorsValue
        };
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            var result = await SupabaseDB.saveRecitation(recitationData, currentUser.id);
            
            if (result.success) {
                var message = 'تم حفظ التسميع بنجاح! ✓\n\n';
                message += 'الطالب: ' + studentNameDisplay.textContent + '\n';
                message += 'النوع: ' + recitationTypeDisplay.textContent + '\n';
                message += 'من: ' + startData.surahName + ' آية ' + startData.ayah + '\n';
                message += 'إلى: ' + endData.surahName + ' آية ' + endData.ayah + '\n';
                message += 'الدرجة: ' + gradeValue + '\n';
                message += 'الأخطاء: ' + errorsValue;
                
                alert(message);
                
                // الرجوع لصفحة التحضير
                var attendanceUrl = 'attendance.html';
                if (halqaId) {
                    attendanceUrl += '?halqaId=' + halqaId;
                }
                window.location.href = attendanceUrl;
            } else {
                alert('حدث خطأ أثناء حفظ التسميع: ' + result.message);
            }
            return;
        }
        
        // رسالة نجاح
        var message = 'تم حفظ التسميع بنجاح! ✓\n\n';
        message += 'الطالب: ' + studentNameDisplay.textContent + '\n';
        message += 'النوع: ' + recitationTypeDisplay.textContent + '\n';
        message += 'من: ' + startData.surahName + ' آية ' + startData.ayah + '\n';
        message += 'إلى: ' + endData.surahName + ' آية ' + endData.ayah + '\n';
        message += 'الدرجة: ' + gradeValue + '\n';
        message += 'الأخطاء: ' + errorsValue;
        
        alert(message);
        // الرجوع لصفحة التحضير الخاصة بالحلقة
        var attendanceUrl = 'attendance.html';
        if (halqaId) {
            attendanceUrl += '?halqaId=' + halqaId;
        }
        window.location.href = attendanceUrl;
    }

});
