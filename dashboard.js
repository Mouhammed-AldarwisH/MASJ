// الانتظار حتى تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }
    
    // ===== بيانات الحلقات الكاملة (للتشغيل بدون قاعدة بيانات) =====
    // هذه البيانات يمكن تغييرها أو جلبها من قاعدة بيانات لاحقاً
    var allHalaqatData = [
        {
            id: 1,
            mosqueName: 'جامع أُبي بن كعب',
            halqaName: 'حلقة الشجعان'
        },
        {
            id: 2,
            mosqueName: 'جامع أُبي بن كعب',
            halqaName: 'حلقة المتميزين'
        },
        {
            id: 3,
            mosqueName: 'جامع أُبي بن كعب',
            halqaName: 'حلقة النور'
        }
    ];

    // تحميل البطاقات عند فتح الصفحة
    loadCards();

    /**
     * دالة جلب الحلقات المسندة للمعلم الحالي
     * تتحقق إذا كان هناك معلم مسجل دخول وتُرجع حلقاته فقط
     */
    async function getAssignedHalaqat() {
        // جلب بيانات المستخدم الحالي
        var currentUserData = localStorage.getItem('currentUser');
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً
        if (useDatabase && currentUserData) {
            var currentUser = JSON.parse(currentUserData);
            
            // إذا كان مشرفاً، نجلب جميع الحلقات
            if (currentUser.role === 'supervisor') {
                var allHalaqat = await SupabaseDB.getHalaqat();
                return allHalaqat;
            }
            
            // إذا كان معلماً، نجلب حلقاته فقط
            if (currentUser.id) {
                var teacherHalaqat = await SupabaseDB.getTeacherHalaqat(currentUser.id);
                return teacherHalaqat;
            }
        }
        
        // ===== استخدام البيانات المحلية =====
        // جلب بيانات المعلم المسجل دخوله حالياً
        var currentTeacher = localStorage.getItem('currentTeacher');
        
        // إذا لم يكن هناك معلم مسجل، عرض كل الحلقات (للمدير مثلاً)
        if (!currentTeacher) {
            return allHalaqatData;
        }
        
        var teacher = JSON.parse(currentTeacher);
        
        // فلترة الحلقات بناءً على المسندة للمعلم
        var assignedHalaqat = [];
        
        for (var i = 0; i < allHalaqatData.length; i++) {
            var halqa = allHalaqatData[i];
            
            // التحقق إذا كانت الحلقة ضمن حلقات المعلم
            if (teacher.halaqat && teacher.halaqat.indexOf(halqa.id) !== -1) {
                assignedHalaqat.push(halqa);
            }
        }
        
        return assignedHalaqat;
    }

    /**
     * دالة تحميل وعرض البطاقات
     * تقوم بإنشاء HTML لكل بطاقة وإضافتها للصفحة
     */
    async function loadCards() {
        var cardsContainer = document.getElementById('cardsGrid');
        var halaqatData = await getAssignedHalaqat(); // جلب الحلقات المسندة فقط
        var cardsHTML = '';

        // التحقق إذا لم توجد حلقات
        if (halaqatData.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">لا توجد حلقات مسندة لك</p>';
            return;
        }

        // المرور على كل حلقة وإنشاء بطاقة لها
        for (var i = 0; i < halaqatData.length; i++) {
            var halqa = halaqatData[i];
            cardsHTML += createCardHTML(halqa);
        }

        // إضافة البطاقات للصفحة
        cardsContainer.innerHTML = cardsHTML;

        // إضافة أحداث الضغط للبطاقات
        addCardClickEvents();
    }

    /**
     * دالة إنشاء HTML للبطاقة الواحدة
     * نستخدم هذه الطريقة لأنها واضحة وسهلة التعديل
     */
    function createCardHTML(halqa) {
        var html = '';
        html += '<div class="halqa-card" data-id="' + halqa.id + '">';
        
        // الزخرفة على اليسار
        html += '  <div class="card-decoration"></div>';
        
        // أيقونة المسجد/القبة
        html += '  <svg class="card-mosque-icon" viewBox="0 0 100 80">';
        html += '    <ellipse cx="50" cy="50" rx="35" ry="25" class="mosque-dome"/>';
        html += '    <rect x="15" y="50" width="70" height="25" fill="#d4af37"/>';
        html += '    <circle cx="50" cy="30" r="8" fill="#d4af37"/>';
        html += '    <path d="M50 22 L50 15 M45 18 Q50 12 55 18" stroke="#d4af37" stroke-width="2" fill="none"/>';
        html += '  </svg>';
        
        // محتوى البطاقة
        html += '  <div class="card-content">';
        html += '    <h3 class="card-title">' + halqa.mosqueName + '</h3>';
        html += '    <p class="card-subtitle">' + halqa.halqaName + '</p>';
        html += '  </div>';
        
        // سهم الانتقال
        html += '  <span class="card-arrow">&#x276E;</span>';
        
        html += '</div>';
        
        return html;
    }

    /**
     * دالة إضافة أحداث الضغط على البطاقات
     * عند الضغط على بطاقة، يتم الانتقال لصفحة تفاصيل الحلقة
     */
    function addCardClickEvents() {
        var cards = document.querySelectorAll('.halqa-card');
        
        for (var i = 0; i < cards.length; i++) {
            cards[i].addEventListener('click', handleCardClick);
        }
    }

    /**
     * دالة معالجة الضغط على البطاقة
     * عند الضغط يتم الانتقال لصفحة تحضير الطلاب الخاصة بالحلقة
     */
    function handleCardClick(event) {
        // الحصول على البطاقة المضغوط عليها
        var card = event.currentTarget;
        var halqaId = card.getAttribute('data-id');
        
        // حفظ معرف الحلقة المختارة في localStorage للاستخدام في صفحة الحضور
        localStorage.setItem('selectedHalqaId', halqaId);
        
        // الانتقال لصفحة تحضير الطلاب مع تمرير معرف الحلقة
        window.location.href = 'attendance.html?halqaId=' + halqaId;
    }

    // ===== أحداث الأزرار العلوية =====
    
    var profileButton = document.getElementById('profileButton');
    var notificationButton = document.getElementById('notificationButton');

    /**
     * الضغط على زر الملف الشخصي
     */
    profileButton.addEventListener('click', function() {
        alert('صفحة الملف الشخصي - قيد التطوير');
        // يمكن تغييرها لاحقاً: window.location.href = 'profile.html';
    });

    /**
     * الضغط على زر الإشعارات
     */
    notificationButton.addEventListener('click', function() {
        alert('صفحة الإشعارات - قيد التطوير');
        // يمكن تغييرها لاحقاً: window.location.href = 'notifications.html';
    });

    // بيانات البطاقات
    const cardsData = [
        {
            id: 1,
            title: 'تسجيل الحضور',
            description: 'تسجيل حضور وغياب الطلاب',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <polyline points="16 11 18 13 22 9"></polyline>
            </svg>`,
            color: '#2ecc71',
            link: 'attendance.html'
        },
        {
            id: 2,
            title: 'إدارة الطلاب',
            description: 'إضافة وتعديل بيانات الطلاب',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>`,
            color: '#3498db',
            link: 'students.html'
        },
        {
            id: 3,
            title: 'التقارير',
            description: 'عرض تقارير الحضور والأداء',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>`,
            color: '#9b59b6',
            link: 'reports.html'
        },
        {
            id: 4,
            title: 'الإعدادات',
            description: 'إعدادات التطبيق والحلقة',
            icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>`,
            color: '#e67e22',
            link: 'settings.html'
        }
    ];

    // دالة إنشاء البطاقات
    function createCards() {
        const cardsGrid = document.getElementById('cardsGrid');
        if (!cardsGrid) return;

        cardsGrid.innerHTML = '';

        cardsData.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.dataset.id = card.id;
            cardElement.dataset.link = card.link;
            
            cardElement.innerHTML = `
                <div class="card-icon" style="background-color: ${card.color}20; color: ${card.color}">
                    ${card.icon}
                </div>
                <h3 class="card-title">${card.title}</h3>
                <p class="card-description">${card.description}</p>
            `;

            // إضافة حدث النقر للتوجيه إلى الصفحة المطلوبة
            cardElement.addEventListener('click', function() {
                const link = this.dataset.link;
                if (link) {
                    window.location.href = link;
                }
            });

            cardsGrid.appendChild(cardElement);
        });
    }

    // تهيئة الصفحة عند التحميل
    document.addEventListener('DOMContentLoaded', function() {
        createCards();

        // حدث زر الملف الشخصي
        const profileButton = document.getElementById('profileButton');
        if (profileButton) {
            profileButton.addEventListener('click', function() {
                alert('صفحة الملف الشخصي - قيد التطوير');
            });
        }

        // حدث زر الإشعارات
        const notificationButton = document.getElementById('notificationButton');
        if (notificationButton) {
            notificationButton.addEventListener('click', function() {
                alert('الإشعارات - قيد التطوير');
            });
        }
    });
});
