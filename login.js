// الانتظار حتى تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== تهيئة الاتصال بقاعدة البيانات =====
    var useDatabase = false;
    var isProduction = (typeof APP_CONFIG !== 'undefined' && !APP_CONFIG.IS_DEVELOPMENT);
    
    if (typeof SupabaseDB !== 'undefined') {
        useDatabase = SupabaseDB.init();
    }
    
    // ===== بيانات المستخدمين للتجربة (تعمل فقط في وضع التطوير) =====
    // ⚠️ في وضع الإنتاج، يتم استخدام قاعدة البيانات فقط
    var usersData = {};
    
    if (!isProduction) {
        // بيانات تجريبية للتطوير فقط
        usersData = {
            'admin@masjed.com': {
                password: 'admin123',
                role: 'supervisor',
                name: 'المشرف العام',
                redirectTo: 'supervisor-dashboard.html'
            },
            'teacher@masjed.com': {
                password: 'teacher123',
                role: 'teacher',
                name: 'الأستاذ أحمد',
                redirectTo: 'dashboard.html'
            },
            'parent1@email.com': {
                password: 'parent123',
                role: 'parent',
                name: 'أبو أحمد',
                redirectTo: 'parent-dashboard.html'
            }
        };
    }

    // دمج أي مستخدمين محفوظين محلياً (للتطوير فقط)
    if (!isProduction) {
        try {
            var stored = JSON.parse(localStorage.getItem('usersData') || '{}');
            for (var k in stored) {
                if (stored.hasOwnProperty(k)) usersData[k] = stored[k];
            }
        } catch (e) {
            // تجاهل الأخطاء في وضع الإنتاج
        }
    }

    // ===== الحصول على عناصر الصفحة =====
    var loginForm = document.getElementById('loginForm');
    var emailInput = document.getElementById('emailInput');
    var passwordInput = document.getElementById('passwordInput');
    var togglePasswordBtn = document.getElementById('togglePassword');
    var loginBtn = document.getElementById('loginBtn');
    var errorMessage = document.getElementById('errorMessage');
    var errorText = document.getElementById('errorText');
    
    // ===== إظهار البيانات التجريبية في وضع التطوير فقط =====
    var demoInfo = document.getElementById('demoInfo');
    if (demoInfo && !isProduction) {
        demoInfo.style.display = 'block';
    }

    // ===== متغير لتتبع حالة إظهار كلمة المرور =====
    var isPasswordVisible = false;

    // ===== معالجة إرسال النموذج =====
    loginForm.addEventListener('submit', function(event) {
        // منع إعادة تحميل الصفحة
        event.preventDefault();
        
        // إخفاء رسالة الخطأ السابقة
        hideError();
        
        // الحصول على القيم المدخلة
        var email = emailInput.value.trim().toLowerCase();
        var password = passwordInput.value;
        
        // التحقق من أن الحقول ليست فارغة
        if (!email || !password) {
            showError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        // إظهار حالة التحميل
        showLoading();
        
        // محاكاة تأخير الاتصال بالخادم (1 ثانية)
        // في التطبيق الحقيقي، هنا سيتم إرسال البيانات للخادم
        setTimeout(async function() {
            // التحقق من البيانات
            var loginResult;
            
            // إذا كان الاتصال بقاعدة البيانات فعّالاً
            if (useDatabase) {
                // استخدام قاعدة البيانات للتحقق
                loginResult = await SupabaseDB.login(email, password);
            } else {
                // استخدام البيانات المحلية للتحقق
                loginResult = validateLogin(email, password);
            }
            
            // إخفاء حالة التحميل
            hideLoading();
            
            if (loginResult.success) {
                // تسجيل الدخول ناجح
                handleSuccessfulLogin(loginResult.user);
            } else {
                // تسجيل الدخول فاشل
                showError(loginResult.message);
            }
        }, 1000);
    });

    /**
     * دالة التحقق من بيانات الدخول
     * تتحقق من صحة البريد الإلكتروني وكلمة المرور
     * @param {string} email - البريد الإلكتروني
     * @param {string} password - كلمة المرور
     * @returns {object} - نتيجة التحقق
     */
    function validateLogin(email, password) {
        // التحقق من وجود البريد الإلكتروني في قاعدة البيانات
        var user = usersData[email];
        
        if (!user) {
            // البريد الإلكتروني غير موجود
            return {
                success: false,
                message: 'البريد الإلكتروني غير مسجل في النظام'
            };
        }
        
        // التحقق من صحة كلمة المرور
        if (user.password !== password) {
            return {
                success: false,
                message: 'كلمة المرور غير صحيحة'
            };
        }
        
        // البيانات صحيحة
        return {
            success: true,
            user: user
        };
    }

    /**
     * دالة معالجة تسجيل الدخول الناجح
     * تحفظ بيانات المستخدم وتوجهه للصفحة المناسبة
     * @param {object} user - بيانات المستخدم
     */
    function handleSuccessfulLogin(user) {
        // حفظ بيانات المستخدم في localStorage
        // هذا يسمح لنا بمعرفة المستخدم في الصفحات الأخرى
        var userData = {
            id: user.id || null,
            name: user.name,
            email: user.email || null,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // إذا كان معلماً، نحفظ بياناته بشكل منفصل
        if (user.role === 'teacher') {
            localStorage.setItem('currentTeacher', JSON.stringify(userData));
        }
        
        // إذا كان ولي أمر، نحفظ معرفه
        if (user.role === 'parent') {
            localStorage.setItem('currentParentId', user.id);
            localStorage.setItem('currentParentName', user.name);
        }
        
        // عرض رسالة ترحيبية
        alert('مرحباً ' + user.name + '!\nجاري تحويلك...');
        
        // التوجيه للصفحة المناسبة حسب دور المستخدم
        var redirectPage = user.redirectTo;
        
        // إذا كان الاتصال بقاعدة البيانات فعّالاً، نحدد صفحة التوجيه
        if (useDatabase && typeof SupabaseDB !== 'undefined') {
            redirectPage = SupabaseDB.getRedirectPage(user.role);
        }
        
        window.location.href = redirectPage;
    }

    /**
     * دالة إظهار رسالة الخطأ
     * @param {string} message - نص رسالة الخطأ
     */
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('show');
        
        // هز حقول الإدخال للتنبيه
        emailInput.style.animation = 'shake 0.5s';
        passwordInput.style.animation = 'shake 0.5s';
        
        // إزالة التأثير بعد انتهائه
        setTimeout(function() {
            emailInput.style.animation = '';
            passwordInput.style.animation = '';
        }, 500);
    }

    /**
     * دالة إخفاء رسالة الخطأ
     */
    function hideError() {
        errorMessage.classList.remove('show');
    }

    /**
     * دالة إظهار حالة التحميل على الزر
     */
    function showLoading() {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
    }

    /**
     * دالة إخفاء حالة التحميل
     */
    function hideLoading() {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }

    // ===== معالجة زر إظهار/إخفاء كلمة المرور =====
    togglePasswordBtn.addEventListener('click', function() {
        isPasswordVisible = !isPasswordVisible;
        
        if (isPasswordVisible) {
            // إظهار كلمة المرور
            passwordInput.type = 'text';
            togglePasswordBtn.title = 'إخفاء كلمة المرور';
        } else {
            // إخفاء كلمة المرور
            passwordInput.type = 'password';
            togglePasswordBtn.title = 'إظهار كلمة المرور';
        }
    });

    // ===== إخفاء رسالة الخطأ عند الكتابة =====
    emailInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);

});

// ===== إضافة تأثير الاهتزاز للـ CSS =====
// نضيفه هنا ديناميكياً لتجنب إضافة ملف CSS إضافي
var shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }';
document.head.appendChild(shakeStyle);
