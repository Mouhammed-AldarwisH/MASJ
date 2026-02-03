// الانتظار حتى تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {

    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }

    // ===== المتغيرات العامة =====
    
    // العناصر الرئيسية
    var addStudentBtn = document.getElementById('addStudentBtn');
    var deleteStudentBtn = document.getElementById('deleteStudentBtn');
    var backBtn = document.getElementById('backBtn');
    
    // نافذة إضافة طالب
    var addStudentModal = document.getElementById('addStudentModal');
    var closeModalBtn = document.getElementById('closeModalBtn');
    var studentForm = document.getElementById('studentForm');
    
    // نافذة حذف طالب
    var deleteStudentModal = document.getElementById('deleteStudentModal');
    var closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    var studentsList = document.getElementById('studentsList');
    var filterHalqa = document.getElementById('filterHalqa');
    var deleteStudentSearch = document.getElementById('deleteStudentSearch');
    
    // نافذة عرض بيانات الطلاب
    var viewStudentBtn = document.getElementById('viewStudentBtn');
    var viewStudentModal = document.getElementById('viewStudentModal');
    var closeViewModalBtn = document.getElementById('closeViewModalBtn');
    var searchStudentInput = document.getElementById('searchStudentInput');
    var viewFilterHalqa = document.getElementById('viewFilterHalqa');
    var studentsTableBody = document.getElementById('studentsTableBody');

    // ===== بيانات الحلقات المتاحة =====
    var availableHalaqat = [
        { id: 1, name: 'حلقة الشجعان' },
        { id: 2, name: 'حلقة المتميزين' },
        { id: 3, name: 'حلقة النور' }
    ];

    // ===== الدوال المساعدة =====

    /**
     * جلب قائمة الطلاب من التخزين المحلي أو قاعدة البيانات
     */
    async function getStudents() {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var students = await SupabaseDB.getStudents();
            // تحويل البيانات للشكل المتوقع
            return students.map(function(student) {
                return {
                    id: student.id,
                    name: student.name,
                    phone: student.parentPhone,
                    parentName: student.parentName,
                    halqaId: student.halqaId,
                    age: student.age
                };
            });
        }
        
        // استخدام التخزين المحلي
        var studentsData = localStorage.getItem('students');
        if (studentsData) {
            return JSON.parse(studentsData);
        }
        return [];
    }

    /**
     * حفظ قائمة الطلاب في التخزين المحلي
     */
    function saveStudents(students) {
        localStorage.setItem('students', JSON.stringify(students));
    }

    /**
     * إضافة طالب جديد
     */
    async function addStudent(studentData) {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var result = await SupabaseDB.addStudent({
                name: studentData.name,
                parentPhone: studentData.phone,
                parentName: studentData.parentName,
                halqaId: studentData.halqaId,
                age: studentData.age
            });
            
            if (result.success) {
                return {
                    id: result.data.id,
                    name: studentData.name,
                    phone: studentData.phone,
                    parentName: studentData.parentName,
                    halqaId: studentData.halqaId,
                    age: studentData.age
                };
            }
            return null;
        }
        
        // استخدام التخزين المحلي
        var students = await getStudents();
        
        // إنشاء معرف فريد للطالب
        var newId = students.length > 0 ? students[students.length - 1].id + 1 : 1;
        
        var newStudent = {
            id: newId,
            name: studentData.name,
            phone: studentData.phone,
            halqaId: studentData.halqaId,
            age: studentData.age
        };
        
        students.push(newStudent);
        saveStudents(students);
        
        return newStudent;
    }

    /**
     * حذف طالب بواسطة المعرف
     */
    async function deleteStudent(studentId) {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            await SupabaseDB.deleteStudent(studentId);
            return;
        }
        
        // استخدام التخزين المحلي
        var students = await getStudents();
        
        var newStudents = students.filter(function(student) {
            return student.id !== studentId;
        });
        
        saveStudents(newStudents);
    }

    /**
     * الحصول على اسم الحلقة من رقمها
     */
    function getHalqaName(halqaId) {
        for (var i = 0; i < availableHalaqat.length; i++) {
            if (availableHalaqat[i].id === halqaId) {
                return availableHalaqat[i].name;
            }
        }
        return 'غير محدد';
    }

    // ===== أحداث النوافذ المنبثقة =====

    /**
     * فتح نافذة إضافة طالب
     */
    addStudentBtn.addEventListener('click', function() {
        addStudentModal.classList.add('active');
        resetForm();
    });

    /**
     * إغلاق نافذة إضافة طالب
     */
    closeModalBtn.addEventListener('click', function() {
        addStudentModal.classList.remove('active');
        resetForm();
    });

    /**
     * فتح نافذة حذف طالب
     */
    deleteStudentBtn.addEventListener('click', function() {
        loadStudentsForDelete();
        deleteStudentModal.classList.add('active');
    });

    /**
     * إغلاق نافذة حذف طالب
     */
    closeDeleteModalBtn.addEventListener('click', function() {
        deleteStudentModal.classList.remove('active');
    });

    /**
     * إغلاق النافذة عند الضغط خارجها
     */
    addStudentModal.addEventListener('click', function(event) {
        if (event.target === addStudentModal) {
            addStudentModal.classList.remove('active');
            resetForm();
        }
    });

    deleteStudentModal.addEventListener('click', function(event) {
        if (event.target === deleteStudentModal) {
            deleteStudentModal.classList.remove('active');
        }
    });

    // ===== فلتر الحلقات في نافذة الحذف =====
    
    filterHalqa.addEventListener('change', function() {
        loadStudentsForDelete();
    });

    // بحث داخل نافذة حذف الطالب
    if (deleteStudentSearch) {
        deleteStudentSearch.addEventListener('input', function() {
            loadStudentsForDelete();
        });
    }

    // ===== أحداث النموذج =====

    /**
     * إرسال نموذج إضافة طالب
     */
    studentForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // جمع البيانات من النموذج
        var studentName = document.getElementById('studentName').value.trim();
        var parentPhone = document.getElementById('parentPhone').value.trim();
        var parentNameField = document.getElementById('parentName');
        var parentName = parentNameField ? parentNameField.value.trim() : '';
        var studentHalqa = document.getElementById('studentHalqa').value;
        var studentAge = document.getElementById('studentAge').value;
        
        // التحقق من البيانات
        if (!studentName) {
            alert('الرجاء إدخال اسم الطالب');
            return;
        }
        
        if (!studentHalqa) {
            alert('الرجاء اختيار الحلقة');
            return;
        }
        
        // إضافة الطالب
        var studentData = {
            name: studentName,
            phone: parentPhone,
            parentName: parentName,
            halqaId: parseInt(studentHalqa),
            age: studentAge ? parseInt(studentAge) : null
        };
        
        var newStudent = await addStudent(studentData);
        
        if (newStudent) {
            // عرض رسالة نجاح
            alert('تم إضافة الطالب "' + studentName + '" بنجاح!');
            
            // إغلاق النافذة وإعادة تعيين النموذج
            addStudentModal.classList.remove('active');
            resetForm();
        } else {
            alert('حدث خطأ أثناء إضافة الطالب');
        }
    });

    /**
     * إعادة تعيين النموذج
     */
    function resetForm() {
        studentForm.reset();
    }

    // ===== قائمة حذف الطلاب =====

    /**
     * تحميل قائمة الطلاب في نافذة الحذف
     */
    async function loadStudentsForDelete() {
        var students = await getStudents();
        var selectedHalqa = filterHalqa.value;
        var searchText = (deleteStudentSearch && deleteStudentSearch.value) ? deleteStudentSearch.value.trim().toLowerCase() : '';
        
        // فلترة حسب الحلقة إذا تم الاختيار
        if (selectedHalqa) {
            students = students.filter(function(student) {
                return student.halqaId === parseInt(selectedHalqa);
            });
        }
        
        // إفراغ القائمة
        studentsList.innerHTML = '';
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p class="empty-message">لا يوجد طلاب مسجلون</p>';
            return;
        }
        
        // فلترة حسب البحث (اسم الطالب أو اسم ولي الأمر أو رقم الهاتف)
        if (searchText) {
            students = students.filter(function(student) {
                var nameMatch = student.name && student.name.toLowerCase().indexOf(searchText) !== -1;
                var phoneMatch = student.phone && student.phone.indexOf(searchText) !== -1;
                var parentMatch = student.parentName && student.parentName.toLowerCase().indexOf(searchText) !== -1;
                return nameMatch || phoneMatch || parentMatch;
            });
        }

        // إنشاء عنصر لكل طالب
        for (var i = 0; i < students.length; i++) {
            var student = students[i];
            var studentItem = createStudentItemHTML(student);
            studentsList.innerHTML += studentItem;
        }
        
        // إضافة أحداث الحذف
        addDeleteButtonEvents();
    }

    /**
     * إنشاء HTML لعنصر الطالب
     */
    function createStudentItemHTML(student) {
        var halqaName = getHalqaName(student.halqaId);
        
        var html = '';
        html += '<div class="student-item" data-id="' + student.id + '">';
        html += '  <div class="student-info">';
        html += '    <span class="student-name">' + student.name + '</span>';
        html += '    <span class="student-halqa">' + halqaName + '</span>';
        html += '    <span class="student-parent">' + (student.parentName ? ('ولي الأمر: ' + student.parentName) : '') + '</span>';
        html += '  </div>';
        html += '  <button class="delete-student-btn" data-id="' + student.id + '">حذف</button>';
        html += '</div>';
        
        return html;
    }

    /**
     * إضافة أحداث لأزرار الحذف
     */
    function addDeleteButtonEvents() {
        var deleteButtons = studentsList.querySelectorAll('.delete-student-btn');
        
        for (var i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener('click', handleDeleteClick);
        }
    }

    /**
     * معالجة الضغط على زر الحذف
     */
    async function handleDeleteClick(event) {
        var studentId = parseInt(event.target.getAttribute('data-id'));
        
        var confirmed = confirm('هل أنت متأكد من حذف هذا الطالب؟');
        
        if (confirmed) {
            await deleteStudent(studentId);
            loadStudentsForDelete();
            alert('تم حذف الطالب بنجاح');
        }
    }

    // ===== نافذة عرض بيانات الطلاب =====

    /**
     * فتح نافذة عرض بيانات الطلاب
     */
    viewStudentBtn.addEventListener('click', function() {
        loadStudentsForView();
        viewStudentModal.classList.add('active');
    });

    /**
     * إغلاق نافذة عرض بيانات الطلاب
     */
    closeViewModalBtn.addEventListener('click', function() {
        viewStudentModal.classList.remove('active');
        searchStudentInput.value = '';
    });

    /**
     * إغلاق النافذة عند الضغط خارجها
     */
    viewStudentModal.addEventListener('click', function(event) {
        if (event.target === viewStudentModal) {
            viewStudentModal.classList.remove('active');
            searchStudentInput.value = '';
        }
    });

    /**
     * البحث في الطلاب
     */
    searchStudentInput.addEventListener('input', function() {
        loadStudentsForView();
    });

    /**
     * فلتر الحلقات في نافذة العرض
     */
    viewFilterHalqa.addEventListener('change', function() {
        loadStudentsForView();
    });

    /**
     * تحميل قائمة الطلاب في جدول العرض
     */
    async function loadStudentsForView() {
        var students = await getStudents();
        var selectedHalqa = viewFilterHalqa.value;
        var searchText = searchStudentInput.value.trim().toLowerCase();
        
        // فلترة حسب الحلقة
        if (selectedHalqa) {
            students = students.filter(function(student) {
                return student.halqaId === parseInt(selectedHalqa);
            });
        }
        
        // فلترة حسب البحث
        if (searchText) {
            students = students.filter(function(student) {
                return student.name.toLowerCase().indexOf(searchText) !== -1 ||
                       (student.phone && student.phone.indexOf(searchText) !== -1);
            });
        }
        
        // إفراغ الجدول
        studentsTableBody.innerHTML = '';
        
        if (students.length === 0) {
            studentsTableBody.innerHTML = '<tr><td colspan="5" class="empty-table-message">لا يوجد طلاب مسجلون</td></tr>';
            return;
        }
        
        // إنشاء صفوف الجدول
        for (var i = 0; i < students.length; i++) {
            var student = students[i];
            var row = createStudentTableRow(student, i + 1);
            studentsTableBody.innerHTML += row;
        }
        // ربط أحداث زر التفاصيل بعد إنشاء الصفوف
        addDetailButtonEvents();
    }

    /**
     * إنشاء صف في جدول الطلاب
     */
    function createStudentTableRow(student, index) {
        var halqaName = getHalqaName(student.halqaId);
        var phone = student.phone || '-';
        var parentName = student.parentName || '-';
        var age = student.age || '-';
        
        var html = '';
        html += '<tr>';
        html += '  <td data-label="#">' + index + '</td>';
        html += '  <td data-label="اسم الطالب">' + student.name + '</td>';
        html += '  <td data-label="الحلقة">' + halqaName + '</td>';
        html += '  <td data-label="رقم ولي الأمر">' + parentName + (phone !== '-' ? (' - ' + phone) : '') + '</td>';
        html += '  <td data-label="العمر">' + age + '</td>';
        html += '  <td data-label="تفاصيل"><button class="detail-btn" data-id="' + student.id + '">تفاصيل</button></td>';
        html += '</tr>';
        
        return html;
    }

    /**
     * ربط أحداث أزرار التفاصيل
     */
    function addDetailButtonEvents() {
        var detailButtons = document.querySelectorAll('.detail-btn');
        for (var i = 0; i < detailButtons.length; i++) {
            detailButtons[i].addEventListener('click', function(event) {
                var id = parseInt(this.getAttribute('data-id'));
                showStudentDetails(id);
            });
        }
    }

    /**
     * إظهار بيانات الطالب (بسيطة عبر alert حالياً)
     */
    async function showStudentDetails(studentId) {
        var students = await getStudents();
        var student = students.find(function(s) { return s.id === studentId; });
        if (!student) {
            alert('الطالب غير موجود');
            return;
        }

        // انتقل لصفحة مستقلة لعرض تفاصيل الطالب مع تمرير المعرف والاسم
        var url = 'student-details.html?studentId=' + student.id;
        url += '&studentName=' + encodeURIComponent(student.name);
        url += '&halqaId=' + (student.halqaId || '');
        window.location.href = url;
    }

    // ===== زر الرجوع =====
    
    backBtn.addEventListener('click', function() {
        // الرجوع مباشرة لصفحة الداشبورد الخاص بالمشرف
        window.location.href = 'supervisor-dashboard.html';
    });

});
