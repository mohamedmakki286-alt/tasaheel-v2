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
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/reset`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'الرابط منتهي أو مستخدم');
      setDone(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-5" dir="rtl">
    <section className="w-full max-w-md card p-7 text-center">
      {done ? <><CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4"/><h1 className="text-2xl font-bold">تم تعيين كلمة المرور</h1><p className="text-surface-500 mt-2">سيتم نقلك لتسجيل الدخول الآن.</p></> : <>
        <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4"><LockKeyhole className="w-8 h-8"/></div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{isInvitation ? 'إعداد حساب الورشة' : 'استعادة كلمة المرور'}</h1>
        <p className="text-sm text-surface-500 mt-2 mb-6">اختر كلمة مرور قوية لحساب الورشة.</p>
        <form onSubmit={submit} className="space-y-4 text-right">
          <label className="block"><span className="label">كلمة المرور الجديدة</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field mt-1" autoComplete="new-password"/></label>
          <label className="block"><span className="label">تأكيد كلمة المرور</span><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field mt-1" autoComplete="new-password"/></label>
          <button disabled={loading || !token} className="btn-primary w-full">{loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}</button>
        </form>
        {!token && <p className="text-red-500 text-sm mt-3">هذا الرابط غير صالح.</p>}
        <Link to="/login" className="inline-block text-sm text-surface-500 mt-5">العودة لتسجيل الدخول</Link>
      </>}
    </section>
  </main>;
}
