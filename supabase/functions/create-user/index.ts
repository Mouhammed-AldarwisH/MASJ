/**
 * =============================================
 * Supabase Edge Function: إنشاء مستخدم جديد
 * =============================================
 * 
 * هذه الدالة تُنشئ مستخدمين جدد (طلاب، معلمين، أولياء أمور)
 * باستخدام Username Trick (بدون بريد إلكتروني حقيقي)
 * 
 * المدخلات:
 * - username: اسم المستخدم
 * - password: كلمة المرور
 * - complex_id: معرف المجمع
 * - role: الدور (student, teacher, parent)
 * - user_name: الاسم الكامل (اختياري)
 * - phone: رقم الجوال (اختياري)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// إعداد CORS Headers
// =============================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// =============================================
// الدالة الرئيسية
// =============================================
serve(async (req: Request) => {
  // معالجة طلبات CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // =============================================
    // الخطوة 1: استخراج البيانات من الطلب
    // =============================================
    const { username, password, complex_id, role, user_name, phone } = await req.json();

    // التحقق من وجود البيانات المطلوبة
    if (!username || !password || !complex_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "يرجى إدخال اسم المستخدم وكلمة المرور ومعرف المجمع",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // التحقق من صحة الدور
    const validRoles = ["student", "teacher", "parent"];
    const userRole = role || "student";
    if (!validRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "الدور غير صالح. الأدوار المسموحة: student, teacher, parent",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =============================================
    // الخطوة 2: إنشاء عميل Supabase Admin
    // =============================================
    // نستخدم Service Role Key للحصول على صلاحيات الأدمن
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // =============================================
    // الخطوة 3: التحقق من حالة المجمع
    // =============================================
    // نتأكد أن المجمع معتمد (admin_approved = true)
    const { data: complexData, error: complexError } = await supabaseAdmin
      .from("complexes")
      .select("id, complex_name, admin_approved, complex_status")
      .eq("id", complex_id)
      .single();

    // التحقق من وجود المجمع
    if (complexError || !complexData) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "المجمع غير موجود",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // التحقق من اعتماد المجمع
    if (!complexData.admin_approved || complexData.complex_status !== "accepted") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "لا يمكن إنشاء مستخدمين لمجمع غير معتمد. يرجى انتظار موافقة الإدارة.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =============================================
    // الخطوة 4: إنشاء البريد الإلكتروني الوهمي
    // =============================================
    // الصيغة: username@complex_id.masjed-app.com
    const fakeEmail = `${username.toLowerCase().trim()}@${complex_id}.masjed-app.com`;

    // =============================================
    // الخطوة 5: التحقق من عدم وجود المستخدم مسبقاً
    // =============================================
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (user) => user.email?.toLowerCase() === fakeEmail.toLowerCase()
    );

    if (userExists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "اسم المستخدم موجود مسبقاً في هذا المجمع",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =============================================
    // الخطوة 6: إنشاء المستخدم في Auth
    // =============================================
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true, // تفعيل الحساب فوراً بدون تأكيد الإيميل
      user_metadata: {
        username: username,
        role: userRole,
        complex_id: complex_id,
        full_name: user_name || username,
      },
    });

    // التحقق من نجاح إنشاء المستخدم في Auth
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "فشل في إنشاء الحساب: " + (authError?.message || "خطأ غير معروف"),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =============================================
    // الخطوة 7: إضافة المستخدم في جدول users
    // =============================================
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      user_email: fakeEmail,
      user_password: "**hashed**", // كلمة المرور محفوظة في Auth، هنا للإشارة فقط
      user_name: user_name || username,
      user_phone: phone || null,
      user_role: userRole,
      complex_id: complex_id,
      auth_uid: authData.user.id, // ربط بـ Auth User
      is_active: true,
    });

    if (dbError) {
      // إذا فشل الإدخال في قاعدة البيانات، نحذف المستخدم من Auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "فشل في حفظ بيانات المستخدم: " + dbError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // =============================================
    // الخطوة 8: إرجاع رسالة النجاح
    // =============================================
    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إنشاء الحساب بنجاح",
        data: {
          user_id: authData.user.id,
          username: username,
          role: userRole,
          complex_id: complex_id,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    // معالجة الأخطاء غير المتوقعة
    return new Response(
      JSON.stringify({
        success: false,
        message: "حدث خطأ غير متوقع: " + (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
