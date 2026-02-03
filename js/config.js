/**
 * =============================================
 * ملف إعدادات التطبيق - للإنتاج
 * MAS - نظام إدارة الحلقات القرآنية
 * =============================================
 * 
 * ⚠️ تعليمات مهمة قبل النشر:
 * 1. قم بتحديث SUPABASE_URL بـ URL مشروعك من Supabase
 * 2. قم بتحديث SUPABASE_ANON_KEY بـ anon key من Supabase
 * 3. تأكد من تنفيذ schema-production.sql في قاعدة البيانات
 * 4. لا تقم بنشر هذا الملف مع بيانات تجريبية
 * 
 * للحصول على بيانات Supabase:
 * 1. اذهب إلى https://supabase.com
 * 2. افتح مشروعك
 * 3. اذهب إلى Settings > API
 * 4. انسخ Project URL و anon/public key
 */

var APP_CONFIG = {
    
    // =============================================
    // إعدادات Supabase
    // =============================================
    
    /**
     * رابط مشروع Supabase
     * ⚠️ يجب تغييره قبل النشر
     */
    SUPABASE_URL: 'https://mkzzpifnruyzgrjblzup.supabase.co',
    
    /**
     * مفتاح anon العام لـ Supabase
     * ⚠️ يجب تغييره قبل النشر
     * ملاحظة: هذا المفتاح آمن للاستخدام في الواجهة الأمامية
     * لأن RLS (Row Level Security) يحمي البيانات
     */
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1renpwaWZucnV5emdyamJsenVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTE1MDUsImV4cCI6MjA4NTI2NzUwNX0.AOCtQ4ei8lVV71ukX58g6UYAMgo5jAwSe7uVt0ASuR4',
    
    // =============================================
    // إعدادات التطبيق
    // =============================================
    
    /**
     * اسم التطبيق
     */
    APP_NAME: 'نظام إدارة الحلقات القرآنية',
    
    /**
     * إصدار التطبيق
     */
    APP_VERSION: '1.0.0',
    
    /**
     * وضع التطوير (true = تطوير، false = إنتاج)
     * في وضع الإنتاج:
     * - يتم تعطيل console.log
     * - يتم تعطيل البيانات التجريبية
     */
    IS_DEVELOPMENT: false,
    
    /**
     * تفعيل السجلات (Logging)
     * ينصح بتعطيله في الإنتاج
     */
    ENABLE_LOGGING: false,
    
    // =============================================
    // إعدادات الأمان
    // =============================================
    
    /**
     * مدة صلاحية الجلسة بالساعات
     */
    SESSION_TIMEOUT_HOURS: 24,
    
    /**
     * الحد الأقصى لمحاولات تسجيل الدخول الفاشلة
     */
    MAX_LOGIN_ATTEMPTS: 5,
    
    /**
     * مدة الحظر المؤقت بالدقائق بعد تجاوز محاولات الدخول
     */
    LOCKOUT_DURATION_MINUTES: 15,
    
    // =============================================
    // إعدادات الواجهة
    // =============================================
    
    /**
     * اللغة الافتراضية
     */
    DEFAULT_LANGUAGE: 'ar',
    
    /**
     * اتجاه الصفحة
     */
    DEFAULT_DIRECTION: 'rtl',
    
    /**
     * عدد العناصر في كل صفحة (للجداول)
     */
    ITEMS_PER_PAGE: 20
};

// =============================================
// دوال مساعدة للإعدادات
// =============================================

/**
 * التحقق من أن إعدادات Supabase تم تحديثها
 * @returns {boolean}
 */
APP_CONFIG.isSupabaseConfigured = function() {
    return this.SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
           this.SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE';
};

/**
 * دالة آمنة للسجلات - تعمل فقط في وضع التطوير
 * @param {...any} args - الرسائل للطباعة
 */
APP_CONFIG.log = function(...args) {
    if (this.IS_DEVELOPMENT && this.ENABLE_LOGGING) {
        console.log('[MAS]', ...args);
    }
};

/**
 * دالة آمنة للأخطاء - تعمل دائماً لكن بدون تفاصيل حساسة في الإنتاج
 * @param {string} context - سياق الخطأ
 * @param {Error} error - كائن الخطأ
 */
APP_CONFIG.logError = function(context, error) {
    if (this.IS_DEVELOPMENT) {
        console.error('[MAS Error]', context, error);
    } else {
        // في الإنتاج، نسجل فقط أن هناك خطأ بدون تفاصيل
        console.error('[MAS]', context, '- حدث خطأ');
    }
};

/**
 * التحقق من صلاحية الجلسة
 * @returns {boolean}
 */
APP_CONFIG.isSessionValid = function() {
    try {
        var userData = localStorage.getItem('currentUser');
        if (!userData) return false;
        
        var user = JSON.parse(userData);
        if (!user.loginTime) return false;
        
        var loginTime = new Date(user.loginTime);
        var now = new Date();
        var hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        return hoursDiff < this.SESSION_TIMEOUT_HOURS;
    } catch (e) {
        return false;
    }
};

// جعل الإعدادات متاحة عالمياً
window.APP_CONFIG = APP_CONFIG;
