// student-details.js
document.addEventListener('DOMContentLoaded', function(){
    var urlParams = new URLSearchParams(window.location.search);
    var studentId = urlParams.get('studentId');
    var studentName = urlParams.get('studentName') ? decodeURIComponent(urlParams.get('studentName')) : 'طالب';
    var halqaId = urlParams.get('halqaId') || '';

    var sdStudentName = document.getElementById('sdStudentName');
    var sdHalqaName = document.getElementById('sdHalqaName');
    var attendanceBtn = document.getElementById('attendanceBtn');
    var recitationBtn = document.getElementById('recitationBtn');
    var attendanceView = document.getElementById('attendanceView');
    var recitationView = document.getElementById('recitationView');
    var prevWeek = document.getElementById('prevWeek');
    var nextWeek = document.getElementById('nextWeek');
    var weekLabel = document.getElementById('weekLabel');
    var attendanceBody = document.getElementById('attendanceBody');
    // recitation elements
    var prevRecDay = document.getElementById('prevRecDay');
    var nextRecDay = document.getElementById('nextRecDay');
    var recDateLabel = document.getElementById('recDateLabel');
    var recitationList = document.getElementById('recitationList');
    var backToStudents = document.getElementById('backToStudents');
    var fromParam = urlParams.get('from');

    sdStudentName.textContent = studentName;
    sdHalqaName.textContent = halqaId ? ('الحلقة رقم ' + halqaId) : '';

    var currentWeekOffset = 0; // 0 = current week, -1 previous, +1 next

    // قائمة أسماء السور (مختصرة ومطابقة لقائمة recitation.js)
    var surahNames = [
        'الفاتحة','البقرة','آل عمران','النساء','المائدة','الأنعام','الأعراف','الأنفال','التوبة','يونس',
        'هود','يوسف','الرعد','إبراهيم','الحجر','النحل','الإسراء','الكهف','مريم','طه',
        'الأنبياء','الحج','المؤمنون','النور','الفرقان','الشعراء','النمل','القصص','العنكبوت','الروم',
        'لقمان','السجدة','الأحزاب','سبأ','فاطر','يس','الصافات','ص','الزمر','غافر',
        'فصلت','الشورى','الزخرف','الدخان','الجاثية','الأحقاف','محمد','الفتح','الحجرات','ق',
        'الذاريات','الطور','النجم','القمر','الرحمن','الواقعة','الحديد','المجادلة','الحشر','الممتحنة',
        'الصف','الجمعة','المنافقون','التغابن','الطلاق','التحريم','الملك','القلم','الحاقة','المعارج',
        'نوح','الجن','المزمل','المدثر','القيامة','الإنسان','المرسلات','النبأ','النازعات','عبس',
        'التكوير','الانفطار','المطففين','الانشقاق','البروج','الطارق','الأعلى','الغاشية','الفجر','البلد',
        'الشمس','الليل','الضحى','الشرح','التين','العلق','القدر','البينة','الزلزلة','العاديات',
        'القارعة','التكاثر','العصر','الهمزة','الفيل','قريش','الماعون','الكوثر','الكافرون','النصر',
        'المسد','الإخلاص','الفلق','الناس'
    ];

    attendanceBtn.addEventListener('click', function(){
        attendanceBtn.classList.add('active');
        recitationBtn.classList.remove('active');
        attendanceView.style.display = '';
        recitationView.style.display = 'none';
    });
    recitationBtn.addEventListener('click', function(){
        recitationBtn.classList.add('active');
        attendanceBtn.classList.remove('active');
        attendanceView.style.display = 'none';
        recitationView.style.display = '';
    });

    prevWeek.addEventListener('click', function(){
        currentWeekOffset -= 1;
        renderWeek();
    });
    nextWeek.addEventListener('click', function(){
        currentWeekOffset += 1;
        renderWeek();
    });

    backToStudents.addEventListener('click', function(){
        // If opened from parent dashboard, return there; otherwise try history.back(),
        // fall back to students.html.
        if (fromParam === 'parent') {
            window.location.href = 'parent-dashboard.html';
            return;
        }

        if (document.referrer && document.referrer.indexOf('parent-dashboard.html') !== -1) {
            window.location.href = 'parent-dashboard.html';
            return;
        }

        if (history.length > 1) {
            history.back();
            return;
        }

        window.location.href = 'students.html';
    });

    function renderWeek(){
        var startOfWeek = getStartOfWeek(new Date(), currentWeekOffset);
        var days = [];
        for(var i=0;i<7;i++){
            var d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }

        weekLabel.textContent = formatWeekLabel(startOfWeek);

        // fake data generation deterministic by studentId + weekOffset
        var rowsHtml = '';
        for(var i=0;i<7;i++){
            var status = fakeStatusFor(studentId, currentWeekOffset, i);
            var cls = statusClass(status);
            rowsHtml += '<tr>';
            rowsHtml += '<td>' + arabicWeekday(days[i].getDay()) + '</td>';
            rowsHtml += '<td>' + formatDate(days[i]) + '</td>';
            rowsHtml += '<td><span class="' + cls + '">' + statusLabel(status) + '</span></td>';
            rowsHtml += '</tr>';
        }
        attendanceBody.innerHTML = rowsHtml;
    }

    function getStartOfWeek(refDate, weekOffset){
        // consider week starting Sunday; make Sunday first
        var d = new Date(refDate);
        // shift by weekOffset weeks
        d.setDate(d.getDate() + weekOffset * 7);
        var day = d.getDay(); // 0 Sun .. 6 Sat
        // compute start (Sunday)
        var start = new Date(d);
        start.setDate(d.getDate() - day);
        start.setHours(0,0,0,0);
        return start;
    }

    function formatWeekLabel(startDate){
        var end = new Date(startDate);
        end.setDate(startDate.getDate() + 6);
        return formatDate(startDate) + ' - ' + formatDate(end);
    }

    function formatDate(d){
        var day = d.getDate();
        var month = d.getMonth() + 1;
        var year = d.getFullYear();
        return day + '/' + month + '/' + year;
    }

    function arabicWeekday(n){
        var arr = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
        return arr[n] || '';
    }

    function fakeStatusFor(studentId, weekOffset, dayIndex){
        // deterministic pseudo-random: combine numbers
        var seed = (parseInt(studentId) || 1) + (weekOffset*7) + dayIndex;
        var mod = seed % 6;
        if(mod === 0) return 'present';
        if(mod === 1) return 'absent';
        if(mod === 2) return 'late';
        if(mod === 3) return 'present';
        if(mod === 4) return 'excused';
        return 'present';
    }

    function statusLabel(s){
        switch(s){
            case 'present': return 'حاضر';
            case 'absent': return 'غائب';
            case 'late': return 'متأخر';
            case 'excused': return 'مستأذن';
            default: return s;
        }
    }
    function statusClass(s){
        switch(s){
            case 'present': return 'status-present';
            case 'absent': return 'status-absent';
            case 'late': return 'status-late';
            case 'excused': return 'status-excused';
            default: return '';
        }
    }

    // initial render
    renderWeek();

    // ===== Recitation view logic =====
    var currentRecOffset = 0; // 0 = today, -1 prev day, +1 next day

    if(prevRecDay && nextRecDay && recDateLabel && recitationList){
        prevRecDay.addEventListener('click', function(){ currentRecOffset -= 1; renderRecitationDay(); });
        nextRecDay.addEventListener('click', function(){ currentRecOffset += 1; renderRecitationDay(); });
        // initial
        renderRecitationDay();
    }

    function renderRecitationDay(){
        var d = new Date();
        d.setDate(d.getDate() + currentRecOffset);
        recDateLabel.textContent = formatDate(d) + ' - ' + arabicWeekday(d.getDay());

        // fake recitations list
        var recs = fakeRecitationsFor(studentId, d);
        var html = '';
        if(recs.length === 0){
            html = '<li class="rec-item"><div>لا توجد تسجيلات تسميع لهذا اليوم.</div></li>';
        } else {
            for(var i=0;i<recs.length;i++){
                var r = recs[i];
                html += '<li class="rec-item">';
                html += '<div class="rec-type">' + r.typeLabel + '</div>';

                // two small tables: From and To
                html += '<div class="rec-tables">';
                html += '<table class="rec-table rec-from">';
                html += '<thead><tr><th>من</th></tr></thead>';
                html += '<tbody><tr><td>سورة "' + r.start.surahName + '"<br>آية رقم ' + r.start.ayah + '<br>صفحة رقم ' + r.start.page + '</td></tr></tbody>';
                html += '</table>';

                html += '<table class="rec-table rec-to">';
                html += '<thead><tr><th>إلى</th></tr></thead>';
                html += '<tbody><tr><td>سورة "' + r.end.surahName + '"<br>آية رقم ' + r.end.ayah + '<br>صفحة رقم ' + r.end.page + '</td></tr></tbody>';
                html += '</table>';
                html += '</div>';

                // boxes for errors and grade
                html += '<div class="rec-boxes">';
                html += '<div class="rec-box rec-errors">أخطاء: ' + r.errors + '</div>';
                html += '<div class="rec-box rec-grade">الدرجة: ' + r.grade + '</div>';
                html += '</div>';

                html += '</li>';
            }
        }
        recitationList.innerHTML = html;
    }

    function fakeRecitationsFor(studentId, date){
        // deterministic pseudo-random based on date and id
        var base = (parseInt(studentId) || 1) + Math.floor(date.getTime() / 86400000);
        var count = (base % 3); // 0..2 entries
        var arr = [];
        var types = [ {k:'daily-wird', t: 'ورد يومي'}, {k:'small-review', t:'مراجعة صغرى'}, {k:'big-review', t:'مراجعة كبرى'} ];
        for(var i=0;i<count;i++){
            var seed = base + i;
            var type = types[seed % types.length];

            // pick surah indices and ayah/page numbers deterministically
            var s1 = (seed % surahNames.length);
            var s2 = ((seed + 3) % surahNames.length);
            var ay1 = (seed % 286) + 1; // up to 286 (Baqara) but it's fine for fake data
            var ay2 = ((seed + 2) % 286) + 1;
            var p1 = (seed % 604) + 1;
            var p2 = ((seed + 5) % 604) + 1;

            arr.push({
                type: type.k,
                typeLabel: type.t,
                start: { surahName: surahNames[s1] || ('سورة ' + (s1+1)), ayah: ay1, page: p1 },
                end:   { surahName: surahNames[s2] || ('سورة ' + (s2+1)), ayah: ay2, page: p2 },
                grade: (10 + (seed % 11)),
                errors: (seed % 4)
            });
        }
        return arr;
    }
});
