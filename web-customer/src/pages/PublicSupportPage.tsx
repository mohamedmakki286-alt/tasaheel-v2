import { Headphones, Mail, Phone, Trash2 } from 'lucide-react';
import LegalPageShell from '../components/LegalPageShell';

export default function PublicSupportPage() {
  return <LegalPageShell title="الدعم والمساعدة" subtitle="قنوات التواصل الرسمية مع خدمة عملاء تساهيل">
    <p>إذا كنت مسجلاً، افتح «حسابي ← الدعم والمساعدة» لإنشاء تذكرة ومتابعة الردود من داخل التطبيق. وللمساعدة العامة استخدم إحدى القنوات التالية.</p>
    <div className="grid gap-3 sm:grid-cols-2"><a href="mailto:info@salabaa.com" className="flex items-center gap-3 rounded-2xl border border-surface-200 p-4 font-bold dark:border-surface-700"><Mail className="text-accent-600"/>info@salabaa.com</a><a href="tel:+966575903086" className="flex items-center gap-3 rounded-2xl border border-surface-200 p-4 font-bold dark:border-surface-700"><Phone className="text-emerald-500"/>0575903086</a></div>
    <section><h2 className="font-black text-surface-900 dark:text-white">عند التواصل</h2><p className="mt-2 text-sm">اذكر رقم الطلب ونوع المشكلة، ولا ترسل كلمة المرور أو رمز التحقق أو بيانات البطاقة.</p></section>
    <a href="/account-deletion" className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300"><Trash2 size={19}/>طلب حذف الحساب دون تسجيل الدخول</a>
    <div className="flex items-center gap-3 rounded-2xl bg-surface-50 p-4 text-sm dark:bg-surface-800"><Headphones className="shrink-0 text-accent-600"/>ساعات استجابة الدعم: يومياً من 9 صباحاً حتى 9 مساءً بتوقيت السعودية.</div>
  </LegalPageShell>;
}
