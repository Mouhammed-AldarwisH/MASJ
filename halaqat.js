document.addEventListener('DOMContentLoaded', function() {
    var useDatabase = false;
    if (typeof SupabaseDB !== 'undefined') {
        try { useDatabase = SupabaseDB.init(); } catch (e) { useDatabase = false; }
    }

    // عناصر الواجهة
    var addHalqaBtn = document.getElementById('addHalqaBtn');
    var deleteHalqaBtn = document.getElementById('deleteHalqaBtn');
    var viewHalqaBtn = document.getElementById('viewHalqaBtn');
    var backBtn = document.getElementById('backBtn');

    var addHalqaModal = document.getElementById('addHalqaModal');
    var closeAddHalqaBtn = document.getElementById('closeAddHalqaBtn');
    var halqaForm = document.getElementById('halqaForm');
    var halqaNameInput = document.getElementById('halqaName');
    var halqaMosqueSelect = document.getElementById('halqaMosque');
    var halqaTeacherSelect = document.getElementById('halqaTeacher');
    var halqaStudentsSelect = document.getElementById('halqaStudents');
    // custom multi UI elements
    var teacherMultiBtn = document.getElementById('teacherMultiBtn');
    var teacherPanel = document.getElementById('teacherPanel');
    var teacherList = document.getElementById('teacherList');
    var teacherSearch = document.getElementById('teacherSearch');
    var teacherSelectAll = document.getElementById('teacherSelectAll');

    var studentMultiBtn = document.getElementById('studentMultiBtn');
    var studentPanel = document.getElementById('studentPanel');
    var studentList = document.getElementById('studentList');
    var studentSearch = document.getElementById('studentSearch');
    var studentSelectAll = document.getElementById('studentSelectAll');

    // track selections
    var teacherSelectedIds = [];
    var studentSelectedIds = [];
    var teacherBound = false;
    var studentBound = false;

    var deleteHalqaModal = document.getElementById('deleteHalqaModal');
    var closeDeleteHalqaBtn = document.getElementById('closeDeleteHalqaBtn');
    var halaqatList = document.getElementById('halaqatList');
    var filterMosque = document.getElementById('filterMosque');
    var deleteHalqaSearch = document.getElementById('deleteHalqaSearch');

    var viewHalqaModal = document.getElementById('viewHalqaModal');
    var closeViewHalqaBtn = document.getElementById('closeViewHalqaBtn');
    var searchHalqaInput = document.getElementById('searchHalqaInput');
    var viewFilterMosque = document.getElementById('viewFilterMosque');
    var halaqatTableBody = document.getElementById('halaqatTableBody');

    // بيانات افتراضية أو من التخزين
    function getMosques() {
        // حاول الحصول من localStorage: 'mosques'
        try {
            var stored = JSON.parse(localStorage.getItem('mosques') || 'null');
            if (stored && Array.isArray(stored) && stored.length > 0) return stored;
        } catch (e) {}

        // إذا لم توجد، حاول استنتاجها من complexes
        try {
            var complexes = JSON.parse(localStorage.getItem('complexes') || '[]');
            var list = [];
            complexes.forEach(function(c) {
                if (Array.isArray(c.mosques)) {
                    c.mosques.forEach(function(m) {
                        if (m && m.id) list.push(m);
                    });
                }
            });
            if (list.length > 0) return list;
        } catch (e) {}

        // افتراضي
        return [
            { id: 1, name: 'مسجد الفجر' },
            { id: 2, name: 'مسجد النور' }
        ];
    }

    function getHalaqat() {
        if (useDatabase && typeof SupabaseDB !== 'undefined' && SupabaseDB.getHalaqat) {
            return SupabaseDB.getHalaqat();
        }
        try {
            var stored = JSON.parse(localStorage.getItem('halaqat') || 'null');
            if (stored && Array.isArray(stored)) return stored;
        } catch (e) { }

        // لا توجد حلقات مخزنة — أنشئ قائمة فارغة (احذف بيانات العرض التجريبية)
        return [];
    }

    function getTeachers() {
        try { var stored = JSON.parse(localStorage.getItem('teachers') || 'null'); if (stored && Array.isArray(stored) && stored.length>0) return stored; } catch (e) {}
        return [
            { id: 't1', name: 'الشيخ أحمد' },
            { id: 't2', name: 'الشيخ محمد' },
            { id: 't3', name: 'الشيخ خالد' }
        ];
    }

    function saveTeachers(list){
        localStorage.setItem('teachers', JSON.stringify(list||[]));
    }

    function getStudents() {
        try { var stored = JSON.parse(localStorage.getItem('students') || 'null'); if (stored && Array.isArray(stored) && stored.length>0) return stored; } catch (e) {}
        return [
            { id: 's1', name: 'أحمد العلي' },
            { id: 's2', name: 'سلمان السويدي' },
            { id: 's3', name: 'محمد الحسن' },
            { id: 's4', name: 'سعيد المريخ' }
        ];
    }

    function saveStudents(list){
        localStorage.setItem('students', JSON.stringify(list||[]));
    }

    function saveHalaqat(list) {
        localStorage.setItem('halaqat', JSON.stringify(list));
    }

    function addHalqaLocal(halqa) {
        var list = getHalaqat() || [];
        var newId = list.length > 0 ? (list[list.length-1].id + 1) : 1;
        halqa.id = newId;
        list.push(halqa);
        saveHalaqat(list);
        return halqa;
    }

    async function addHalqa(halqaData) {
        if (useDatabase && typeof SupabaseDB !== 'undefined' && SupabaseDB.addHalqa) {
            return await SupabaseDB.addHalqa(halqaData);
        }
        return addHalqaLocal(halqaData);
    }

    async function deleteHalqaById(id) {
        if (useDatabase && typeof SupabaseDB !== 'undefined' && SupabaseDB.deleteHalqa) {
            return await SupabaseDB.deleteHalqa(id);
        }
        var list = getHalaqat();
        list = list.filter(function(h) { return h.id !== id; });
        saveHalaqat(list);
    }

    function getMosqueName(id) {
        var mosques = getMosques();
        for (var i=0;i<mosques.length;i++) if (mosques[i].id === id) return mosques[i].name;
        return 'غير محدد';
    }

    // تهيئة قوائم المساجد في الـ selects
    function populateMosqueSelects() {
        var mosques = getMosques();
        halqaMosqueSelect.innerHTML = '<option value="">اختر المسجد</option>';
        filterMosque.innerHTML = '<option value="">كل المساجد</option>';
        viewFilterMosque.innerHTML = '<option value="">كل المساجد</option>';
        mosques.forEach(function(m) {
            halqaMosqueSelect.innerHTML += '<option value="'+m.id+'">'+m.name+'</option>';
            filterMosque.innerHTML += '<option value="'+m.id+'">'+m.name+'</option>';
            viewFilterMosque.innerHTML += '<option value="'+m.id+'">'+m.name+'</option>';
        });

        // populate teachers and students selects and custom UI
        var teachers = getTeachers();
        if (halqaTeacherSelect) {
            halqaTeacherSelect.innerHTML = '';
            teachers.forEach(function(t){ halqaTeacherSelect.innerHTML += '<option value="'+t.id+'">'+t.name+'</option>'; });
        }
        if (teacherList) {
            teacherList.innerHTML = '';
            teachers.forEach(function(t){
                teacherList.innerHTML += '<div><label><input type="checkbox" class="teacher-checkbox" value="'+t.id+'"> '+t.name+'</label></div>';
            });
            // bind events only once
            if (!teacherBound) bindTeacherMultiEvents();
        }

        var students = getStudents();
        if (halqaStudentsSelect) {
            halqaStudentsSelect.innerHTML = '';
            students.forEach(function(s){ halqaStudentsSelect.innerHTML += '<option value="'+s.id+'">'+s.name+'</option>'; });
        }
        if (studentList) {
            studentList.innerHTML = '';
            students.forEach(function(s){
                studentList.innerHTML += '<div><label><input type="checkbox" class="student-checkbox" value="'+s.id+'"> '+s.name+'</label></div>';
            });
            // bind events only once
            if (!studentBound) bindStudentMultiEvents();
        }
    }

    // teacher multi handlers
    function bindTeacherMultiEvents(){
        // toggle panel
        if (teacherMultiBtn) {
            teacherMultiBtn.addEventListener('click', function(e){
                e.stopPropagation();
                var willOpen = teacherPanel.style.display==='none' || teacherPanel.style.display==='' ;
                teacherPanel.style.display = willOpen ? 'block' : 'none';
                if (willOpen) positionPanel(teacherPanel, teacherMultiBtn);
            });
        }
        // click outside closes (added once globally)
        // (global handler added below after bind functions)
        if (teacherPanel) teacherPanel.addEventListener('click', function(e){ e.stopPropagation(); });

        // search
        if (teacherSearch) teacherSearch.addEventListener('input', function(){ filterMultiList('teacher', this.value); });

        // select all
        if (teacherSelectAll) teacherSelectAll.addEventListener('change', function(){
            var checked = this.checked;
            var boxes = teacherList.querySelectorAll('input.teacher-checkbox');
            teacherSelectedIds = [];
            boxes.forEach(function(b){ b.checked = checked; if (checked) teacherSelectedIds.push(b.value); });
            syncHiddenSelect('teacher');
            updateMultiBtnLabel('teacher');
        });

        // individual
        var tboxes = teacherList.querySelectorAll('input.teacher-checkbox');
        tboxes.forEach(function(b){ b.addEventListener('change', function(){
            teacherSelectedIds = Array.from(teacherList.querySelectorAll('input.teacher-checkbox:checked')).map(function(c){ return c.value; });
            syncHiddenSelect('teacher');
            updateMultiBtnLabel('teacher');
            teacherSelectAll.checked = teacherList.querySelectorAll('input.teacher-checkbox').length === teacherSelectedIds.length;
        }); });

        teacherBound = true;
    }

    // Inline add-teacher handlers
    var openAddTeacherInlineBtn = document.getElementById('openAddTeacherInline');
    var inlineAddTeacher = document.getElementById('inlineAddTeacher');
    var inlineTeacherForm = document.getElementById('inlineTeacherForm');
    var cancelAddTeacherInline = document.getElementById('cancelAddTeacherInline');

    if (openAddTeacherInlineBtn) {
        openAddTeacherInlineBtn.addEventListener('click', function(e){
            e.stopPropagation();
            if (!inlineAddTeacher) return;
            var isHidden = window.getComputedStyle(inlineAddTeacher).display === 'none';
            inlineAddTeacher.style.display = isHidden ? 'block' : 'none';
            if (teacherList) teacherList.style.display = isHidden ? 'none' : '';
        });
    }
    if (cancelAddTeacherInline) cancelAddTeacherInline.addEventListener('click', function(){ if (inlineAddTeacher) inlineAddTeacher.style.display='none'; if (teacherList) teacherList.style.display = ''; });

    if (inlineTeacherForm) {
        inlineTeacherForm.addEventListener('submit', function(e){
            e.preventDefault();
            var fullName = (document.getElementById('newTeacherFullName').value||'').trim();
            var username = (document.getElementById('newTeacherUsername').value||'').trim();
            var password = (document.getElementById('newTeacherPassword').value||'').trim();
            if (!fullName) { alert('الرجاء إدخال اسم المعلم'); return; }

            var teachers = getTeachers() || [];
            var maxN = 0; teachers.forEach(function(t){ var m = (t.id||'').toString().replace(/^t/,''); m = parseInt(m)||0; if (m>maxN) maxN = m; });
            var newId = 't' + (maxN+1);
            var newTeacher = { id: newId, name: fullName, username: username, password: password };
            teachers.push(newTeacher);
            saveTeachers(teachers);

            if (teacherList) {
                var div = document.createElement('div');
                div.innerHTML = '<label><input type="checkbox" class="teacher-checkbox" value="'+newId+'" checked> '+newTeacher.name+'</label>';
                teacherList.insertBefore(div, teacherList.firstChild);
                bindTeacherMultiEvents();
                teacherSelectedIds = Array.from(teacherList.querySelectorAll('input.teacher-checkbox:checked')).map(function(c){ return c.value; });
                syncHiddenSelect('teacher');
                updateMultiBtnLabel('teacher');
            }

            if (inlineAddTeacher) inlineAddTeacher.style.display = 'none';
            if (teacherList) teacherList.style.display = '';
            inlineTeacherForm.reset();
        });
    }

    // student multi handlers
    function bindStudentMultiEvents(){
        if (studentMultiBtn) {
            studentMultiBtn.addEventListener('click', function(e){
                e.stopPropagation();
                var willOpen = studentPanel.style.display==='none' || studentPanel.style.display==='' ;
                studentPanel.style.display = willOpen ? 'block' : 'none';
                if (willOpen) positionPanel(studentPanel, studentMultiBtn);
            });
        }
        if (studentPanel) studentPanel.addEventListener('click', function(e){ e.stopPropagation(); });
        if (studentSearch) studentSearch.addEventListener('input', function(){ filterMultiList('student', this.value); });
        if (studentSelectAll) studentSelectAll.addEventListener('change', function(){
            var checked = this.checked;
            var boxes = studentList.querySelectorAll('input.student-checkbox');
            studentSelectedIds = [];
            boxes.forEach(function(b){ b.checked = checked; if (checked) studentSelectedIds.push(b.value); });
            syncHiddenSelect('student');
            updateMultiBtnLabel('student');
        });
        var sboxes = studentList.querySelectorAll('input.student-checkbox');
        sboxes.forEach(function(b){ b.addEventListener('change', function(){
            studentSelectedIds = Array.from(studentList.querySelectorAll('input.student-checkbox:checked')).map(function(c){ return c.value; });
            syncHiddenSelect('student');
            updateMultiBtnLabel('student');
            studentSelectAll.checked = studentList.querySelectorAll('input.student-checkbox').length === studentSelectedIds.length;
        }); });

        studentBound = true;
    }

    // position multi-panel to avoid being cut off by viewport bottom
    function positionPanel(panel, btn) {
        if (!panel || !btn) return;
        // make the panel fixed and centered in the viewport
        panel.style.position = 'fixed';
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.transform = 'translate(-50%, -50%)';
        // responsive sizing
        panel.style.width = panel.style.width || 'min(90vw, 420px)';
        panel.style.maxHeight = '70vh';
        panel.style.overflow = 'auto';
    }

    // Inline add-student handlers
    var openAddStudentInlineBtn = document.getElementById('openAddStudentInline');
    var inlineAddStudent = document.getElementById('inlineAddStudent');
    var inlineStudentForm = document.getElementById('inlineStudentForm');
    var cancelAddStudentInline = document.getElementById('cancelAddStudentInline');

    if (openAddStudentInlineBtn) {
        openAddStudentInlineBtn.addEventListener('click', function(e){
            e.stopPropagation();
            if (!inlineAddStudent) return;
            var isHidden = window.getComputedStyle(inlineAddStudent).display === 'none';
            inlineAddStudent.style.display = isHidden ? 'block' : 'none';
            if (studentList) studentList.style.display = isHidden ? 'none' : '';
        });
    }
    if (cancelAddStudentInline) cancelAddStudentInline.addEventListener('click', function(){ if (inlineAddStudent) inlineAddStudent.style.display='none'; if (studentList) studentList.style.display = ''; });

    if (inlineStudentForm) {
        inlineStudentForm.addEventListener('submit', function(e){
            e.preventDefault();
            var name = (document.getElementById('newStudentName').value||'').trim();
            var parent = (document.getElementById('newParentName').value||'').trim();
            var phone = (document.getElementById('newParentPhone').value||'').trim();
            var ageVal = document.getElementById('newStudentAge') ? document.getElementById('newStudentAge').value : null;
            var age = ageVal ? (parseInt(ageVal) || null) : null;
            if (!name) { alert('الرجاء إدخال اسم الطالب'); return; }

            // create new student id
            var students = getStudents() || [];
            // compute new id as sN
            var maxN = 0; students.forEach(function(s){ var m = (s.id||'').toString().replace(/^s/,''); m = parseInt(m)||0; if (m>maxN) maxN = m; });
            var newId = 's' + (maxN+1);
            var newStudent = { id: newId, name: name, parent: parent, phone: phone, age: age };
            students.push(newStudent);
            saveStudents(students);

            // add to studentList UI
            if (studentList) {
                var div = document.createElement('div');
                div.innerHTML = '<label><input type="checkbox" class="student-checkbox" value="'+newId+'" checked> '+newStudent.name+'</label>';
                studentList.insertBefore(div, studentList.firstChild);
                // rebind events for checkboxes
                bindStudentMultiEvents();
                // mark selected
                studentSelectedIds = Array.from(studentList.querySelectorAll('input.student-checkbox:checked')).map(function(c){ return c.value; });
                syncHiddenSelect('student');
                updateMultiBtnLabel('student');
            }

            if (inlineAddStudent) inlineAddStudent.style.display = 'none';
            if (studentList) studentList.style.display = '';
            inlineStudentForm.reset();
        });
    }

    // add a single document click handler to close panels (avoid multiple bindings)
    document.addEventListener('click', function(){ if (teacherPanel) teacherPanel.style.display='none'; if (studentPanel) studentPanel.style.display='none'; });


    function filterMultiList(type, q){
        var listEl = (type==='teacher') ? teacherList : studentList;
        if (!listEl) return;
        var ql = (q||'').trim().toLowerCase();
        Array.from(listEl.children).forEach(function(div){
            var text = div.textContent || div.innerText || '';
            div.style.display = (text.toLowerCase().indexOf(ql)===-1) ? 'none' : 'block';
        });
    }

    function syncHiddenSelect(type){
        if (type==='teacher' && halqaTeacherSelect){
            // clear and re-add options as selected
            Array.from(halqaTeacherSelect.options).forEach(function(o){ o.selected = false; });
            teacherSelectedIds.forEach(function(id){
                var opt = halqaTeacherSelect.querySelector('option[value="'+id+'"]');
                if (opt) opt.selected = true;
            });
        }
        if (type==='student' && halqaStudentsSelect){
            Array.from(halqaStudentsSelect.options).forEach(function(o){ o.selected = false; });
            studentSelectedIds.forEach(function(id){
                var opt = halqaStudentsSelect.querySelector('option[value="'+id+'"]');
                if (opt) opt.selected = true;
            });
        }
    }

    function updateMultiBtnLabel(type){
        if (type==='teacher' && teacherMultiBtn){
            if (teacherSelectedIds.length===0) teacherMultiBtn.textContent = 'اختر المعلمين';
            else teacherMultiBtn.textContent = 'المعلمين: '+teacherSelectedIds.length;
        }
        if (type==='student' && studentMultiBtn){
            if (studentSelectedIds.length===0) studentMultiBtn.textContent = 'اختر الطلاب';
            else studentMultiBtn.textContent = 'الطلاب: '+studentSelectedIds.length;
        }
    }

    // أحداث النوافذ
    addHalqaBtn.addEventListener('click', function(){
        populateMosqueSelects();
        // clear previous selections and UI state
        teacherSelectedIds = [];
        studentSelectedIds = [];
        if (teacherList) { Array.from(teacherList.querySelectorAll('input.teacher-checkbox')).forEach(function(b){ b.checked = false; }); }
        if (studentList) { Array.from(studentList.querySelectorAll('input.student-checkbox')).forEach(function(b){ b.checked = false; }); }
        if (teacherSelectAll) teacherSelectAll.checked = false;
        if (studentSelectAll) studentSelectAll.checked = false;
        syncHiddenSelect('teacher'); syncHiddenSelect('student');
        updateMultiBtnLabel('teacher'); updateMultiBtnLabel('student');
        halqaForm.reset();
        addHalqaModal.classList.add('active');
    });
    closeAddHalqaBtn.addEventListener('click', function(){ addHalqaModal.classList.remove('active'); halqaForm.reset(); });
    addHalqaModal.addEventListener('click', function(e){ if (e.target===addHalqaModal) { addHalqaModal.classList.remove('active'); halqaForm.reset(); } });

    deleteHalqaBtn.addEventListener('click', function(){ populateMosqueSelects(); loadHalaqatForDelete(); deleteHalqaModal.classList.add('active'); });
    closeDeleteHalqaBtn.addEventListener('click', function(){ deleteHalqaModal.classList.remove('active'); });
    deleteHalqaModal.addEventListener('click', function(e){ if (e.target===deleteHalqaModal) deleteHalqaModal.classList.remove('active'); });

    viewHalqaBtn.addEventListener('click', function(){ populateMosqueSelects(); loadHalaqatForView(); viewHalqaModal.classList.add('active'); });
    closeViewHalqaBtn.addEventListener('click', function(){ viewHalqaModal.classList.remove('active'); searchHalqaInput.value=''; });
    viewHalqaModal.addEventListener('click', function(e){ if (e.target===viewHalqaModal) { viewHalqaModal.classList.remove('active'); searchHalqaInput.value=''; } });

    // رجوع
    backBtn.addEventListener('click', function(){ window.location.href = 'supervisor-dashboard.html'; });

    // فلتر البحث في حذف
    filterMosque.addEventListener('change', loadHalaqatForDelete);
    if (deleteHalqaSearch) deleteHalqaSearch.addEventListener('input', loadHalaqatForDelete);

    // فلتر وعرض في الـ view
    if (searchHalqaInput) searchHalqaInput.addEventListener('input', loadHalaqatForView);
    viewFilterMosque.addEventListener('change', loadHalaqatForView);

    // حفظ نموذج إضافة حلقة
    halqaForm.addEventListener('submit', async function(e){
        e.preventDefault();
        var name = (halqaNameInput.value||'').trim();
        var mosqueId = parseInt(halqaMosqueSelect.value) || null;
        if (!name) { alert('الرجاء إدخال اسم الحلقة'); return; }
        if (!mosqueId) { alert('الرجاء اختيار المسجد'); return; }

        // المعلمين والطلاب المحددين — تُجمع من المصفوفات التي يديرها الـ UI
        var teacherIds = teacherSelectedIds.slice();
        var studentIds = studentSelectedIds.slice();

        var halqaData = { name: name, mosqueId: mosqueId, teachers: teacherIds, students: studentIds };
        var added = await addHalqa(halqaData);
        if (added) {
            alert('تم إضافة الحلقة بنجاح');
            addHalqaModal.classList.remove('active');
            halqaForm.reset();
        } else {
            alert('حدث خطأ أثناء الإضافة');
        }
    });

    // تحميل للحذف
    async function loadHalaqatForDelete() {
        var list = await (getHalaqat() || []);
        var selected = filterMosque.value;
        var search = (deleteHalqaSearch && deleteHalqaSearch.value) ? deleteHalqaSearch.value.trim().toLowerCase() : '';
        if (selected) list = list.filter(function(h){ return h.mosqueId === parseInt(selected); });
        if (search) list = list.filter(function(h){ return h.name.toLowerCase().indexOf(search) !== -1; });

        halaqatList.innerHTML = '';
        if (!list || list.length===0) { halaqatList.innerHTML = '<p class="empty-message">لا توجد حلقات</p>'; return; }

        list.forEach(function(h){
            var html = '';
            html += '<div class="student-item" data-id="'+h.id+'">';
            html += '<div class="student-info">';
            html += '<span class="student-name">'+h.name+'</span>';
            html += '<span class="student-halqa">'+getMosqueName(h.mosqueId)+'</span>';
            html += '</div>';
            html += '<button class="delete-student-btn" data-id="'+h.id+'">حذف</button>';
            html += '</div>';
            halaqatList.innerHTML += html;
        });
        addDeleteEvents();
    }

    function addDeleteEvents() {
        var btns = halaqatList.querySelectorAll('.delete-student-btn');
        btns.forEach(function(b){ b.addEventListener('click', handleDeleteHalqa); });
    }

    async function handleDeleteHalqa(e) {
        var id = parseInt(e.target.getAttribute('data-id'));
        if (!confirm('هل أنت متأكد من حذف هذه الحلقة؟')) return;
        await deleteHalqaById(id);
        loadHalaqatForDelete();
        alert('تم الحذف');
    }

    // عرض في الجدول
    async function loadHalaqatForView() {
        var list = await (getHalaqat() || []);
        var selected = viewFilterMosque.value;
        var search = (searchHalqaInput && searchHalqaInput.value) ? searchHalqaInput.value.trim().toLowerCase() : '';
        if (selected) list = list.filter(function(h){ return h.mosqueId === parseInt(selected); });
        if (search) list = list.filter(function(h){ return h.name.toLowerCase().indexOf(search) !== -1; });

        halaqatTableBody.innerHTML = '';
        if (!list || list.length===0) { halaqatTableBody.innerHTML = '<tr><td colspan="4" class="empty-table-message">لا توجد حلقات</td></tr>'; return; }

        for (var i=0;i<list.length;i++) {
            var h = list[i];
            var row = '';
            row += '<tr>';
            row += '<td data-label="#">'+(i+1)+'</td>';
            row += '<td data-label="اسم الحلقة">'+h.name+'</td>';
            row += '<td data-label="المسجد">'+getMosqueName(h.mosqueId)+'</td>';
            row += '<td data-label="تفاصيل"><button class="detail-btn" data-id="'+h.id+'">تفاصيل</button></td>';
            row += '</tr>';
            halaqatTableBody.innerHTML += row;
        }
        addDetailEvents();
    }

    function addDetailEvents() {
        var ds = document.querySelectorAll('.detail-btn');
        ds.forEach(function(d){ d.addEventListener('click', function(){ var id = parseInt(this.getAttribute('data-id')); window.location.href = 'halaqa-details.html?halqaId='+id; }); });
    }

    // تهيئة مبدئية
    populateMosqueSelects();
});