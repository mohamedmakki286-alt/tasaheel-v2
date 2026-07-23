import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Wrench, Settings, ClipboardList, Car, ArrowRight, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { login, mapWorkshopData, authApi } from '../api/auth.api';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import AnimatedWorkshopBackground from '../components/AnimatedWorkshopBackground';
import OAuthButtons from '../components/OAuthButtons';

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error(t('toast.error.invalidEmail')); return; }
    setLoading(true);
    try { const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) }); if (!r.ok) { const err = await r.json(); toast.error(err.message || t('toast.error.emailNotRegistered')); return; } toast.success(t('toast.success.passwordChanged')); setStep('done'); } catch { toast.error(t('toast.error.forgotSendFailed')); } finally { setLoading(false); }
  };
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white text-center">{t('pages.login.forgotPasswordTitle')}</h3>
      <p className="text-surface-500 text-sm text-center">{step === 'email' ? t('pages.login.forgotStep1') : 'إذا كان البريد مسجلاً ستصلك رسالة تحتوي رابطاً آمناً لتعيين كلمة مرور جديدة.'}</p>
      {step === 'email' ? (<><div className="relative"><Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('pages.login.emailPlaceholder2')} dir="ltr" className="input-field pr-9 pl-4" /></div><button onClick={handleSend} disabled={loading} className="btn-primary w-full">{loading ? t('pages.login.loading') : t('pages.login.sendResetLink')}</button></>) : <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-4 text-center">راجع صندوق الوارد والبريد غير المرغوب فيه.</div>}
      <button onClick={onBack} className="w-full text-center text-sm text-surface-500 hover:text-surface-700">{t('pages.login.backToLogin')}</button>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogleCallback = async (accessToken: string) => {
    try {
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json());
      if (!userInfo.email) { toast.error(t('toast.error.googleInfoFailed')); return; }
      const res = await apiClient.post('/auth/oauth/google', {
        email: userInfo.email,
        name: userInfo.name,
        sub: userInfo.sub,
      });
      const d = res.data;
      if (d.role !== 'workshop') { toast.error(t('toast.error.workshopOnly')); return; }
      setAuth({ token: d.token, refreshToken: d.refreshToken, role: 'workshop', workshop: {
        id: String(d.userId), name: d.name || '', ownerName: d.ownerName || '',
        phone: d.phone || '', address: d.address || '', city: d.city || '',
        workshopType: d.workshopType || 'stationary',
        services: d.services ? (typeof d.services === 'string' ? d.services.split(',') : d.services) : [],
        isApproved: d.isApproved, rating: d.rating || 0, reviewsCount: 0, completedJobs: 0, createdAt: d.createdAt || new Date().toISOString(),
      }});
      toast.success(t('toast.success.googleLoginSuccess'));
      window.history.replaceState({}, document.title, window.location.pathname);
      if (d.isApproved === false) {
        navigate('/pending-approval', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.googleLoginFailed'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      if (accessToken) handleGoogleCallback(accessToken);
    }
  }, []);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error(t('toast.error.invalidEmail')); return; }
    if (!password.trim()) { toast.error(t('pages.login.enterPassword')); return; }
    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      if (data.role === 'technician') {
        setAuth({
          token: data.token,
          refreshToken: data.refreshToken,
          role: 'technician',
          technician: {
            id: data.userId,
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            specialty: data.specialty || '',
            workshopId: data.workshopId,
            workshopName: data.workshopName || '',
            availabilityStatus: data.availabilityStatus || 'available',
            profileImageUrl: data.profileImageUrl || null,
          },
        });
        toast.success(t('toast.success.loginSuccess'));
        navigate('/technician', { replace: true });
      } else {
        const workshopData = mapWorkshopData(data);
        setAuth({ token: data.token, refreshToken: data.refreshToken, role: 'workshop', workshop: workshopData });
        toast.success(t('toast.success.loginSuccess'));
        if (workshopData.isApproved === false) {
          navigate('/pending-approval', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      toast.error(err?.message || t('pages.login.loginFailed'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <style>{`@keyframes w-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.w-anim{animation:w-fade-in 0.5s ease-out both}`}</style>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-900">
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-12"><div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl shadow-accent-500/30 mb-6 bg-gradient-to-br from-accent-500 to-accent-700"><Wrench className="w-12 h-12 text-white" /></div><h1 className="text-4xl font-bold text-white mb-2">{t('pages.login.title')}</h1><p className="text-white/50 text-lg">{t('pages.login.subtitle')}</p></div>
            <div className="space-y-5">{[{ icon: ClipboardList, title: t('pages.login.features.receiveRequests'), desc: t('pages.login.features.receiveRequestsDesc') },{ icon: Car, title: t('pages.login.features.manageServices'), desc: t('pages.login.features.manageServicesDesc') },{ icon: Settings, title: t('pages.login.features.reports'), desc: t('pages.login.features.reportsDesc') }].map((item, idx) => (<div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 w-anim" style={{animationDelay:`${idx*0.1}s`}}><div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0"><item.icon className="w-6 h-6 text-accent-400" /></div><div><p className="text-white font-semibold">{item.title}</p><p className="text-white/50 text-sm">{item.desc}</p></div></div>))}</div>
          </div>
          <p className="absolute bottom-8 text-white/20 text-sm">{t('pages.login.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-accent-500 to-accent-700" />
        <div className="w-full max-w-md">
          <div className="text-center lg:hidden mb-8"><div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 bg-gradient-to-br from-accent-500 to-accent-700"><Wrench className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-bold text-surface-900 dark:text-white">{t('pages.login.title')}</h1><p className="text-surface-500 mt-1">{t('pages.login.mobileSubtitle')}</p></div>
          <div className="hidden lg:block mb-8"><h2 className="text-3xl font-bold text-surface-900 dark:text-white mb-1">{t('pages.login.welcome')}</h2><p className="text-surface-500">{t('pages.login.welcomeSubtitle')}</p></div>
          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label className="label">{t('pages.login.emailLabel')}</label><div className="relative"><Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('pages.login.emailPlaceholder')} className="input-field pr-9 pl-4" dir="ltr" required /></div></div>
                <div><label className="label">{t('pages.login.passwordLabel')}</label><div className="relative"><Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('pages.login.passwordPlaceholder')} className="input-field pl-10 pr-9" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                <div className="flex justify-end"><button type="button" onClick={() => setShowForgot(true)} className="text-sm text-surface-500 hover:text-accent-500 font-medium">{t('pages.login.forgotPassword')}</button></div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">{loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowRight size={16} /> {t('pages.login.loginButton')}</>}</button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-surface-950 px-3 text-surface-400">{t('pages.login.orDivider')}</span></div>
              </div>
              <OAuthButtons />
            </>
          ) : <ForgotPasswordForm onBack={() => setShowForgot(false)} />}
          {!showForgot && <div className="mt-6 text-center"><p className="text-surface-500 text-sm">{t('pages.login.contactAdmin', 'لإنشاء حساب جديد تواصل مع الإدارة')}</p></div>}
        </div>
      </div>
    </div>
  );
}
