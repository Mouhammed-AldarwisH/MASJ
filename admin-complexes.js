/**
 * =============================================
 * صفحة إدارة طلبات تسجيل المجمعات
 * نظام إدارة الحلقات القرآنية (MAS)
 * =============================================
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // =============================================
    // تهيئة Supabase
    // =============================================
    var supabaseClient = null;
    
    /**
     * تهيئة عميل Supabase
     */
    function initializeSupabase() {
        if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.isSupabaseConfigured()) {
            supabaseClient = supabase.createClient(
                APP_CONFIG.SUPABASE_URL,
                APP_CONFIG.SUPABASE_ANON_KEY
            );
            return true;
        }
        return false;
    }
    
    var isSupabaseReady = initializeSupabase();

    // =============================================
    // عناصر الصفحة
    // =============================================
    
    // الإحصائيات
    var pendingCountEl = document.getElementById('pendingCount');
    var acceptedCountEl = document.getElementById('acceptedCount');
    var rejectedCountEl = document.getElementById('rejectedCount');
    
    // الفلاتر
    var filterTabs = document.querySelectorAll('.filter-tab');
    var currentFilter = 'pending';
    
    // قائمة الطلبات
    var requestsList = document.getElementById('requestsList');
    var emptyState = document.getElementById('emptyState');
    var loadingState = document.getElementById('loadingState');
    
    // النوافذ المنبثقة
    var detailsModal = document.getElementById('detailsModal');
    var closeModal = document.getElementById('closeModal');
    var modalBody = document.getElementById('modalBody');
    var modalActions = document.getElementById('modalActions');
    
    var confirmModal = document.getElementById('confirmModal');
    var confirmIcon = document.getElementById('confirmIcon');
    var confirmTitle = document.getElementById('confirmTitle');
    var confirmMessage = document.getElementById('confirmMessage');
    var confirmAction = document.getElementById('confirmAction');
    var cancelAction = document.getElementById('cancelAction');
    
    // رسائل الإشعار
    var toast = document.getElementById('toast');
    
    // زر التحديث
    var refreshButton = document.getElementById('refreshButton');
    
    // بيانات مؤقتة
    var allComplexes = [];
    var selectedComplex = null;
    var pendingAction = null;

    // =============================================
    // دوال مساعدة
    // =============================================
    
    /**
     * إظهار رسالة إشعار
     */
    function showToast(message, type) {
        var toastIcon = toast.querySelector('.toast-icon');
        var toastMessage = toast.querySelector('.toast-message');
        
        toastMessage.textContent = message;
        toast.className = 'toast ' + (type || 'success');
        
        if (type === 'success') {
            toastIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else {
            toastIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        }
        
        toast.classList.add('show');
        
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }
    
    /**
     * تنسيق التاريخ
     */
    function formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        
        var date = new Date(dateString);
        var options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('ar-SA', options);
    }
    
    /**
     * ترجمة حالة الطلب
     */
    function translateStatus(status) {
        switch (status) {
            case 'pending':
                return 'معلق';
            case 'accepted':
                return 'مقبول';
            case 'rejected':
                return 'مرفوض';
            default:
                return status;
        }
    }

    // =============================================
    // دوال جلب البيانات
    // =============================================
    
    /**
     * جلب جميع طلبات المجمعات
     */
    async function fetchComplexes() {
        showLoading(true);
        
        try {
            if (!isSupabaseReady) {
                // إظهار رسالة خطأ الاتصال
                showConnectionError();
                return;
            }

            // تحقق من تسجيل الدخول لأن سياسات RLS تسمح بالقراءة للمستخدمين المصادق عليهم
            var userResp = await supabaseClient.auth.getUser();
            var currentUser = userResp && userResp.data ? userResp.data.user : null;
            if (!currentUser) {
                showToast('الرجاء تسجيل الدخول لعرض الطلبات', 'error');
                // إعادة توجيه لصفحة الدخول مع إعادة توجيه لاحقة
                setTimeout(function() {
                    window.location.href = 'user-login.html?returnTo=admin-complexes.html';
                }, 1200);
                return;
            }
            
            var { data, error } = await supabaseClient
                .from('complexes')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            allComplexes = data || [];
            updateStats();
            renderRequests();
            
        } catch (error) {
            console.error('خطأ في جلب البيانات:', error);
            showToast('فشل في جلب البيانات', 'error');
            showConnectionError();
        } finally {
            showLoading(false);
        }
    }
    
    /**
     * عرض رسالة خطأ الاتصال
     */
    function showConnectionError() {
        allComplexes = [];
        updateStats();
        
        if (requestsList) {
            requestsList.innerHTML = `
                <div class="connection-error" style="text-align: center; padding: 40px 20px;">
                    <div style="color: #F44336; margin-bottom: 15px;">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">تعذر الاتصال بقاعدة البيانات</h3>
                    <p style="color: #666; margin-bottom: 20px;">يرجى التحقق من إعدادات Supabase في ملف config.js</p>
                    <button onclick="location.reload()" class="btn btn-primary">إعادة المحاولة</button>
                </div>
            `;
        }
        
        if (emptyState) emptyState.style.display = 'none';
    }

    // =============================================
    // دوال تحديث الواجهة
    // =============================================
    
    /**
     * إظهار/إخفاء التحميل
     */
    function showLoading(show) {
        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
        if (requestsList) {
            requestsList.style.display = show ? 'none' : 'flex';
        }
    }
    
    /**
     * تحديث الإحصائيات
     */
    function updateStats() {
        // نعتبر أي حالة ليست 'accepted' أو 'rejected' كـ pending (للتعامل مع تسميات غير متوقعة)
        var accepted = allComplexes.filter(function(c) { return (c.complex_status || '').toString().toLowerCase() === 'accepted'; }).length;
        var rejected = allComplexes.filter(function(c) { return (c.complex_status || '').toString().toLowerCase() === 'rejected'; }).length;
        var pending = allComplexes.filter(function(c) {
            var s = (c.complex_status || '').toString().toLowerCase();
            return s !== 'accepted' && s !== 'rejected';
        }).length;
        
        if (pendingCountEl) pendingCountEl.textContent = pending;
        if (acceptedCountEl) acceptedCountEl.textContent = accepted;
        if (rejectedCountEl) rejectedCountEl.textContent = rejected;
    }
    
    /**
     * عرض قائمة الطلبات
     */
    function renderRequests() {
        if (!requestsList) return;
        
        // فلترة حسب الحالة
        var filtered = [];
        if (currentFilter === 'all') {
            filtered = allComplexes.slice();
        } else if (currentFilter === 'pending') {
            // أي حالة ليست accepted أو rejected
            filtered = allComplexes.filter(function(c) {
                var s = (c.complex_status || '').toString().toLowerCase();
                return s !== 'accepted' && s !== 'rejected';
            });
        } else if (currentFilter === 'accepted') {
            filtered = allComplexes.filter(function(c) { return (c.complex_status || '').toString().toLowerCase() === 'accepted'; });
        } else if (currentFilter === 'rejected') {
            filtered = allComplexes.filter(function(c) { return (c.complex_status || '').toString().toLowerCase() === 'rejected'; });
        } else {
            // فلتر غير معروف -> عرض الكل
            filtered = allComplexes.slice();
        }
        
        // إظهار حالة الفراغ إذا لم توجد طلبات
        if (filtered.length === 0) {
            requestsList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // بناء HTML للطلبات
        var html = filtered.map(function(complex) {
            return createRequestCard(complex);
        }).join('');
        
        requestsList.innerHTML = html;
        
        // إضافة أحداث الأزرار
        attachButtonEvents();
    }
    
    /**
     * إنشاء بطاقة طلب
     */
    /**
     * تحديد هل الحالة معلقة (أي شيء غير accepted/rejected)
     */
    function isPending(status) {
        var s = (status || '').toString().toLowerCase();
        return s !== 'accepted' && s !== 'rejected';
    }

    function createRequestCard(complex) {
        var statusNormalized = (complex.complex_status || '').toString().toLowerCase();
        var statusClass = isPending(statusNormalized) ? 'pending' : statusNormalized;
        var statusText = translateStatus(isPending(statusNormalized) ? 'pending' : statusNormalized);
        var emailVerified = complex.is_email_verified ? 'مفعّل' : 'غير مفعّل';
        
        var actionsHtml = '';
        if (isPending(statusNormalized)) {
            actionsHtml = `
                <button class="action-btn approve" data-id="${complex.id}" data-action="approve">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    قبول
                </button>
                <button class="action-btn reject" data-id="${complex.id}" data-action="reject">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    رفض
                </button>
            `;
        }
        
        return `
            <div class="request-card ${statusClass}">
                <div class="request-header">
                    <div class="request-info">
                        <h3 class="request-name">${complex.complex_name}</h3>
                        <p class="request-admin">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            ${complex.complex_admin_username || 'غير محدد'}
                        </p>
                    </div>
                    <span class="request-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="request-details">
                    <div class="request-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>${complex.complex_admin_email}</span>
                    </div>
                    <div class="request-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${formatDate(complex.created_at)}</span>
                    </div>
                    <div class="request-detail">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>البريد: ${emailVerified}</span>
                    </div>
                </div>
                
                <div class="request-actions">
                    <button class="action-btn details" data-id="${complex.id}" data-action="details">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        التفاصيل
                    </button>
                    ${actionsHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * إضافة أحداث الأزرار
     */
    function attachButtonEvents() {
        var actionButtons = document.querySelectorAll('.action-btn');
        
        actionButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idAttr = this.getAttribute('data-id');
                var action = this.getAttribute('data-action');

                // دعم المعرفات الرقمية و UUIDs (مقارنة كسلاسل)
                selectedComplex = allComplexes.find(function(c) {
                    return String(c.id) === String(idAttr);
                });
                
                if (!selectedComplex) return;
                
                switch (action) {
                    case 'approve':
                        showConfirmDialog('approve');
                        break;
                    case 'reject':
                        showConfirmDialog('reject');
                        break;
                    case 'details':
                        showDetailsModal();
                        break;
                }
            });
        });
    }

    // =============================================
    // دوال النوافذ المنبثقة
    // =============================================
    
    /**
     * إظهار نافذة التفاصيل
     */
    function showDetailsModal() {
        if (!selectedComplex || !modalBody) return;
        
        var c = selectedComplex;
        
        modalBody.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">اسم المجمع</span>
                <span class="detail-value">${c.complex_name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">اسم المشرف</span>
                <span class="detail-value">${c.complex_admin_username || 'غير محدد'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">البريد الإلكتروني</span>
                <span class="detail-value">${c.complex_admin_email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">حالة البريد</span>
                <span class="detail-value">${c.is_email_verified ? 'مفعّل ✓' : 'غير مفعّل'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">حالة الطلب</span>
                <span class="detail-value">${translateStatus(c.complex_status)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">تاريخ التسجيل</span>
                <span class="detail-value">${formatDate(c.created_at)}</span>
            </div>
        `;
        
        // إضافة أزرار الإجراءات
        if (isPending(c.complex_status)) {
            modalActions.innerHTML = `
                <button class="btn btn-primary approve" id="modalApprove">قبول الطلب</button>
                <button class="btn btn-primary reject" id="modalReject">رفض الطلب</button>
            `;
            
            document.getElementById('modalApprove').addEventListener('click', function() {
                closeDetailsModal();
                showConfirmDialog('approve');
            });
            
            document.getElementById('modalReject').addEventListener('click', function() {
                closeDetailsModal();
                showConfirmDialog('reject');
            });
        } else {
            modalActions.innerHTML = `
                <button class="btn btn-secondary" id="modalClose">إغلاق</button>
            `;
            
            document.getElementById('modalClose').addEventListener('click', closeDetailsModal);
        }
        
        detailsModal.classList.add('active');
    }
    
    /**
     * إغلاق نافذة التفاصيل
     */
    function closeDetailsModal() {
        detailsModal.classList.remove('active');
    }
    
    /**
     * إظهار نافذة التأكيد
     */
    function showConfirmDialog(action) {
        pendingAction = action;
        
        if (action === 'approve') {
            confirmIcon.className = 'confirm-icon approve';
            confirmIcon.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            confirmTitle.textContent = 'تأكيد قبول الطلب';
            confirmMessage.textContent = `هل تريد قبول طلب "${selectedComplex.complex_name}"؟`;
            confirmAction.className = 'btn btn-primary approve';
            confirmAction.textContent = 'قبول';
        } else {
            confirmIcon.className = 'confirm-icon reject';
            confirmIcon.innerHTML = `
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            `;
            confirmTitle.textContent = 'تأكيد رفض الطلب';
            confirmMessage.textContent = `هل تريد رفض طلب "${selectedComplex.complex_name}"؟`;
            confirmAction.className = 'btn btn-primary reject';
            confirmAction.textContent = 'رفض';
        }
        
        confirmModal.classList.add('active');
    }
    
    /**
     * إغلاق نافذة التأكيد
     */
    function closeConfirmDialog() {
        confirmModal.classList.remove('active');
        pendingAction = null;
    }

    // =============================================
    // دوال الإجراءات
    // =============================================
    
    /**
     * تنفيذ الإجراء المؤكد
     */
    async function executeAction() {
        if (!selectedComplex || !pendingAction) return;
        
        var newStatus = pendingAction === 'approve' ? 'accepted' : 'rejected';
        
        confirmAction.disabled = true;
        confirmAction.textContent = 'جاري التنفيذ...';
        
        try {
            if (isSupabaseReady) {
                // تحديث في قاعدة البيانات
                var { error } = await supabaseClient
                    .from('complexes')
                    .update({
                        complex_status: newStatus,
                        admin_approved: newStatus === 'accepted'
                    })
                    .eq('id', selectedComplex.id);
                
                if (error) {
                    throw error;
                }
                
                // إذا تم القبول، ننشئ مستخدم مشرف في جدول users
                if (newStatus === 'accepted') {
                    await createSupervisorUser(selectedComplex);
                }
            }
            
            // تحديث البيانات المحلية
            var complexIndex = allComplexes.findIndex(function(c) {
                return c.id === selectedComplex.id;
            });
            
            if (complexIndex !== -1) {
                allComplexes[complexIndex].complex_status = newStatus;
                allComplexes[complexIndex].admin_approved = newStatus === 'accepted';
            }
            
            closeConfirmDialog();
            updateStats();
            renderRequests();
            
            showToast(
                pendingAction === 'approve' ? 'تم قبول الطلب بنجاح' : 'تم رفض الطلب',
                'success'
            );
            
        } catch (error) {
            console.error('خطأ في تنفيذ الإجراء:', error);
            showToast('فشل في تنفيذ الإجراء', 'error');
        } finally {
            confirmAction.disabled = false;
            confirmAction.textContent = pendingAction === 'approve' ? 'قبول' : 'رفض';
        }
    }
    
    /**
     * إنشاء مستخدم مشرف عند قبول الطلب
     */
    async function createSupervisorUser(complex) {
        try {
            // التحقق من عدم وجود المستخدم مسبقاً
            var { data: existingUser } = await supabaseClient
                .from('users')
                .select('id')
                .eq('user_email', complex.complex_admin_email)
                .single();
            
            if (existingUser) {
                // تحديث complex_id للمستخدم الموجود
                await supabaseClient
                    .from('users')
                    .update({ complex_id: complex.id })
                    .eq('id', existingUser.id);
                return;
            }
            
            // إنشاء مستخدم جديد
            await supabaseClient
                .from('users')
                .insert({
                    user_email: complex.complex_admin_email,
                    user_password: complex.complex_admin_password,
                    user_name: complex.complex_admin_username,
                    user_role: 'supervisor',
                    complex_id: complex.id,
                    is_active: true
                });
                
        } catch (error) {
            console.error('خطأ في إنشاء المستخدم:', error);
        }
    }

    // =============================================
    // أحداث الصفحة
    // =============================================
    
    // أحداث الفلاتر
    filterTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع التبويبات
            filterTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            
            // إضافة الفئة النشطة للتبويب المحدد
            this.classList.add('active');
            
            // تحديث الفلتر وإعادة العرض
            currentFilter = this.getAttribute('data-filter');
            renderRequests();
        });
    });
    
    // إغلاق نافذة التفاصيل
    if (closeModal) {
        closeModal.addEventListener('click', closeDetailsModal);
    }
    
    // إغلاق النوافذ عند النقر خارجها
    detailsModal.addEventListener('click', function(e) {
        if (e.target === detailsModal) {
            closeDetailsModal();
        }
    });
    
    confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
            closeConfirmDialog();
        }
    });
    
    // أزرار نافذة التأكيد
    if (confirmAction) {
        confirmAction.addEventListener('click', executeAction);
    }
    
    if (cancelAction) {
        cancelAction.addEventListener('click', closeConfirmDialog);
    }
    
    // زر التحديث
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchComplexes);
    }
    
    // إغلاق النوافذ بالضغط على Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDetailsModal();
            closeConfirmDialog();
        }
    });

    // =============================================
    // التهيئة الأولية
    // =============================================
    
    fetchComplexes();

});
