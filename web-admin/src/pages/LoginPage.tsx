import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Wrench, Users, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';
import AnimatedWorkshopBackground from '../components/AnimatedWorkshopBackground';
import toast from 'react-hot-toast';
import OAuthButtons from '../components/OAuthButtons';
import client from '../api/client';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL || '/api';

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error(t('toast.error.invalidEmail')); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
      if (!r.ok) { const err = await r.json(); toast.error(err.message || t('toast.error.emailNotRegistered')); return; }
      toast.success(t('toast.success.resetLinkSent')); setStep('done');
    } catch { toast.error(t('toast.error.sendFailed')); } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!token.trim()) { toast.error(t('toast.error.enterToken')); return; }
    if (newPassword.length < 6) { toast.error(t('toast.error.passwordMinLength')); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token.trim(), newPassword }) });
      if (r.ok) { toast.success(t('toast.success.passwordChanged')); onBack(); } else { const err = await r.json(); toast.error(err.message || t('toast.error.failed')); }
    } catch { toast.error(t('toast.error.connectionFailed')); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4"><h3 className="text-lg font-bold text-[#0f1724]">{t('pages.login.forgotPasswordTitle')}</h3><p className="text-gray-500 text-sm mt-1">{step === 'email' ? t('pages.login.forgotStep1') : t('pages.login.forgotStep2')}</p></div>
      {step === 'email' ? <div className="space-y-3"><div className="relative"><Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('pages.login.emailPlaceholder2')} dir="ltr" className="w-full rounded-xl border-2 border-gray-200 bg-white pr-9 pl-4 py-3 text-sm focus:outline-none focus:border-amber-500" /></div><button onClick={handleSend} disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-50">{loading ? t('pages.login.loading') : t('pages.login.sendResetLink')}</button></div> : <div className="space-y-3"><input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder={t('pages.login.tokenPlaceholder')} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-center focus:outline-none focus:border-amber-500" /><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('pages.login.newPasswordPlaceholder')} minLength={6} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-amber-500" /><button onClick={handleReset} disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-50">{loading ? t('pages.login.loading') : t('pages.login.changePassword')}</button></div>}
      <button onClick={onBack} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">{t('pages.login.backToLogin')}</button>
    </div>
  );
}

export default function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t, i18n } = useTranslation();

  const handleGoogleCallback = async (accessToken: string) => {
    try {
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json());
      if (!userInfo.email) { toast.error(t('toast.error.googleInfoFailed')); return; }
      const res = await client.post('/auth/oauth/google', {
        email: userInfo.email,
        name: userInfo.name,
        sub: userInfo.sub,
      });
      const d = res.data;
      if (d.role !== 'admin' && d.role !== 'super_admin') { toast.error(t('toast.error.adminsOnly')); return; }
      setAuth({ user: { id: d.userId, name: d.name || '', phone: d.phone || '', email: d.email, role: d.role, createdAt: new Date().toISOString() }, token: d.token, refreshToken: d.refreshToken, role: d.role });
      toast.success(t('toast.success.googleLogin'));
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/', { replace: true });
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

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir();
  }, [i18n, i18n.language]);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error(t('toast.error.invalidEmail')); return; }
    if (!password.trim() || password.length < 6) { toast.error(t('toast.error.passwordMinLength')); return; }
    login({ email: email.trim(), password });
  };

  const features = [
    { icon: Users, title: t('pages.login.feature1Title'), desc: t('pages.login.feature1Desc') },
    { icon: Wrench, title: t('pages.login.feature2Title'), desc: t('pages.login.feature2Desc') },
    { icon: ClipboardList, title: t('pages.login.feature3Title'), desc: t('pages.login.feature3Desc') },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <AnimatedWorkshopBackground />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl shadow-amber-500/30 mb-6 bg-gradient-to-br from-amber-500 to-amber-600">
                <Wrench className="w-12 h-12 text-black" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{t('pages.login.title')}</h1>
              <p className="text-white/50 text-lg">{t('pages.login.subtitle')}</p>
            </div>
            <div className="space-y-6">
              {features.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10" style={{animationDelay:`${idx*0.1}s`,animationDuration:'0.5s',animationFillMode:'both'}}>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0"><item.icon className="w-6 h-6 text-amber-400" /></div>
                  <div><p className="text-white font-semibold">{item.title}</p><p className="text-white/50 text-sm">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          <p className="absolute bottom-8 text-white/20 text-sm">{t('pages.login.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-amber-500 to-amber-600" />
        <div className="w-full max-w-md">
          <div className="text-center lg:hidden mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 bg-gradient-to-br from-amber-500 to-amber-600"><Wrench className="w-10 h-10 text-black" /></div>
            <h1 className="text-2xl font-bold text-[#0f1724]">{t('pages.login.title')}</h1><p className="text-gray-500 mt-1">{t('pages.login.mobileSubtitle')}</p>
          </div>
          <div className="hidden lg:block mb-8"><h2 className="text-3xl font-bold text-[#0f1724] mb-1">{t('pages.login.welcome')}</h2><p className="text-gray-500">{t('pages.login.welcomeSubtitle')}</p></div>
          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.login.emailLabel')}</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('pages.login.emailPlaceholder')} className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 pr-9 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10" dir="ltr" required />
                  </div></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('pages.login.passwordLabel')}</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('pages.login.passwordPlaceholder')} className="w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-9 py-3 text-sm text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div></div>
                <div className="flex justify-end"><button type="button" onClick={() => setShowForgot(true)} className="text-sm text-amber-600 hover:text-amber-700 font-medium">{t('pages.login.forgotPassword')}</button></div>
                <Button type="submit" isLoading={isLoggingIn} className="w-full" size="lg">{t('pages.login.loginButton')}</Button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">{t('pages.login.orDivider')}</span></div>
              </div>
              <OAuthButtons />
            </>
          ) : <ForgotPasswordForm onBack={() => setShowForgot(false)} />}
          <p className="text-center text-gray-400 text-xs mt-8 lg:hidden">{t('pages.login.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  );
}
