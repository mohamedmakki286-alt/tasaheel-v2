import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import type { Customer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, LogIn } from 'lucide-react';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
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
    if (!email.trim() || !password.trim()) {
      toast.error('أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res: any = await authApi.login({ email: email.trim(), password });
      const d = res.data || res;
      if (d.role !== 'customer') { toast.error('هذا الحساب ليس حساب عميل'); return; }
      if (!d.isActive) { toast.error('حسابك غير نشط'); return; }
      const customer: Customer = {
        id: String(d.userId), name: d.name || '', phone: d.phone || '',
        email: d.email || '', city: '', isActive: d.isActive ?? true,
      };
      setAuth({ token: d.token, refreshToken: d.refreshToken, role: 'customer', customer });
      toast.success('مرحباً بعودتك!');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) { toast.error('أدخل بريد إلكتروني صحيح'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail.trim() }) });
      if (!r.ok) { const err = await r.json(); toast.error(err.message || 'البريد غير مسجل'); return; }
      toast.success('تم إرسال رمز إعادة التعيين');
      setStep('reset');
    } catch { toast.error('فشل الإرسال'); } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!resetToken.trim()) { toast.error('أدخل الرمز'); return; }
    if (newPassword.length < 6) { toast.error('كلمة المرور 6 أحرف على الأقل'); return; }
    setLoading(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken.trim(), newPassword }) });
      if (r.ok) { toast.success('تم تغيير كلمة المرور'); setStep('credentials'); }
      else { const err = await r.json(); toast.error(err.message || 'فشل'); }
    } catch { toast.error('فشل الاتصال'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-surface-500 text-sm">
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          الرئيسية
        </button>
        <button onClick={() => i18n.changeLanguage(isRtl ? 'en' : 'ar')} className="text-sm text-surface-500 font-bold">
          {isRtl ? 'EN' : 'عر'}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="mb-8">
          <img src="/tasaheel-app-icon.png" alt="تساهيل" className="w-20 h-20 rounded-3xl mx-auto shadow-xl" />
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'credentials' && (
            <motion.div key="login" initial={{ opacity: 0, x: isRtl ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? -20 : 20 }} className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">مرحباً بعودتك!</h1>
                <p className="text-surface-500 mt-2">تسجيل الدخول إلى حسابك</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" className="input-field pr-10 text-left" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pr-10 pl-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => setStep('forgot')} className="text-sm text-accent-500 hover:text-accent-600 font-medium">
                    نسيت كلمة المرور؟
                  </button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl font-bold bg-accent-500 hover:bg-accent-600 text-white transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} /> تسجيل الدخول</>}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-surface-500 text-sm">ليس لديك حساب؟ <Link to="/register" className="text-accent-500 font-bold hover:text-accent-600">سجل الآن</Link></p>
              </div>
            </motion.div>
          )}

          {step === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">نسيت كلمة المرور؟</h1>
                <p className="text-surface-500 mt-2">أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة التعيين</p>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="example@email.com" dir="ltr" className="input-field pr-10 text-left" />
                </div>
                <button onClick={handleForgotPassword} disabled={loading} className="w-full py-3.5 rounded-2xl font-bold bg-accent-500 hover:bg-accent-600 text-white transition-all active:scale-[0.98] disabled:opacity-50">
                  {loading ? 'جاري الإرسال...' : 'إرسال الرمز'}
                </button>
                <button onClick={() => setStep('credentials')} className="w-full text-center text-sm text-surface-500 hover:text-surface-700">رجوع لتسجيل الدخول</button>
              </div>
            </motion.div>
          )}

          {step === 'reset' && (
            <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-sm">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">إعادة تعيين كلمة المرور</h1>
                <p className="text-surface-500 mt-2">أدخل الرمز الجديد وكلمة المرور</p>
              </div>
              <div className="space-y-4">
                <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="الرمز" className="input-field text-center" />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" minLength={6} className="input-field" />
                <button onClick={handleReset} disabled={loading} className="w-full py-3.5 rounded-2xl font-bold bg-success-500 hover:bg-success-600 text-white transition-all active:scale-[0.98] disabled:opacity-50">
                  {loading ? 'جاري...' : 'تغيير كلمة المرور'}
                </button>
                <button onClick={() => setStep('credentials')} className="w-full text-center text-sm text-surface-500 hover:text-surface-700">رجوع</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
