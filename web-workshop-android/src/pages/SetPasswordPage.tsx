import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const isInvitation = location.pathname.includes('set-password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('الرابط غير صالح أو ناقص');
    if (password.length < 8) return toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    if (password !== confirm) return toast.error('كلمتا المرور غير متطابقتين');
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }) });
      if (!response.ok) throw new Error('الرابط منتهي أو مستخدم');
      setDone(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (error: any) { toast.error(error.message); }
    finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-50 p-5 dark:bg-surface-950" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-surface-200 bg-white p-7 text-center shadow-xl dark:border-surface-800 dark:bg-surface-900">
        <span className="mb-6 inline-flex rounded-3xl bg-white p-2 shadow-sm"><img src="/tasaheel-logo.png" alt="تساهيل" className="h-20 w-auto"/></span>
        {done ? <>
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500"/>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white">تم تعيين كلمة المرور</h1>
          <p className="mt-2 text-surface-500">سيتم نقلك لتسجيل الدخول الآن.</p>
        </> : <>
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400"><LockKeyhole size={27}/></span>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white">{isInvitation ? 'إعداد حساب الورشة' : 'استعادة كلمة المرور'}</h1>
          <p className="mb-6 mt-2 text-sm text-surface-500">اختر كلمة مرور قوية لحسابك.</p>
          <form onSubmit={submit} className="space-y-4 text-right">
            <label className="label">كلمة المرور الجديدة<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field mt-1.5" autoComplete="new-password"/></label>
            <label className="label">تأكيد كلمة المرور<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} className="input-field mt-1.5" autoComplete="new-password"/></label>
            <button disabled={loading || !token} className="btn-primary w-full">{loading ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}</button>
          </form>
          {!token && <p className="mt-3 text-sm text-red-500">هذا الرابط غير صالح.</p>}
          <Link to="/login" className="mt-5 inline-block text-sm font-bold text-surface-500">العودة لتسجيل الدخول</Link>
        </>}
      </section>
    </main>
  );
}
