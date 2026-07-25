import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn, ClipboardList, Users, FileText, Moon, Sun } from 'lucide-react';
import { login, mapWorkshopData } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import AuthBrandPanel from '../components/AuthBrandPanel';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'forgot' | 'sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) return toast.error('تحقق من البريد الإلكتروني وكلمة المرور');
    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.role === 'technician') {
        setAuth({ token: data.token, refreshToken: data.refreshToken, role: 'technician', technician: { id: data.userId, name: data.name || '', phone: data.phone || '', email: data.email || '', specialty: data.specialty || '', workshopId: data.workshopId, workshopName: data.workshopName || '', availabilityStatus: data.availabilityStatus || 'available', profileImageUrl: data.profileImageUrl || null } });
        toast.success('مرحباً بعودتك');
        navigate('/technician', { replace: true });
      } else {
        const workshop = mapWorkshopData(data);
        setAuth({ token: data.token, refreshToken: data.refreshToken, role: 'workshop', workshop });
        toast.success('مرحباً بعودتك');
        navigate(workshop.isApproved === false ? '/pending-approval' : '/dashboard', { replace: true });
      }
    } catch (err: any) { toast.error(err?.message || 'تعذر تسجيل الدخول'); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('أدخل بريداً إلكترونياً صحيحاً');
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      if (!r.ok) throw new Error();
      setMode('sent');
    } catch { toast.error('تعذر إرسال رابط الاسترجاع'); }
    finally { setLoading(false); }
  };

  const features = [
    { icon: ClipboardList, title: 'استقبال الطلبات', description: 'طلبات العملاء الجديدة تصل فوراً' },
    { icon: Users, title: 'إدارة الفنيين', description: 'إسناد ومتابعة تنفيذ المهام' },
    { icon: FileText, title: 'تقارير وفواتير', description: 'رؤية واضحة لأداء الورشة' },
  ];

  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950" dir="rtl">
      <AuthBrandPanel title="شغّل ورشتك بكفاءة" subtitle="طلبات وفنيون وفواتير في مكان واحد" features={features} />
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <button onClick={toggle} aria-label="تغيير المظهر" className="absolute left-4 top-4 rounded-xl p-2 text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 sm:left-8 sm:top-6">{theme === 'dark' ? <Sun size={19}/> : <Moon size={19}/>}</button>
        <div className="w-full max-w-md">
          <div className="mb-7 text-center lg:hidden"><span className="inline-flex rounded-3xl bg-white p-2 shadow-sm"><img src="/tasaheel-logo.png" alt="تساهيل" className="h-20 w-auto"/></span><p className="mt-3 text-sm font-bold text-surface-500">بوابة الورش والفنيين</p></div>
          {mode === 'login' && <>
            <div className="mb-7"><h1 className="text-3xl font-black text-surface-900 dark:text-white">مرحباً بعودتك</h1><p className="mt-2 text-surface-500">سجّل دخولك لإدارة ورشتك أو مهامك الفنية.</p></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="label">البريد الإلكتروني<div className="relative mt-1.5"><Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="workshop@example.com" dir="ltr" className="input-field pr-10 text-left"/></div></label>
              <label className="label">كلمة المرور<div className="relative mt-1.5"><Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="input-field px-10"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="إظهار كلمة المرور" className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
              <div className="flex justify-end"><button type="button" onClick={()=>setMode('forgot')} className="text-sm font-bold text-accent-600 dark:text-accent-400">نسيت كلمة المرور؟</button></div>
              <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2">{loading?<span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"/>:<><LogIn size={18}/>تسجيل الدخول</>}</button>
            </form>
            <p className="mt-6 text-center text-sm text-surface-500">لإنشاء حساب ورشة جديد تواصل مع إدارة تساهيل.</p>
          </>}
          {mode === 'forgot' && <><div className="mb-7"><h1 className="text-3xl font-black text-surface-900 dark:text-white">استرجاع كلمة المرور</h1><p className="mt-2 text-surface-500">سنرسل رابطاً آمناً إلى البريد المسجل.</p></div><div className="space-y-5"><label className="label">البريد الإلكتروني<div className="relative mt-1.5"><Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="workshop@example.com" dir="ltr" className="input-field pr-10 text-left"/></div></label><button onClick={handleForgot} disabled={loading} className="btn-primary w-full">{loading?'جاري الإرسال…':'إرسال رابط الاسترجاع'}</button><button onClick={()=>setMode('login')} className="w-full text-sm font-bold text-surface-500">العودة لتسجيل الدخول</button></div></>}
          {mode === 'sent' && <div className="text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500"><Mail size={30}/></span><h1 className="mt-5 text-2xl font-black text-surface-900 dark:text-white">راجع بريدك الإلكتروني</h1><p className="mt-2 text-surface-500">إذا كان البريد مسجلاً ستصلك رسالة تحتوي رابطاً آمناً لتعيين كلمة مرور جديدة.</p><button onClick={()=>setMode('login')} className="btn-primary mt-6 w-full">العودة لتسجيل الدخول</button></div>}
        </div>
      </main>
    </div>
  );
}
