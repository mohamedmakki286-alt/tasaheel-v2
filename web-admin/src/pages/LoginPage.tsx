import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn, BadgeCheck, Activity, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { useAuth } from '../hooks/useAuth';
import AuthBrandPanel from '../components/AuthBrandPanel';

const API = import.meta.env.VITE_API_URL || '/api';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { login, isLoggingIn } = useAuth();
  const { theme, toggle } = useThemeStore();
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 6) return toast.error('تحقق من بيانات الدخول');
    login({ email: email.trim(), password });
  };

  const forgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('أدخل بريداً صحيحاً');
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      if (!r.ok) throw new Error();
      setMode('reset');
      toast.success('تم إرسال رمز الاسترجاع');
    } catch { toast.error('تعذر إرسال الرمز'); }
    finally { setLoading(false); }
  };

  const reset = async () => {
    if (!/^\d{6}$/.test(token.trim()) || newPassword.length < 8) return toast.error('أدخل رمزًا صحيحًا وكلمة مرور من 8 أحرف على الأقل');
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token.trim(), newPassword }) });
      if (!r.ok) throw new Error();
      toast.success('تم تغيير كلمة المرور');
      setMode('login');
    } catch { toast.error('تعذر تغيير كلمة المرور'); }
    finally { setLoading(false); }
  };

  const features = [
    { icon: BadgeCheck, title: 'اعتماد الورش', description: 'مراجعة الحسابات والتراخيص' },
    { icon: Activity, title: 'مراقبة التشغيل', description: 'متابعة الطلبات والمدفوعات' },
    { icon: ShieldCheck, title: 'صلاحيات محكمة', description: 'سجل تدقيق وحماية إضافية' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950" dir="rtl">
      <AuthBrandPanel title="إدارة منصة تساهيل" subtitle="دخول مخصص للمشرفين المعتمدين" features={features} />
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <button onClick={toggle} aria-label="تغيير المظهر" className="absolute left-4 top-4 rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 sm:left-8 sm:top-6">{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button>
        <div className="w-full max-w-md">
          <div className="mb-7 text-center lg:hidden"><span className="inline-flex rounded-3xl bg-white p-2 shadow-sm"><img src="/tasaheel-logo.png" alt="تساهيل" className="h-20 w-auto"/></span><p className="mt-3 text-sm font-bold text-gray-500">لوحة إدارة المنصة</p></div>
          {mode === 'login' && <>
            <div className="mb-7"><h1 className="text-3xl font-black text-gray-950 dark:text-white">دخول الإدارة</h1><p className="mt-2 text-gray-500 dark:text-gray-400">استخدم حساب المشرف المعتمد للوصول إلى المنصة.</p></div>
            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">البريد الإداري<div className="relative mt-1.5"><Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@tasaheel.sa" dir="ltr" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-left text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"/></div></label>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">كلمة المرور<div className="relative mt-1.5"><Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 bg-white px-10 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="إظهار كلمة المرور" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
              <div className="flex justify-end"><button type="button" onClick={()=>setMode('forgot')} className="text-sm font-bold text-red-600 dark:text-red-400">نسيت كلمة المرور؟</button></div>
              <button type="submit" disabled={isLoggingIn} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50">{isLoggingIn?<span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"/>:<><LogIn size={18}/>دخول آمن</>}</button>
            </form>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-gray-400"><ShieldCheck size={15}/> يتم تسجيل محاولات الدخول لحماية المنصة.</p>
          </>}
          {mode === 'forgot' && <><div className="mb-7"><h1 className="text-3xl font-black text-gray-950 dark:text-white">استرجاع كلمة المرور</h1><p className="mt-2 text-gray-500">سنرسل رمزاً إلى البريد الإداري المسجل.</p></div><div className="space-y-5"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@tasaheel.sa" dir="ltr" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"/><button onClick={forgot} disabled={loading} className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white">{loading?'جاري الإرسال…':'إرسال الرمز'}</button><button onClick={()=>setMode('login')} className="w-full text-sm font-bold text-gray-500">العودة للدخول</button></div></>}
          {mode === 'reset' && <><div className="mb-7"><h1 className="text-3xl font-black text-gray-950 dark:text-white">تعيين كلمة مرور جديدة</h1><p className="mt-2 text-gray-500">أدخل الرمز المرسل ثم كلمة المرور الجديدة.</p></div><div className="space-y-5"><input inputMode="numeric" maxLength={6} value={token} onChange={e=>setToken(e.target.value.replace(/\D/g, ''))} placeholder="000000" dir="ltr" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center tracking-[0.4em] outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"/><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"/><button onClick={reset} disabled={loading} className="w-full rounded-xl bg-red-600 px-5 py-3 font-bold text-white">{loading?'جاري الحفظ…':'حفظ كلمة المرور'}</button><button onClick={()=>setMode('login')} className="w-full text-sm font-bold text-gray-500">العودة للدخول</button></div></>}
        </div>
      </main>
    </div>
  );
}
