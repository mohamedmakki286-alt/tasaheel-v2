import { Link } from 'react-router-dom';
import { ShieldCheck, Trash2 } from 'lucide-react';

export default function AccountDeletionPage() {
  return <main className="min-h-screen bg-surface-50 px-4 py-10 text-surface-900 dark:bg-surface-950 dark:text-white" dir="rtl">
    <div className="mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-surface-200 bg-white shadow-xl dark:border-surface-800 dark:bg-surface-900">
      <header className="bg-gradient-to-br from-surface-950 to-surface-800 p-7 text-white"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400"><Trash2/></span><div><p className="text-xs text-white/60">منصة تساهيل</p><h1 className="text-2xl font-black">حذف الحساب والبيانات</h1></div></div></header>
      <section className="space-y-5 p-6 sm:p-8">
        <p className="leading-7 text-surface-600 dark:text-surface-300">يمكن لعميل تساهيل حذف حسابه مباشرة من التطبيق عبر: <strong>حسابي ← حذف الحساب والبيانات</strong>. بعد التأكيد يتوقف تسجيل الدخول وتُزال بيانات الاتصال والصورة والموقع ورمز الإشعارات.</p>
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"><ShieldCheck className="mb-2" size={20}/>قد نحتفظ بالسجلات المالية والفواتير المطلوبة نظامياً لمدة الاحتفاظ القانونية، مع منع استخدامها لتسجيل الدخول أو التسويق.</div>
        <div><h2 className="font-black">لا تستطيع الدخول إلى التطبيق؟</h2><p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-300">أرسل طلباً من بريد الحساب المسجل إلى <a className="font-bold text-accent-600 underline" href="mailto:info@salabaa.com?subject=طلب حذف حساب تساهيل">info@salabaa.com</a> واكتب رقم الجوال المسجل. سنتحقق من ملكية الحساب قبل تنفيذ الطلب.</p></div>
        <Link to="/" className="btn-primary flex h-12 items-center justify-center">العودة إلى تساهيل</Link>
      </section>
    </div>
  </main>;
}
