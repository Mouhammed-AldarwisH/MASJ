document.addEventListener('DOMContentLoaded', function() {
    // helpers to read stored data (mirrors logic in halaqat.js)
    function getMosques() {
        try { var stored = JSON.parse(localStorage.getItem('mosques') || 'null'); if (stored && Array.isArray(stored)) return stored; } catch(e){}
        try { var complexes = JSON.parse(localStorage.getItem('complexes') || '[]'); var list=[]; complexes.forEach(function(c){ if (Array.isArray(c.mosques)) c.mosques.forEach(function(m){ if (m && m.id) list.push(m); }); }); if (list.length) return list; } catch(e){}
        return [ { id:1, name:'مسجد الفجر' }, { id:2, name:'مسجد النور' } ];
    }

    function getHalaqat() {
        try { var stored = JSON.parse(localStorage.getItem('halaqat') || 'null'); if (stored && Array.isArray(stored)) return stored; } catch(e){}
        return [];
    }

    function getTeachers() {
        try { var stored = JSON.parse(localStorage.getItem('teachers') || 'null'); if (stored && Array.isArray(stored)) return stored; } catch(e){}
        return [ { id:'t1', name:'الشيخ أحمد' }, { id:'t2', name:'الشيخ محمد' } ];
    }

    function getStudents() {
        try { var stored = JSON.parse(localStorage.getItem('students') || 'null'); if (stored && Array.isArray(stored)) return stored; } catch(e){}
        return [ { id:'s1', name:'أحمد العلي', parent:'ولي الأمر', phone:'0501111111', age:12 }, { id:'s2', name:'سلمان السويدي', parent:'سالم', phone:'0502222222', age:13 } ];
    }

    function qs(name){
        var params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function getMosqueName(id){
        var list = getMosques();
        for (var i=0;i<list.length;i++) if (list[i].id == id) return list[i].name;
        return 'غير محدد';
    }

    var backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', function(){ window.location.href = 'halaqat.html'; });

    var halqaIdRaw = qs('halqaId');
    if (!halqaIdRaw) {
        document.getElementById('halqaTitle').textContent = 'تفاصيل الحلقة';
        document.getElementById('halaqaStudentsTableBody').innerHTML = '<tr><td colspan="5" class="empty-table-message">معرف الحلقة غير محدد</td></tr>';
        return;
    }

    // support numeric or string ids
    var halqaId = (halqaIdRaw.match(/^\d+$/)) ? parseInt(halqaIdRaw) : halqaIdRaw;

    var halaqat = getHalaqat();
    var halqa = halaqat.find(function(h){ return (h.id == halqaId); });
    if (!halqa) {
        document.getElementById('halqaTitle').textContent = 'حلقة غير موجودة';
        document.getElementById('halaqaStudentsTableBody').innerHTML = '<tr><td colspan="5" class="empty-table-message">لا توجد بيانات لهذه الحلقة</td></tr>';
        return;
    }

    document.getElementById('halqaTitle').textContent = halqa.name || 'تفاصيل الحلقة';

    // render teachers
    var teachersListEl = document.getElementById('teachersList');
    teachersListEl.innerHTML = '';
    var allTeachers = getTeachers();
    var teacherIds = Array.isArray(halqa.teachers) ? halqa.teachers : [];
    if (teacherIds.length === 0) {
        teachersListEl.innerHTML = '<p class="empty-message">لا يوجد معلمون مرتبطون بهذه الحلقة</p>';
    } else {
        teacherIds.forEach(function(tid){
            var t = allTeachers.find(function(x){ return x.id == tid; }) || { id: tid, name: tid };
            var div = document.createElement('div');
            div.className = 'teacher-item';
            div.innerHTML = '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">'
                + '<div><strong>'+ (t.name||'غير معروف') +'</strong><div class="muted">'+ (t.username?('اسم المستخدم: '+t.username):'') +'</div></div>'
                + '<div><button class="teacher-detail-btn" data-id="'+t.id+'">تفاصيل</button></div>'
                + '</div>';
            teachersListEl.appendChild(div);
        });
    }

    // when clicking teacher details, show small info panel (inline)
    teachersListEl.addEventListener('click', function(e){
        if (!e.target.classList.contains('teacher-detail-btn')) return;
        var id = e.target.getAttribute('data-id');
        var all = getTeachers();
        var teacher = all.find(function(x){ return x.id == id; }) || { id: id, name: id };
        // create or toggle panel
        var existing = document.getElementById('teacherInfoPanel');
        if (existing) existing.remove();
        var panel = document.createElement('div');
        panel.id = 'teacherInfoPanel';
        panel.className = 'teacher-info-panel';
        panel.style.marginTop = '8px';
        panel.style.padding = '12px';
        panel.style.border = '1px solid #e5e5e5';
        panel.style.borderRadius = '8px';
        panel.innerHTML = '<strong>'+ (teacher.name||'') +'</strong><div>المعرف: '+teacher.id+'</div>' + (teacher.username?('<div>اسم المستخدم: '+teacher.username+'</div>'):'') + '<div style="margin-top:8px;"><button id="closeTeacherInfo">إغلاق</button></div>';
        e.target.closest('.teacher-item').appendChild(panel);
        var close = document.getElementById('closeTeacherInfo');
        if (close) close.addEventListener('click', function(){ panel.remove(); });
    });

    // render students table
    var studentsBody = document.getElementById('halaqaStudentsTableBody');
    studentsBody.innerHTML = '';
    var allStudents = getStudents();
    var studentIds = Array.isArray(halqa.students) ? halqa.students : [];
    if (studentIds.length === 0) {
        studentsBody.innerHTML = '<tr><td colspan="5" class="empty-table-message">لا يوجد طلاب في هذه الحلقة</td></tr>';
    } else {
        for (var i=0;i<studentIds.length;i++){
            var sid = studentIds[i];
            var s = allStudents.find(function(x){ return x.id == sid; }) || { id: sid, name: sid };
            var row = document.createElement('tr');
            row.innerHTML = '<td data-label="#">'+(i+1)+'</td>'
                + '<td data-label="اسم الطالب">'+(s.name||'-')+'</td>'
                + '<td data-label="ولي الأمر / هاتف">'+((s.parent? s.parent : (s.parentName||'-')) + (s.phone?(' - '+s.phone):''))+'</td>'
                + '<td data-label="العمر">'+(s.age||'-')+'</td>'
                + '<td data-label="تفاصيل"><button class="student-detail-btn" data-id="'+s.id+'">تفاصيل</button></td>';
            studentsBody.appendChild(row);
        }
    }

    // student detail navigation
    studentsBody.addEventListener('click', function(e){
        if (!e.target.classList.contains('student-detail-btn')) return;
        var id = e.target.getAttribute('data-id');
        // navigate to student details page if exists
        window.location.href = 'student-details.html?studentId=' + encodeURIComponent(id);
    });

});
