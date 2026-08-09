import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Camera, CheckCircle2, ChevronLeft, KeyRound, LogOut, Mail, MapPin, Moon, Save, ShieldCheck, Sun, UserRound, X, MessageCircle, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRooms } from '../api/chat.api';

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customer, updateCustomer, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [form, setForm] = useState({ name: customer?.name || '', email: customer?.email || '', phone: customer?.phone || '', city: customer?.city || '' });
  const [avatar, setAvatar] = useState(() => customer?.avatar || '');
  const [saving, setSaving] = useState(false);
  const [panel, setPanel] = useState<'email' | 'password' | null>(null);
  const [newEmail, setNewEmail] = useState(customer?.email || '');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [passwordResetCode, setPasswordResetCode] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';
  const { data: chatRooms = [] } = useQuery({ queryKey: ['chat-rooms'], queryFn: getRooms, refetchInterval: 15_000 });
  const unreadMessages = chatRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  useEffect(() => {
    localStorage.removeItem('tasaheel-biometric-enabled');
  }, []);

  const handleAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('اختر صورة فقط');
    if (file.size > 4 * 1024 * 1024) return toast.error('حجم الصورة يجب ألا يتجاوز 4 ميغابايت');
    try {
      const url = await authApi.uploadAvatar(file);
      const response: any = await authApi.updateProfile({ avatar: url });
      const savedCustomer = response.data || response;
      updateCustomer(savedCustomer);
      setAvatar(savedCustomer.avatar || url);
      toast.success('تم رفع الصورة الشخصية وحفظها');
    } catch (error: any) {
      toast.error(error.friendlyMessage || 'تعذر رفع الصورة الشخصية');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try { const response: any = await authApi.updateProfile({ name: form.name, phone: form.phone, city: form.city }); updateCustomer(response.data || response); toast.success('تم حفظ المعلومات الشخصية'); }
    catch (error: any) { toast.error(error.response?.data?.message || 'تعذر حفظ المعلومات'); }
    finally { setSaving(false); }
  };

  const requestEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) return toast.error('أدخل بريدًا إلكترونيًا صحيحًا');
    try { await authApi.resendVerification(newEmail); toast.success('أرسلنا رمز تحقق إلى البريد الجديد'); setPanel(null); }
    catch { toast.error('تعذر إرسال رمز التحقق حاليًا'); }
  };

  const requestPasswordChange = async () => {
    setPasswordLoading(true);
    try {
      const response = await authApi.forgotPassword(customer?.email || '');
      if (!response.ok) throw new Error();
      toast.success('أرسلنا رمز تغيير كلمة المرور إلى بريدك');
      setPasswordResetSent(true);
    } catch { toast.error('تعذر إرسال رمز تغيير كلمة المرور حاليًا'); }
    finally { setPasswordLoading(false); }
  };

  const confirmPasswordChange = async () => {
    if (!/^\d{6}$/.test(passwordResetCode)) return toast.error('أدخل رمز التحقق المكوّن من 6 أرقام');
    if (passwordNew.length < 8) return toast.error('كلمة المرور يجب ألا تقل عن 8 أحرف');
    setPasswordLoading(true);
    try {
      const response = await authApi.resetPassword(passwordResetCode, passwordNew);
      if (!response.ok) throw new Error();
      toast.success('تم تغيير كلمة المرور بنجاح');
      setPanel(null);
      setPasswordResetSent(false);
      setPasswordResetCode('');
      setPasswordNew('');
    } catch { toast.error('الرمز غير صحيح أو منتهي الصلاحية'); }
    finally { setPasswordLoading(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-5 pb-24" dir="rtl">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-surface-950 to-surface-800 p-6 text-white shadow-xl">
      <div className="absolute -left-10 -top-12 h-40 w-40 rounded-full bg-accent-500/20 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <button onClick={() => fileInput.current?.click()} className="group relative shrink-0"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 bg-white/10 text-2xl font-black">{avatar ? <img src={avatar} className="h-full w-full object-cover" alt="الصورة الشخصية" /> : customer?.name?.charAt(0) || 'ع'}</div><span className="absolute -bottom-1 -left-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg"><Camera size={15}/></span></button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => handleAvatar(event.target.files?.[0])}/>
        <div className="min-w-0"><p className="text-xs text-white/60">حساب العميل</p><h1 className="truncate text-xl font-black">{customer?.name || 'عميل تساهيل'}</h1><p className="mt-1 truncate text-sm text-white/70">{customer?.email || 'أضف بريدك الإلكتروني'}</p></div>
      </div>
    </section>

    <section className="overflow-hidden rounded-3xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900">
      <button onClick={() => navigate('/support')} className="flex w-full items-center gap-3 border-b border-surface-100 p-4 text-right transition hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10"><Headphones size={20}/></span><span className="flex-1"><span className="block font-black text-surface-900 dark:text-white">الدعم والمساعدة</span><span className="block text-xs text-surface-500">تواصل مع خدمة عملاء تساهيل</span></span><ChevronLeft className="text-surface-400" size={19}/></button>
      <button onClick={() => navigate('/chats')} className="flex w-full items-center gap-3 border-b border-surface-100 p-4 text-right transition hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"><span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 dark:bg-accent-500/10"><MessageCircle size={20}/>{unreadMessages > 0 && <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-black text-white">{Math.min(unreadMessages, 99)}</span>}</span><span className="flex-1"><span className="block font-black text-surface-900 dark:text-white">محادثاتي</span><span className="block text-xs text-surface-500">{unreadMessages > 0 ? `${unreadMessages} رسائل غير مقروءة` : 'محادثاتك مع الورش'}</span></span><ChevronLeft className="text-surface-400" size={19}/></button>
      <button onClick={() => setPanel('email')} className="flex w-full items-center gap-3 border-b border-surface-100 p-4 text-right transition hover:bg-surface-50 dark:border-surface-800 dark:hover:bg-surface-800"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><Mail size={20}/></span><span className="min-w-0 flex-1"><span className="block font-black text-surface-900 dark:text-white">البريد الإلكتروني</span><span className="block truncate text-xs text-surface-500">{customer?.email || 'غير مضاف'}</span></span><ChevronLeft className="text-surface-400" size={19}/></button>
      <button onClick={() => setPanel('password')} className="flex w-full items-center gap-3 p-4 text-right transition hover:bg-surface-50 dark:hover:bg-surface-800"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><KeyRound size={20}/></span><span className="flex-1"><span className="block font-black text-surface-900 dark:text-white">كلمة المرور</span><span className="block text-xs text-surface-500">تغيير آمن عبر رمز التحقق</span></span><ChevronLeft className="text-surface-400" size={19}/></button>
    </section>

    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-900">
      <div className="flex items-center gap-2"><UserRound size={19} className="text-accent-500"/><h2 className="font-black text-surface-900 dark:text-white">المعلومات الشخصية</h2></div>
      <label className="block text-sm font-bold text-surface-600 dark:text-surface-300">الاسم<input value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} className="input-field mt-2"/></label>
      <label className="block text-sm font-bold text-surface-600 dark:text-surface-300">الجوال<input value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} className="input-field mt-2" dir="ltr"/></label>
      <label className="block text-sm font-bold text-surface-600 dark:text-surface-300">المدينة<div className="relative mt-2"><MapPin size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"/><input value={form.city} onChange={(e) => setForm({...form, city:e.target.value})} className="input-field pr-9"/></div></label>
      <button disabled={saving} className="btn-primary flex h-12 w-full items-center justify-center gap-2">{saving ? 'جارٍ الحفظ…' : <><Save size={18}/>حفظ التعديلات</>}</button>
    </form>

    <section className="rounded-3xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"><button onClick={toggleTheme} className="flex w-full items-center justify-between"><span className="flex items-center gap-3 font-black text-surface-900 dark:text-white">{isDark ? <Moon className="text-accent-500"/> : <Sun className="text-amber-500"/>}الوضع الليلي</span><span className={`relative h-7 w-12 rounded-full ${isDark ? 'bg-accent-500' : 'bg-surface-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${isDark ? 'right-1' : 'right-6'}`}/></span></button></section>
    <section className="rounded-3xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-emerald-500" size={20}/><div><h2 className="font-black text-surface-900 dark:text-white">خصوصيتك مهمة</h2><p className="mt-1 text-xs leading-5 text-surface-500">لا تتم مشاركة موقعك إلا أثناء الطلب النشط، وتُستخدم بياناتك لتقديم الخدمة فقط.</p></div></div></section>
    <button onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 font-black text-red-600 transition hover:bg-red-100 dark:bg-red-500/10"><LogOut size={18}/>تسجيل الخروج</button>

    {panel && <div className="fixed inset-0 z-[70] flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-4" onClick={() => setPanel(null)}><motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-t-[30px] bg-white p-6 shadow-2xl dark:bg-surface-900 sm:rounded-[30px]">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-black text-surface-900 dark:text-white">{panel === 'email' ? 'تغيير البريد الإلكتروني' : 'تغيير كلمة المرور'}</h2><button onClick={() => setPanel(null)} className="rounded-xl p-2 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={19}/></button></div>
      {panel === 'email' ? <><p className="mb-4 text-sm leading-6 text-surface-500">سنرسل رمز تحقق إلى بريدك الجديد قبل اعتماده.</p><input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className="input-field" placeholder="name@example.com" dir="ltr"/><button onClick={requestEmailChange} className="btn-primary mt-4 h-12 w-full">إرسال رمز التحقق</button></> : !passwordResetSent ? <><p className="mb-4 text-sm leading-6 text-surface-500">لأمان حسابك سنرسل رمزًا مؤقتًا لتغيير كلمة المرور إلى بريدك الإلكتروني.</p><div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"><CheckCircle2 size={16} className="shrink-0"/>الرمز صالح لمدة 10 دقائق ويستخدم مرة واحدة.</div><button onClick={requestPasswordChange} disabled={passwordLoading} className="btn-primary mt-4 h-12 w-full">{passwordLoading ? 'جاري الإرسال…' : 'إرسال رمز تغيير كلمة المرور'}</button></> : <><p className="mb-4 text-sm leading-6 text-surface-500">أدخل الرمز المرسل وكلمة المرور الجديدة.</p><div className="space-y-3"><input inputMode="numeric" maxLength={6} value={passwordResetCode} onChange={event=>setPasswordResetCode(event.target.value.replace(/\D/g,''))} className="input-field text-center tracking-[0.4em]" placeholder="000000" dir="ltr"/><input type="password" value={passwordNew} onChange={event=>setPasswordNew(event.target.value)} className="input-field" placeholder="كلمة المرور الجديدة" autoComplete="new-password"/></div><button onClick={confirmPasswordChange} disabled={passwordLoading} className="btn-primary mt-4 h-12 w-full">{passwordLoading ? 'جاري الحفظ…' : 'حفظ كلمة المرور'}</button><button onClick={requestPasswordChange} disabled={passwordLoading} className="mt-3 w-full text-sm font-bold text-accent-600">إعادة إرسال الرمز</button></>}
    </motion.div></div>}
  </div>;
}
