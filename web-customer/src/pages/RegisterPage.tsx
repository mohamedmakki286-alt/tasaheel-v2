import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';
import client from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { Customer } from '../types';
import { UserPlus, User, Mail, Lock, MapPin, Phone, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedWorkshopBackground from '../components/AnimatedWorkshopBackground';
import OAuthButtons from '../components/OAuthButtons';

export function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

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
      if (d.role !== 'customer') { toast.error(t('toast.error.customerOnly')); return; }
      const customer: Customer = {
        id: String(d.userId), name: d.name || '', phone: d.phone || '',
        email: d.email || '', city: '', isActive: d.isActive ?? true,
      };
      setAuth({ token: d.token, refreshToken: d.refreshToken, role: 'customer', customer });
      toast.success(t('toast.success.googleLoginSuccess'));
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/app', { replace: true });
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

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error(t('toast.error.invalidEmail')); return; }
    if (!form.password || form.password.length < 6) { toast.error(t('toast.error.passwordShort')); return; }
    setLoading(true);
    try {
      await authApi.register({ name: form.name, email: form.email, phone: form.phone || undefined, city: form.city, password: form.password });
      setRegistered(true);
      toast.success(t('toast.success.accountCreated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.registrationFailed'));
    } finally { setLoading(false); }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setCode(paste.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  useEffect(() => {
    if (registered && code.every((d) => d)) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setVerifying(true);
    try {
      await authApi.verifyEmail(form.email, fullCode);
      toast.success(t('toast.success.accountVerified'));
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.verificationFailed'));
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(form.email);
      toast.success(t('toast.success.codeResent'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('toast.error.resendFailed'));
    } finally { setResending(false); }
  };

  if (registered) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <AnimatedWorkshopBackground />
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-700/50 rounded-3xl p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{t('auth.register.successTitle')}</h2>
            <p className="text-surface-400 text-sm mb-1">{t('auth.register.successSubtitle')}</p>
            <p className="text-accent-400 font-medium text-sm mb-6" dir="ltr">{form.email}</p>

            <div className="flex items-center justify-center gap-2 mb-6" dir="ltr" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 bg-surface-800/80 text-white focus:outline-none transition-colors ${
                    digit ? 'border-accent-500' : 'border-surface-700 focus:border-accent-500/50'
                  }`}
                />
              ))}
            </div>

            {verifying && <p className="text-sm text-surface-400 mb-4"><Loader2 className="h-4 w-4 inline animate-spin ml-1" />{t('auth.register.verifying')}</p>}

            <button onClick={handleVerify} disabled={verifying || code.some((d) => !d)} className="w-full py-3 rounded-2xl font-bold bg-accent-500 text-black hover:bg-accent-400 disabled:opacity-50 transition-all">
              {verifying ? t('auth.register.verifying') : t('auth.register.verify')}
            </button>

            <div className="mt-4 text-sm text-surface-400">
              {t('auth.register.didntReceive')}
              <button onClick={handleResend} disabled={resending} className="text-accent-400 hover:text-accent-300 mr-1 disabled:opacity-50">
                {resending ? t('auth.register.resending') : t('auth.register.resend')}
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-700/30">
              <Link to="/login" className="text-sm text-surface-500 hover:text-surface-300 transition-colors flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> {t('auth.register.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <AnimatedWorkshopBackground />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-2xl shadow-accent-500/30 mb-5">
            <span className="text-3xl font-bold text-black">ص</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{t('auth.register.title')}</h1>
          <p className="text-surface-400 mt-2">{t('auth.register.subtitle')}</p>
        </div>
        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-700/50 rounded-3xl p-6 lg:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-surface-700/50">
            <div className="w-10 h-10 rounded-2xl bg-accent-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t('auth.register.formTitle')}</h2>
              <p className="text-xs text-surface-400">{t('auth.register.formSubtitle')}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="text" placeholder={t('auth.register.namePlaceholder')} value={form.name} onChange={(e) => update('name', e.target.value)} required className="w-full pr-10 pl-4 py-3 rounded-2xl bg-surface-800/80 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50" />
            </div>
            <div className="relative">
              <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="email" placeholder={t('auth.register.emailPlaceholder')} value={form.email} onChange={(e) => update('email', e.target.value)} required className="w-full pr-10 pl-4 py-3 rounded-2xl bg-surface-800/80 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50" dir="ltr" />
            </div>
            <div className="relative">
              <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="tel" placeholder={t('auth.register.phonePlaceholder')} value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full pr-10 pl-4 py-3 rounded-2xl bg-surface-800/80 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50" dir="ltr" />
            </div>
            <div className="relative">
              <MapPin size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="text" placeholder={t('auth.register.cityPlaceholder')} value={form.city} onChange={(e) => update('city', e.target.value)} required className="w-full pr-10 pl-4 py-3 rounded-2xl bg-surface-800/80 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50" />
            </div>
            <div className="relative">
              <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="password" placeholder={t('auth.register.passwordPlaceholder')} value={form.password} onChange={(e) => update('password', e.target.value)} required className="w-full pr-10 pl-4 py-3 rounded-2xl bg-surface-800/80 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-accent-500/50" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-l from-accent-500 to-accent-600 text-black hover:shadow-lg hover:shadow-accent-500/25 active:scale-[0.98] disabled:opacity-50 mt-2">
              {loading ? <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><UserPlus size={18} /> {t('auth.register.registerButton')}</>}
            </button>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-700/50"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-surface-900/60 px-3 text-surface-400">{t('auth.register.orDivider')}</span></div>
          </div>
          <OAuthButtons />
          <div className="mt-6 text-center">
            <p className="text-surface-400 text-sm">{t('auth.register.hasAccount')} <Link to="/login" className="text-accent-400 hover:text-accent-300 font-semibold">{t('auth.register.loginLink')}</Link></p>
          </div>
        </div>
        <p className="text-center text-surface-600 text-xs mt-8">{t('auth.register.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </div>
  );
}
