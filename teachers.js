// الانتظار حتى تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {

    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }

    // ===== المتغيرات العامة =====
    
    // العناصر الرئيسية
    var addTeacherBtn = document.getElementById('addTeacherBtn');
    var deleteTeacherBtn = document.getElementById('deleteTeacherBtn');
    var backBtn = document.getElementById('backBtn');
    
    // نافذة إضافة معلم
    var addTeacherModal = document.getElementById('addTeacherModal');
    var closeModalBtn = document.getElementById('closeModalBtn');
    var teacherForm = document.getElementById('teacherForm');
    
    // نافذة حذف معلم
    var deleteTeacherModal = document.getElementById('deleteTeacherModal');
    var closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    var teachersList = document.getElementById('teachersList');
    var deleteTeacherSearch = document.getElementById('deleteTeacherSearch');
    
    // القائمة المنسدلة
    var dropdownBtn = document.getElementById('dropdownBtn');
    var dropdownMenu = document.getElementById('dropdownMenu');

    // ===== بيانات الحلقات المتاحة =====
    // جلب الحلقات من localStorage إن وُجدت؛ تجنب بيانات العرض التجريبية الثابتة
    var availableHalaqat = (function(){
        try {
            var list = JSON.parse(localStorage.getItem('halaqat') || '[]');
            if (Array.isArray(list)) return list.map(function(h){ return { id: h.id, name: h.name }; });
        } catch (e) {}
        return [];
    })();

    // ملء قائمة الحلقات في القائمة المنسدلة ديناميكياً
    function populateHalaqatDropdown(){
        if (!dropdownMenu) return;
        dropdownMenu.innerHTML = '';
        availableHalaqat.forEach(function(h){
            var label = document.createElement('label');
            label.className = 'dropdown-item';
            label.innerHTML = '<input type="checkbox" name="halaqat" value="'+h.id+'">' +
                              '<span class="checkbox-custom"></span>' +
                              '<span class="item-text">'+(h.name||'')+'</span>';
            dropdownMenu.appendChild(label);
        });
    }
    populateHalaqatDropdown();

    // بعد الملء، اربط أحداث تغيير الاختيارات
    if (dropdownMenu) {
        var dynamicCheckboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]');
        for (var _i = 0; _i < dynamicCheckboxes.length; _i++) {
            dynamicCheckboxes[_i].addEventListener('change', updateDropdownText);
        }
    }

    // ===== الدوال المساعدة =====

    /**
     * جلب قائمة المعلمين من التخزين المحلي أو قاعدة البيانات
     * نستخدم localStorage لحفظ البيانات مؤقتاً حتى ربطها بقاعدة بيانات
     */
    async function getTeachers() {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            var users = await SupabaseDB.getUsers('teacher');
            // تحويل البيانات للشكل المتوقع
            var teachers = [];
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                // جلب الحلقات المسندة للمعلم
                var halaqat = await SupabaseDB.getTeacherHalaqat(user.id);
                var halaqatIds = halaqat.map(function(h) { return h.id; });
                
                teachers.push({
                    id: user.id,
                    name: user.user_name,
                    username: user.user_email,
                    password: '********', // لا نعرض كلمة المرور
                    halaqat: halaqatIds
                });
            }
            return teachers;
        }
        
        // استخدام التخزين المحلي
        var teachersData = localStorage.getItem('teachers');
        if (teachersData) {
            return JSON.parse(teachersData);
        }
        return [];
    }

    /**
     * حفظ قائمة المعلمين في التخزين المحلي
     */
    function saveTeachers(teachers) {
        localStorage.setItem('teachers', JSON.stringify(teachers));
    }

    /**
     * إضافة معلم جديد
     */
    async function addTeacher(teacherData) {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase) {
            // إضافة المستخدم أولاً
            var result = await SupabaseDB.addUser({
                email: teacherData.username,
                password: teacherData.password,
                name: teacherData.name || teacherData.username,
                role: 'teacher'
            });
            
            if (result.success) {
                // إسناد الحلقات للمعلم
                await SupabaseDB.assignHalaqatToTeacher(result.data.id, teacherData.halaqat);
                
                return {
                    id: result.data.id,
                    name: teacherData.name || teacherData.username,
                    username: teacherData.username,
                    halaqat: teacherData.halaqat
                };
            }
            return null;
        }
        
        // استخدام التخزين المحلي
        var teachers = await getTeachers();
        
        // إنشاء معرف فريد للمعلم
        var newId = teachers.length > 0 ? teachers[teachers.length - 1].id + 1 : 1;
        
        var newTeacher = {
            id: newId,
            name: teacherData.name || '',
            username: teacherData.username,
            password: teacherData.password,
            halaqat: teacherData.halaqat // مصفوفة بأرقام الحلقات المسندة
        };
        
        teachers.push(newTeacher);
        saveTeachers(teachers);
        
        return newTeacher;
    }

    /**
     * حذف معلم بواسطة المعرف
     */
    async function deleteTeacher(teacherId) {
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        // ملاحظة: في قاعدة البيانات نعطّل المستخدم بدلاً من حذفه
        if (useDatabase) {
            // يمكن إضافة دالة تعطيل المعلم لاحقاً
            return;
        }
        
        // استخدام التخزين المحلي
        var teachers = await getTeachers();
        
        // البحث عن المعلم وحذفه
        var newTeachers = teachers.filter(function(teacher) {
            return teacher.id !== teacherId;
        });
        
        saveTeachers(newTeachers);
    }

    /**
     * الحصول على أسماء الحلقات من أرقامها
     */
    function getHalaqatNames(halaqatIds) {
        var names = [];
        
        for (var i = 0; i < halaqatIds.length; i++) {
            var halqaId = halaqatIds[i];
            
            for (var j = 0; j < availableHalaqat.length; j++) {
                if (availableHalaqat[j].id === halqaId) {
                    names.push(availableHalaqat[j].name);
                    break;
                }
            }
        }
        
        return names.join('، ');
    }

    // ===== أحداث النوافذ المنبثقة =====

    /**
     * فتح نافذة إضافة معلم
     */
    addTeacherBtn.addEventListener('click', function() {
        addTeacherModal.classList.add('active');
        resetForm();
    });

    /**
     * إغلاق نافذة إضافة معلم
     */
    closeModalBtn.addEventListener('click', function() {
        addTeacherModal.classList.remove('active');
        resetForm();
    });

    /**
     * فتح نافذة حذف معلم
     */
    deleteTeacherBtn.addEventListener('click', function() {
        loadTeachersForDelete();
        deleteTeacherModal.classList.add('active');
    });

    // بحث داخل نافذة حذف المعلم
    if (deleteTeacherSearch) {
        deleteTeacherSearch.addEventListener('input', function() {
            loadTeachersForDelete();
        });
    }

    /**
     * إغلاق نافذة حذف معلم
     */
    closeDeleteModalBtn.addEventListener('click', function() {
        deleteTeacherModal.classList.remove('active');
    });

    /**
     * إغلاق النافذة عند الضغط خارجها
     */
    addTeacherModal.addEventListener('click', function(event) {
        if (event.target === addTeacherModal) {
            addTeacherModal.classList.remove('active');
            resetForm();
        }
    });

    deleteTeacherModal.addEventListener('click', function(event) {
        if (event.target === deleteTeacherModal) {
            deleteTeacherModal.classList.remove('active');
        }
    });

    // ===== أحداث القائمة المنسدلة =====

    /**
     * فتح/إغلاق القائمة المنسدلة
     */
    dropdownBtn.addEventListener('click', function() {
        dropdownBtn.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
    });

    /**
     * إغلاق القائمة عند الضغط خارجها
     */
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-wrapper')) {
            dropdownBtn.classList.remove('active');
            dropdownMenu.classList.remove('show');
        }
    });

    /**
     * (روابط الأحداث لخيارات الحلقات تُنشأ بعد ملء القائمة ديناميكياً)
     */

    /**
     * تحديث نص القائمة المنسدلة بناءً على الاختيارات
     */
    function updateDropdownText() {
        var selectedItems = dropdownMenu.querySelectorAll('input[type="checkbox"]:checked');
        var dropdownText = document.querySelector('.dropdown-text');
        
        if (selectedItems.length === 0) {
            dropdownText.textContent = 'الحلقات المسندة';
        } else if (selectedItems.length === 1) {
            var selectedLabel = selectedItems[0].parentElement.querySelector('.item-text');
            dropdownText.textContent = selectedLabel.textContent;
        } else {
            dropdownText.textContent = 'تم اختيار ' + selectedItems.length + ' حلقات';
        }
    }

    // ===== أحداث النموذج =====

    /**
     * إرسال نموذج إضافة معلم
     */
    teacherForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // جمع البيانات من النموذج
        var teacherFullName = document.getElementById('teacherFullName') ? document.getElementById('teacherFullName').value.trim() : '';
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value.trim();
        
        // جمع الحلقات المختارة
        var selectedHalaqat = [];
        var checkedBoxes = dropdownMenu.querySelectorAll('input[type="checkbox"]:checked');
        
        for (var i = 0; i < checkedBoxes.length; i++) {
            selectedHalaqat.push(parseInt(checkedBoxes[i].value));
        }
        
        // التحقق من البيانات
        if (!teacherFullName) {
            alert('الرجاء إدخال اسم المعلم');
            return;
        }

        if (!username || !password) {
            alert('الرجاء إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        if (selectedHalaqat.length === 0) {
            alert('الرجاء اختيار حلقة واحدة على الأقل');
            return;
        }
        
        // إضافة المعلم
        var teacherData = {
            name: teacherFullName,
            username: username,
            password: password,
            halaqat: selectedHalaqat
        };
        
        var newTeacher = await addTeacher(teacherData);
        
        if (newTeacher) {
            // عرض رسالة نجاح
            alert('تم إضافة المعلم "' + (teacherFullName || username) + '" بنجاح!');
            
            // إغلاق النافذة وإعادة تعيين النموذج
            addTeacherModal.classList.remove('active');
            resetForm();
        } else {
            alert('حدث خطأ أثناء إضافة المعلم. قد يكون البريد الإلكتروني مستخدماً.');
        }
    });

    /**
     * إعادة تعيين النموذج
     */
    function resetForm() {
        teacherForm.reset();
        
        // إعادة تعيين checkboxes
        var allCheckboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]');
        for (var i = 0; i < allCheckboxes.length; i++) {
            allCheckboxes[i].checked = false;
        }
        
        // إعادة تعيين نص القائمة
        document.querySelector('.dropdown-text').textContent = 'الحلقات المسندة';
        
        // إغلاق القائمة المنسدلة
        dropdownBtn.classList.remove('active');
        dropdownMenu.classList.remove('show');
    }

    // ===== قائمة حذف المعلمين =====

    /**
     * تحميل قائمة المعلمين في نافذة الحذف
     */
    async function loadTeachersForDelete() {
        var teachers = await getTeachers();
        var searchText = (deleteTeacherSearch && deleteTeacherSearch.value) ? deleteTeacherSearch.value.trim().toLowerCase() : '';
        
        // إفراغ القائمة
        teachersList.innerHTML = '';
        
        if (teachers.length === 0) {
            teachersList.innerHTML = '<p class="empty-message">لا يوجد معلمون مسجلون</p>';
            return;
        }
        
        // فلترة حسب البحث (اسم المستخدم أو اسم المعلم)
        if (searchText) {
            teachers = teachers.filter(function(teacher) {
                var uname = teacher.username || '';
                var tname = teacher.name || '';
                return (uname.toLowerCase().indexOf(searchText) !== -1) || (tname.toLowerCase().indexOf(searchText) !== -1);
            });
        }

        // إنشاء عنصر لكل معلم
        for (var i = 0; i < teachers.length; i++) {
            var teacher = teachers[i];
            var teacherItem = createTeacherItemHTML(teacher);
            teachersList.innerHTML += teacherItem;
        }
        
        // إضافة أحداث الحذف
        addDeleteButtonEvents();
    }

    /**
     * إنشاء HTML لعنصر المعلم
     */
    function createTeacherItemHTML(teacher) {
        var halaqatNames = getHalaqatNames(teacher.halaqat);
        
        var html = '';
        html += '<div class="teacher-item" data-id="' + teacher.id + '">';
        html += '  <div class="teacher-info">';
        html += '    <span class="teacher-name">' + (teacher.name || teacher.username) + '</span>';
        html += '    <span class="teacher-halaqat">' + halaqatNames + '</span>';
        html += '  </div>';
        html += '  <button class="delete-teacher-btn" data-id="' + teacher.id + '">حذف</button>';
        html += '</div>';
        
        return html;
    }

    /**
     * إضافة أحداث لأزرار الحذف
     */
    function addDeleteButtonEvents() {
        var deleteButtons = teachersList.querySelectorAll('.delete-teacher-btn');
        
        for (var i = 0; i < deleteButtons.length; i++) {
            deleteButtons[i].addEventListener('click', handleDeleteClick);
        }
    }

    /**
     * معالجة الضغط على زر الحذف
     */
    async function handleDeleteClick(event) {
        var teacherId = parseInt(event.target.getAttribute('data-id'));
        
        // تأكيد الحذف
        var confirmed = confirm('هل أنت متأكد من حذف هذا المعلم؟');
        
        if (confirmed) {
            await deleteTeacher(teacherId);
            loadTeachersForDelete(); // إعادة تحميل القائمة
            alert('تم حذف المعلم بنجاح');
        }
    }

    // ===== زر الرجوع =====
    
    backBtn.addEventListener('click', function() {
        // الرجوع مباشرة لصفحة الداشبورد الخاص بالمشرف
        window.location.href = 'supervisor-dashboard.html';
    });

});
