/**
 * =============================================
 * صفحة تسجيل دخول المستخدمين
 * (طلاب، معلمين، أولياء أمور، مشرفين)
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
     * @returns {boolean} - هل تم التهيئة بنجاح
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
    
    // التبويبات
    var tabs = document.querySelectorAll('.login-tab');
    var tabContents = {
        user: document.getElementById('userLoginTab'),
        supervisor: document.getElementById('supervisorLoginTab')
    };
    
    // نموذج دخول المستخدمين (طالب/معلم/ولي أمر)
    var userLoginForm = document.getElementById('userLoginForm');
    var usernameInput = document.getElementById('usernameInput');
    var complexCodeInput = document.getElementById('complexCodeInput');
    var userPasswordInput = document.getElementById('userPasswordInput');
    var userLoginBtn = document.getElementById('userLoginBtn');
    var userErrorMessage = document.getElementById('userErrorMessage');
    var userErrorText = document.getElementById('userErrorText');
    var toggleUserPassword = document.getElementById('toggleUserPassword');
    
    // نموذج دخول المشرفين
    var supervisorLoginForm = document.getElementById('supervisorLoginForm');
    var supervisorEmailInput = document.getElementById('supervisorEmailInput');
    var supervisorPasswordInput = document.getElementById('supervisorPasswordInput');
    var supervisorLoginBtn = document.getElementById('supervisorLoginBtn');
    var supervisorErrorMessage = document.getElementById('supervisorErrorMessage');
    var supervisorErrorText = document.getElementById('supervisorErrorText');
    var toggleSupervisorPassword = document.getElementById('toggleSupervisorPassword');

    // =============================================
    // دوال مساعدة
    // =============================================
    
    /**
     * إظهار رسالة خطأ
     * @param {HTMLElement} container - حاوية الرسالة
     * @param {HTMLElement} textElement - عنصر النص
     * @param {string} message - الرسالة
     */
    function showError(container, textElement, message) {
        textElement.textContent = message;
        container.classList.add('show');
    }
    
    /**
     * إخفاء رسالة الخطأ
     * @param {HTMLElement} container - حاوية الرسالة
     */
    function hideError(container) {
        container.classList.remove('show');
    }
    
    /**
     * إظهار حالة التحميل على الزر
     * @param {HTMLElement} btn - زر الإرسال
     */
    function showLoading(btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }
    
    /**
     * إخفاء حالة التحميل
     * @param {HTMLElement} btn - زر الإرسال
     */
    function hideLoading(btn) {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
    
    /**
     * تبديل إظهار/إخفاء كلمة المرور
     * @param {HTMLElement} input - حقل كلمة المرور
     */
    function togglePasswordVisibility(input) {
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    }

    // =============================================
    // التبديل بين التبويبات
    // =============================================
    
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // إزالة الفعالية من جميع التبويبات
            tabs.forEach(function(t) { t.classList.remove('active'); });
            
            // تفعيل التبويب المحدد
            tab.classList.add('active');
            
            // إخفاء جميع المحتويات
            Object.values(tabContents).forEach(function(content) {
                if (content) content.classList.remove('active');
            });
            
            // إظهار المحتوى المناسب
            var tabName = tab.getAttribute('data-tab');
            if (tabContents[tabName]) {
                tabContents[tabName].classList.add('active');
            }
        });
    });

    // =============================================
    // تسجيل دخول المستخدمين (Username Trick)
    // =============================================
    
    /**
     * تسجيل دخول المستخدم (طالب/معلم/ولي أمر)
     * يستخدم Username + Complex Code لإنشاء إيميل وهمي
     */
    async function loginUser() {
        // جمع البيانات
        var username = usernameInput.value.trim().toLowerCase();
        var complexCode = complexCodeInput.value.trim();
        var password = userPasswordInput.value;
        
        // التحقق من الحقول
        if (!username || !complexCode || !password) {
            showError(userErrorMessage, userErrorText, 'يرجى ملء جميع الحقول');
            return;
        }
        
        // إظهار التحميل
        showLoading(userLoginBtn);
        hideError(userErrorMessage);
        
        try {
            // بناء الإيميل الوهمي: username@complex_code.masjed-app.com
            var fakeEmail = username + '@' + complexCode + '.masjed-app.com';
            
            // تسجيل الدخول باستخدام Supabase Auth
            var { data, error } = await supabaseClient.auth.signInWithPassword({
                email: fakeEmail,
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            // استخراج بيانات المستخدم من الـ Metadata
            var user = data.user;
            var userMetadata = user.user_metadata || {};
            var role = userMetadata.role || 'student';
            
            // حفظ بيانات المستخدم في التخزين المحلي
            var userData = {
                id: user.id,
                name: userMetadata.full_name || username,
                email: fakeEmail,
                role: role,
                complexId: userMetadata.complex_id || complexCode,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // التوجيه حسب الدور
            var redirectPage = getRedirectPage(role);
            window.location.href = redirectPage;
            
        } catch (error) {
            var errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            
            if (error.message) {
                if (error.message.includes('Invalid login')) {
                    errorMessage = 'بيانات الدخول غير صحيحة';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'الحساب غير مفعّل';
                }
            }
            
            showError(userErrorMessage, userErrorText, errorMessage);
            
        } finally {
            hideLoading(userLoginBtn);
        }
    }

    // =============================================
    // تسجيل دخول المشرفين (Email + Password)
    // =============================================
    
    /**
     * تسجيل دخول المشرف بالبريد الإلكتروني
     */
    async function loginSupervisor() {
        // جمع البيانات
        var email = supervisorEmailInput.value.trim().toLowerCase();
        var password = supervisorPasswordInput.value;
        
        // التحقق من الحقول
        if (!email || !password) {
            showError(supervisorErrorMessage, supervisorErrorText, 'يرجى ملء جميع الحقول');
            return;
        }
        
        // إظهار التحميل
        showLoading(supervisorLoginBtn);
        hideError(supervisorErrorMessage);
        
        try {
            // تسجيل الدخول باستخدام Supabase Auth
            var { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            // التحقق من الدور
            var user = data.user;
            var userMetadata = user.user_metadata || {};
            
            if (userMetadata.role !== 'supervisor') {
                // ليس مشرفاً، تسجيل الخروج
                await supabaseClient.auth.signOut();
                throw new Error('هذا الحساب ليس حساب مشرف');
            }
            
            // التحقق من حالة المجمع
            var { data: complexData, error: complexError } = await supabaseClient
                .from('complexes')
                .select('id, complex_name, admin_approved, complex_status')
                .eq('complex_admin_email', email)
                .single();
            
            if (complexError || !complexData) {
                await supabaseClient.auth.signOut();
                throw new Error('لم يتم العثور على المجمع المرتبط بهذا الحساب');
            }
            
            // التحقق من اعتماد المجمع
            if (!complexData.admin_approved || complexData.complex_status !== 'accepted') {
                await supabaseClient.auth.signOut();
                throw new Error('المجمع قيد المراجعة. يرجى انتظار موافقة الإدارة.');
            }
            
            // حفظ بيانات المستخدم
            var userData = {
                id: user.id,
                name: userMetadata.full_name || 'المشرف',
                email: email,
                role: 'supervisor',
                complexId: complexData.id,
                complexName: complexData.complex_name,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // التوجيه للوحة تحكم المشرف
            window.location.href = 'supervisor-dashboard.html';
            
        } catch (error) {
            var errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
            
            if (error.message) {
                if (error.message.includes('Invalid login')) {
                    errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'يرجى تأكيد بريدك الإلكتروني أولاً';
                } else {
                    errorMessage = error.message;
                }
            }
            
            showError(supervisorErrorMessage, supervisorErrorText, errorMessage);
            
        } finally {
            hideLoading(supervisorLoginBtn);
        }
    }

    // =============================================
    // تحديد صفحة التوجيه حسب الدور
    // =============================================
    
    /**
     * الحصول على صفحة التوجيه المناسبة
     * @param {string} role - دور المستخدم
     * @returns {string} - رابط الصفحة
     */
    function getRedirectPage(role) {
        switch (role) {
            case 'supervisor':
                return 'supervisor-dashboard.html';
            case 'teacher':
                return 'dashboard.html';
            case 'parent':
                return 'parent-dashboard.html';
            case 'student':
                return 'student-dashboard.html';
            default:
                return 'index.html';
        }
    }

    // =============================================
    // الوضع المحلي (بدون Supabase)
    // =============================================
    
    /**
     * تسجيل دخول محلي للتطوير
     */
    function localLogin(email, password, role) {
        var storedUsers = JSON.parse(localStorage.getItem('usersData') || '{}');
        var user = storedUsers[email];
        
        if (!user) {
            return { success: false, message: 'المستخدم غير موجود' };
        }
        
        if (user.password !== password) {
            return { success: false, message: 'كلمة المرور غير صحيحة' };
        }
        
        // حفظ بيانات المستخدم
        var userData = {
            id: Date.now(),
            name: user.name,
            email: email,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        return { success: true, redirectTo: user.redirectTo };
    }

    // =============================================
    // أحداث النماذج
    // =============================================
    
    // نموذج دخول المستخدمين
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!isSupabaseReady) {
                // وضع التطوير المحلي
                var username = usernameInput.value.trim();
                var complexCode = complexCodeInput.value.trim();
                var password = userPasswordInput.value;
                var fakeEmail = username + '@' + complexCode + '.masjed-app.com';
                
                var result = localLogin(fakeEmail, password);
                if (result.success) {
                    window.location.href = result.redirectTo || 'dashboard.html';
                } else {
                    showError(userErrorMessage, userErrorText, result.message);
                }
                return;
            }
            
            loginUser();
        });
    }
    
    // نموذج دخول المشرفين
    if (supervisorLoginForm) {
        supervisorLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!isSupabaseReady) {
                // وضع التطوير المحلي
                var email = supervisorEmailInput.value.trim().toLowerCase();
                var password = supervisorPasswordInput.value;
                
                var result = localLogin(email, password);
                if (result.success) {
                    window.location.href = result.redirectTo || 'supervisor-dashboard.html';
                } else {
                    showError(supervisorErrorMessage, supervisorErrorText, result.message);
                }
                return;
            }
            
            loginSupervisor();
        });
    }

    // =============================================
    // أحداث إظهار/إخفاء كلمة المرور
    // =============================================
    
    if (toggleUserPassword) {
        toggleUserPassword.addEventListener('click', function() {
            togglePasswordVisibility(userPasswordInput);
        });
    }
    
    if (toggleSupervisorPassword) {
        toggleSupervisorPassword.addEventListener('click', function() {
            togglePasswordVisibility(supervisorPasswordInput);
        });
    }

    // =============================================
    // إخفاء رسائل الخطأ عند الكتابة
    // =============================================
    
    [usernameInput, complexCodeInput, userPasswordInput].forEach(function(input) {
        if (input) {
            input.addEventListener('input', function() {
                hideError(userErrorMessage);
            });
        }
    });
    
    [supervisorEmailInput, supervisorPasswordInput].forEach(function(input) {
        if (input) {
            input.addEventListener('input', function() {
                hideError(supervisorErrorMessage);
            });
        }
    });

});
