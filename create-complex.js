/**
 * =============================================
 * صفحة تسجيل المجمعات مع التحقق بـ OTP
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
    
    // أقسام الصفحة
    var registrationSection = document.getElementById('registrationSection');
    var otpSection = document.getElementById('otpSection');
    var pendingSection = document.getElementById('pendingSection');
    var loginLink = document.getElementById('loginLink');
    
    // نموذج التسجيل
    var createComplexForm = document.getElementById('createComplexForm');
    if (!createComplexForm) return;
    
    var complexNameInput = document.getElementById('complexName');
    var supervisorUsernameInput = document.getElementById('supervisorUsername');
    var supervisorEmailInput = document.getElementById('supervisorEmail');
    var supervisorPasswordInput = document.getElementById('supervisorPassword');
    var confirmPasswordInput = document.getElementById('confirmPassword');
    var submitBtn = document.getElementById('submitBtn');
    var createComplexMessage = document.getElementById('createComplexMessage');
    
    // قسم OTP
    var otpDigits = document.querySelectorAll('.otp-digit');
    var verifyOtpBtn = document.getElementById('verifyOtpBtn');
    var resendOtpBtn = document.getElementById('resendOtpBtn');
    var otpMessage = document.getElementById('otpMessage');
    var emailDisplay = document.getElementById('emailDisplay');
    var countdownSpan = document.getElementById('countdown');
    
    // متغيرات عامة
    var registeredEmail = '';
    var countdownTimer = null;

    // =============================================
    // دالة إظهار رسالة
    // =============================================
    
    /**
     * إظهار رسالة للمستخدم
     * @param {HTMLElement} element - عنصر الرسالة
     * @param {string} message - نص الرسالة
     * @param {string} type - نوع الرسالة (error, success)
     */
    function showMessage(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = type === 'success' ? 'success-message' : 'error-message show';
        element.style.display = 'block';
    }
    
    /**
     * إخفاء رسالة
     * @param {HTMLElement} element - عنصر الرسالة
     */
    function hideMessage(element) {
        if (!element) return;
        element.className = 'error-message';
        element.style.display = 'none';
    }

    // =============================================
    // دالة التحقق من صحة البيانات
    // =============================================
    
    /**
     * التحقق من صحة بيانات النموذج
     * @returns {object} - نتيجة التحقق
     */
    function validateForm() {
        var complexName = complexNameInput.value.trim();
        var username = supervisorUsernameInput.value.trim();
        var email = supervisorEmailInput.value.trim().toLowerCase();
        var password = supervisorPasswordInput.value;
        var confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password;
        
        // التحقق من الحقول الفارغة
        if (!complexName || !username || !email || !password) {
            return { valid: false, message: 'يرجى ملء جميع الحقول' };
        }
        
        // التحقق من صيغة البريد الإلكتروني
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'صيغة البريد الإلكتروني غير صحيحة' };
        }
        
        // التحقق من طول كلمة المرور
        if (password.length < 6) {
            return { valid: false, message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
        }
        
        // التحقق من تطابق كلمتي المرور
        if (password !== confirmPassword) {
            return { valid: false, message: 'كلمتا المرور غير متطابقتين' };
        }
        
        return {
            valid: true,
            data: {
                complexName: complexName,
                username: username,
                email: email,
                password: password
            }
        };
    }

    // =============================================
    // دالة تسجيل المجمع (الخطوة 1)
    // =============================================
    
    /**
     * تسجيل مجمع جديد باستخدام Supabase Auth
     * @param {object} formData - بيانات النموذج
     */
    async function registerComplex(formData) {
        try {
            // إظهار حالة التحميل
            if (submitBtn) {
                submitBtn.disabled = true;
                var btnText = submitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'جاري الإرسال...';
            }
            
            // التسجيل باستخدام Supabase Auth
            var { data, error } = await supabaseClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.username,
                        complex_name: formData.complexName,
                        role: 'supervisor'
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            // التحقق من أن المستخدم تم إنشاؤه
            if (!data.user) {
                throw new Error('فشل في إنشاء الحساب');
            }
            
            // تسجيل الدخول بالجلسة الجديدة لضمان صلاحيات الإدخال
            if (data.session) {
                await supabaseClient.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token
                });
            }

            // حفظ بيانات المجمع في قاعدة البيانات
            var { error: complexError } = await supabaseClient
                .from('complexes')
                .insert({
                    complex_name: formData.complexName,
                    complex_admin_email: formData.email,
                    complex_admin_username: formData.username,
                    complex_admin_password: formData.password,
                    admin_auth_uid: data.user.id,
                    is_email_verified: false,
                    admin_approved: false,
                    complex_status: 'pending'
                });
            
            if (complexError) {
                console.error('فشل في حفظ بيانات المجمع:', complexError);
                showMessage(createComplexMessage, 'تم إنشاء الحساب لكن فشل حفظ بيانات المجمع. يرجى التواصل مع الإدارة.', 'error');
                return;
            }
            
            // حفظ البريد لاستخدامه في التحقق
            registeredEmail = formData.email;
            
            // الانتقال لقسم OTP
            showOtpSection(formData.email);
            
        } catch (error) {
            var errorMessage = 'حدث خطأ أثناء التسجيل';
            
            if (error.message && error.message.includes('already registered')) {
                errorMessage = 'البريد الإلكتروني مسجل مسبقاً';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(createComplexMessage, errorMessage, 'error');
            
        } finally {
            // إعادة حالة الزر
            if (submitBtn) {
                submitBtn.disabled = false;
                var btnText = submitBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'إنشاء المجمع';
            }
        }
    }

    // =============================================
    // دالة عرض قسم OTP
    // =============================================
    
    /**
     * إظهار قسم إدخال OTP
     * @param {string} email - البريد الإلكتروني
     */
    function showOtpSection(email) {
        // إخفاء قسم التسجيل
        if (registrationSection) registrationSection.classList.add('hidden');
        if (loginLink) loginLink.style.display = 'none';
        
        // إظهار قسم OTP
        if (otpSection) otpSection.classList.add('active');
        
        // عرض البريد الإلكتروني
        if (emailDisplay) emailDisplay.textContent = email;
        
        // بدء العد التنازلي لإعادة الإرسال
        startResendCountdown();
        
        // التركيز على أول حقل OTP
        if (otpDigits && otpDigits.length > 0) {
            otpDigits[0].focus();
        }
    }

    // =============================================
    // دالة العد التنازلي لإعادة الإرسال
    // =============================================
    
    /**
     * بدء العد التنازلي لإعادة إرسال OTP
     */
    function startResendCountdown() {
        var seconds = 60;
        if (resendOtpBtn) resendOtpBtn.disabled = true;
        
        countdownTimer = setInterval(function() {
            seconds--;
            if (countdownSpan) countdownSpan.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(countdownTimer);
                if (resendOtpBtn) {
                    resendOtpBtn.disabled = false;
                    resendOtpBtn.innerHTML = 'إعادة إرسال الرمز';
                }
            }
        }, 1000);
    }

    // =============================================
    // دالة التحقق من OTP (الخطوة 2)
    // =============================================
    
    /**
     * التحقق من رمز OTP
     */
    async function verifyOTP() {
        try {
            // جمع أرقام OTP
            var otpCode = '';
            otpDigits.forEach(function(digit) {
                otpCode += digit.value;
            });
            
            // التحقق من أن الرمز مكتمل
            if (otpCode.length !== 6) {
                showMessage(otpMessage, 'يرجى إدخال الرمز كاملاً (6 أرقام)', 'error');
                return;
            }
            
            // إظهار حالة التحميل
            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.textContent = 'جاري التحقق...';
            }
            
            // التحقق من OTP باستخدام Supabase
            var { data, error } = await supabaseClient.auth.verifyOtp({
                email: registeredEmail,
                token: otpCode,
                type: 'signup'
            });
            
            if (error) {
                throw error;
            }
            
            // تحديث حالة التحقق في المجمع
            await supabaseClient
                .from('complexes')
                .update({ is_email_verified: true })
                .eq('complex_admin_email', registeredEmail);
            
            // إظهار قسم الانتظار
            showPendingSection();
            
        } catch (error) {
            var errorMessage = 'رمز التحقق غير صحيح';
            
            if (error.message && error.message.includes('expired')) {
                errorMessage = 'انتهت صلاحية الرمز، يرجى طلب رمز جديد';
            }
            
            showMessage(otpMessage, errorMessage, 'error');
            
        } finally {
            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.textContent = 'تأكيد الرمز';
            }
        }
    }

    // =============================================
    // دالة إعادة إرسال OTP
    // =============================================
    
    /**
     * إعادة إرسال رمز OTP
     */
    async function resendOTP() {
        try {
            if (resendOtpBtn) {
                resendOtpBtn.disabled = true;
                resendOtpBtn.textContent = 'جاري الإرسال...';
            }
            
            // إعادة إرسال OTP
            var { error } = await supabaseClient.auth.resend({
                type: 'signup',
                email: registeredEmail
            });
            
            if (error) {
                throw error;
            }
            
            showMessage(otpMessage, 'تم إرسال رمز جديد إلى بريدك', 'success');
            
            // إعادة العد التنازلي
            if (resendOtpBtn) {
                resendOtpBtn.innerHTML = 'إعادة إرسال الرمز (<span id="countdown">60</span>)';
                countdownSpan = document.getElementById('countdown');
            }
            startResendCountdown();
            
        } catch (error) {
            showMessage(otpMessage, 'فشل في إعادة إرسال الرمز: ' + error.message, 'error');
            if (resendOtpBtn) {
                resendOtpBtn.disabled = false;
                resendOtpBtn.textContent = 'إعادة إرسال الرمز';
            }
        }
    }

    // =============================================
    // دالة إظهار قسم الانتظار
    // =============================================
    
    /**
     * إظهار قسم انتظار موافقة الإدارة
     */
    function showPendingSection() {
        // إخفاء قسم OTP
        if (otpSection) otpSection.classList.remove('active');
        
        // إظهار قسم الانتظار
        if (pendingSection) pendingSection.classList.add('active');
        
        // إيقاف العد التنازلي
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }
    }

    // =============================================
    // أحداث حقول OTP
    // =============================================
    
    /**
     * إعداد أحداث حقول OTP (الانتقال التلقائي)
     */
    function setupOtpInputs() {
        if (!otpDigits || otpDigits.length === 0) return;
        
        otpDigits.forEach(function(digit, index) {
            // عند إدخال رقم، انتقل للحقل التالي
            digit.addEventListener('input', function(e) {
                var value = e.target.value;
                
                // السماح بالأرقام فقط
                e.target.value = value.replace(/[^0-9]/g, '');
                
                // الانتقال للحقل التالي
                if (e.target.value && index < otpDigits.length - 1) {
                    otpDigits[index + 1].focus();
                }
            });
            
            // عند الضغط على Backspace، ارجع للحقل السابق
            digit.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpDigits[index - 1].focus();
                }
            });
            
            // عند اللصق، وزع الأرقام على الحقول
            digit.addEventListener('paste', function(e) {
                e.preventDefault();
                var pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
                
                for (var i = 0; i < pastedData.length && i < otpDigits.length; i++) {
                    otpDigits[i].value = pastedData[i];
                }
                
                // التركيز على آخر حقل معبأ أو الأول الفارغ
                var lastFilledIndex = Math.min(pastedData.length - 1, otpDigits.length - 1);
                otpDigits[lastFilledIndex].focus();
            });
        });
    }

    // =============================================
    // معالجة إرسال النموذج
    // =============================================
    
    createComplexForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hideMessage(createComplexMessage);
        
        // التحقق من جاهزية Supabase
        if (!isSupabaseReady) {
            // الوضع المحلي (للتطوير)
            fallbackLocalRegistration();
            return;
        }
        
        // التحقق من صحة البيانات
        var validation = validateForm();
        if (!validation.valid) {
            showMessage(createComplexMessage, validation.message, 'error');
            return;
        }
        
        // بدء عملية التسجيل
        registerComplex(validation.data);
    });

    // =============================================
    // الوضع المحلي (للتطوير بدون Supabase)
    // =============================================
    
    function fallbackLocalRegistration() {
        var complexName = complexNameInput.value.trim();
        var username = supervisorUsernameInput.value.trim();
        var email = supervisorEmailInput.value.trim().toLowerCase();
        var password = supervisorPasswordInput.value;
        
        if (!complexName || !username || !email || !password) {
            showMessage(createComplexMessage, 'يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        // حفظ في التخزين المحلي
        var complexes = JSON.parse(localStorage.getItem('complexes') || '[]');
        var complex = {
            id: 'complex_' + Date.now(),
            name: complexName,
            mosques: []
        };
        complexes.push(complex);
        localStorage.setItem('complexes', JSON.stringify(complexes));

        var storedUsers = JSON.parse(localStorage.getItem('usersData') || '{}');
        storedUsers[email] = {
            password: password,
            role: 'supervisor',
            name: username,
            redirectTo: 'supervisor-dashboard.html'
        };
        localStorage.setItem('usersData', JSON.stringify(storedUsers));

        showMessage(createComplexMessage, 'تم إنشاء المجمع محلياً. يمكنك تسجيل الدخول الآن.', 'success');
        createComplexForm.reset();
    }

    // =============================================
    // معالجة زر التحقق من OTP
    // =============================================
    
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', verifyOTP);
    }

    // =============================================
    // معالجة زر إعادة الإرسال
    // =============================================
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', resendOTP);
    }

    // =============================================
    // تهيئة حقول OTP
    // =============================================
    
    setupOtpInputs();

});