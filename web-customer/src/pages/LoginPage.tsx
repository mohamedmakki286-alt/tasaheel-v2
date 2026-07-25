import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, Car, MessagesSquare, ShieldCheck, Moon, Sun } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import type { Customer } from '../types';
import AuthBrandPanel from '../components/AuthBrandPanel';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggleTheme } = useThemeStore();
  const [step, setStep] = useState<'credentials' | 'forgot' | 'reset'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return toast.error('أدخل البريد الإلكتروني وكلمة المرور');
    setLoading(true);
    try {
      const res: any = await authApi.login({ email: email.trim(), password });
      const d = res.data || res;
      if (d.role !== 'customer') return toast.error('هذا الحساب ليس حساب عميل');
      if (!d.isActive) return toast.error('حسابك غير نشط');
      const customer: Customer = { id: String(d.userId), name: d.name || '', phone: d.phone || '', email: d.email || '', city: '', isActive: true };
      setAuth({ token: d.token, refreshToken: d.refreshToken, role: 'customer', customer });
      toast.success('مرحباً بعودتك');
      navigate('/', { replace: true });
    } catch (err: any) { toast.error(err.response?.data?.message || 'البريد أو كلمة المرور غير صحيحة'); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) return toast.error('أدخل بريداً إلكترونياً صحيحاً');
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail.trim() }) });
      if (!r.ok) throw new Error();
      toast.success('تم إرسال رمز إعادة التعيين');
      setStep('reset');
    } catch { toast.error('تعذر إرسال الرمز'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!resetToken.trim() || newPassword.length < 6) return toast.error('تحقق من الرمز وكلمة المرور الجديدة');
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken.trim(), newPassword }) });
      if (!r.ok) throw new Error();
      toast.success('تم تغيير كلمة المرور');
      setStep('credentials');
    } catch { toast.error('فشل تغيير كلمة المرور'); }
    finally { setLoading(false); }
  };

  const features = [
    { icon: Car, title: 'خدمات موثوقة', description: 'اختر الخدمة والورشة المناسبة لسيارتك' },
    { icon: MessagesSquare, title: 'متابعة مباشرة', description: 'تواصل وتابع حالة الطلب خطوة بخطوة' },
    { icon: ShieldCheck, title: 'دفع وبيانات آمنة', description: 'فواتير وسجل صيانة محفوظان في حسابك' },
  ];

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950" dir="rtl">
      <AuthBrandPanel title="سيارتك في أيدٍ أمينة" subtitle="خدمات صيانة أوضح، أسرع، وأقرب إليك" features={features} />
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <div className="absolute inset-x-0 top-0 flex h-16 items-center justify-between px-4 sm:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-surface-500 hover:text-accent-600"><ArrowRight size={16}/> الرئيسية</button>
          <button onClick={toggleTheme} aria-label="تغيير المظهر" className="rounded-xl p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800">{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        </div>
        <div className="w-full max-w-md pt-12">
          <div className="mb-7 text-center lg:hidden"><span className="inline-flex rounded-3xl bg-white p-2 shadow-sm"><img src="/tasaheel-logo.png" alt="تساهيل" className="h-20 w-auto"/></span></div>
          {step === 'credentials' && <>
            <div className="mb-7"><h1 className="text-3xl font-black text-surface-900 dark:text-white">مرحباً بعودتك</h1><p className="mt-2 text-surface-500">سجّل دخولك لمتابعة طلبات سيارتك.</p></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="label">البريد الإلكتروني<div className="relative mt-1.5"><Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="input-field pr-10 text-left"/></div></label>
              <label className="label">كلمة المرور<div className="relative mt-1.5"><Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input-field px-10"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="إظهار كلمة المرور" className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
              <div className="flex justify-end"><button type="button" onClick={()=>setStep('forgot')} className="text-sm font-bold text-accent-600 dark:text-accent-400">نسيت كلمة المرور؟</button></div>
              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2">{loading?<span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"/>:<><LogIn size={18}/>تسجيل الدخول</>}</button>
            </form>
            <p className="mt-6 text-center text-sm text-surface-500">ليس لديك حساب؟ <Link to="/register" className="font-bold text-accent-600 dark:text-accent-400">إنشاء حساب جديد</Link></p>
          </>}
          {step === 'forgot' && <>
            <div className="mb-7"><h1 className="text-3xl font-black text-surface-900 dark:text-white">استرجاع كلمة المرور</h1><p className="mt-2 text-surface-500">أدخل بريدك وسنرسل لك رمز إعادة التعيين.</p></div>
            <div className="space-y-5"><label className="label">البريد الإلكتروني<div className="relative mt-1.5"><Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="input-field pr-10 text-left"/></div></label><button onClick={handleForgot} disabled={loading} className="btn-primary w-full">{loading?'جاري الإرسال…':'إرسال رمز التحقق'}</button><button onClick={()=>setStep('credentials')} className="w-full text-sm font-bold text-surface-500">العودة لتسجيل الدخول</button></div>
          </>}
          {step === 'reset' && <>
            <div className="mb-7"><h1 className="text-3xl font-black text-surface-900 dark:text-white">كلمة مرور جديدة</h1><p className="mt-2 text-surface-500">أدخل الرمز ثم اختر كلمة مرور قوية.</p></div>
            <div className="space-y-5"><label className="label">رمز التحقق<input value={resetToken} onChange={e=>setResetToken(e.target.value)} placeholder="رمز التحقق" className="input-field mt-1.5 text-center"/></label><label className="label">كلمة المرور الجديدة<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="••••••••" className="input-field mt-1.5"/></label><button onClick={handleReset} disabled={loading} className="btn-primary w-full">{loading?'جاري الحفظ…':'حفظ كلمة المرور'}</button><button onClick={()=>setStep('credentials')} className="w-full text-sm font-bold text-surface-500">العودة لتسجيل الدخول</button></div>
          </>}
        </div>
      </main>
    </div>
  );
}
