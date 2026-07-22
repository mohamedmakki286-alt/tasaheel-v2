import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, User, Phone, Mail, Lock, Wrench, Building2, Shield,
  CheckCircle2, Eye, EyeOff, X, LogOut, Calendar, Bell, Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { RINGTONE_OPTIONS, previewRingtone } from '../services/notificationSound';
import apiClient from '../api/client';

const SPECIALTY_MAP: Record<string, string> = {
  PAINTER: 'فني سمكرة ودهان',
  MECHANIC: 'فني ميكانيكا',
  ELECTRICIAN: 'فني كهرباء',
  AC_TECHNICIAN: 'فني تكييف',
  TRANSMISSION_TECHNICIAN: 'فني قير',
  GENERAL_TECHNICIAN: 'فني شامل',
  BODYWORK: 'فني سمكرة',
  PAINTING: 'فني دهان',
  BRAKES: 'فني فرامل',
  ENGINE: 'فني محرك',
  SUSPENSION: 'فني تعليق',
  EXHAUST: 'فني عادم',
  BATTERY: 'فني بطارية',
  DIAGNOSTICS: 'فني فحص كمبيوتر',
};

function translateSpecialty(raw?: string): string {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if (SPECIALTY_MAP[upper]) return SPECIALTY_MAP[upper];
  const found = Object.entries(SPECIALTY_MAP).find(([k]) =>
    upper.includes(k) || k.includes(upper)
  );
  return found ? found[1] : raw;
}

// ===== Change Email Modal =====
function ChangeEmailModal({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/technician/me/email', {
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword: password,
      });
    },
    onSuccess: () => {
      toast.success('تم تغيير البريد الإلكتروني بنجاح');
      logout();
      navigate('/login', { replace: true });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'فشل تغيير البريد الإلكتروني';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (!password.trim()) {
      toast.error('يرجى إدخال كلمة المرور الحالية');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#111827]">تعديل البريد الإلكتروني</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">البريد الحالي</label>
            <div className="px-4 py-3 rounded-xl bg-gray-50 text-sm text-gray-600">{currentEmail}</div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">البريد الإلكتروني الجديد</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="example@email.com"
              dir="ltr"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 focus:border-[#E31B23] transition-all text-left"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 focus:border-[#E31B23] transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || !newEmail.trim() || !password.trim()}
          className="w-full py-3 rounded-xl bg-[#E31B23] text-white text-sm font-bold hover:bg-[#c9161e] transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'جاري الحفظ...' : 'حفظ البريد الجديد'}
        </button>
      </div>
    </div>
  );
}

// ===== Change Password Modal =====
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/technician/me/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
    },
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح');
      logout();
      navigate('/login', { replace: true });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'فشل تغيير كلمة المرور';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!currentPassword.trim()) { toast.error('يرجى إدخال كلمة المرور الحالية'); return; }
    if (!newPassword.trim()) { toast.error('يرجى إدخال كلمة المرور الجديدة'); return; }
    if (newPassword.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPassword !== confirmPassword) { toast.error('كلمتا المرور غير متطابقتين'); return; }
    if (newPassword === currentPassword) { toast.error('كلمة المرور الجديدة يجب أن تختلف عن الحالية'); return; }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#111827]">تغيير كلمة المرور</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">كلمة المرور الحالية</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="أدخل كلمة المرور الحالية" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 focus:border-[#E31B23] transition-all" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">كلمة المرور الجديدة</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="أدخل كلمة المرور الجديدة" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 focus:border-[#E31B23] transition-all" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">6 أحرف على الأقل</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">تأكيد كلمة المرور</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="أعد إدخال كلمة المرور الجديدة" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 focus:border-[#E31B23] transition-all" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
          className="w-full py-3 rounded-xl bg-[#E31B23] text-white text-sm font-bold hover:bg-[#c9161e] transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
        </button>
      </div>
    </div>
  );
}

// ===== Main Account Page =====
function AccountContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const technician = useAuthStore((s) => s.technician);
  const updateTechnician = useAuthStore((s) => s.updateTechnician);
  const logout = useAuthStore((s) => s.logout);
  const { soundEnabled, vibrationEnabled, ringtoneId, toggleSound, toggleVibration, setRingtone } = useSettingsStore();

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['technician-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/technician/profile');
      return response.data;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const response = await apiClient.put('/technician/profile', body);
      return response.data;
    },
    onSuccess: (data) => {
      if (data) {
        updateTechnician({ name: data.name, phone: data.phone });
      }
      toast.success('تم تحديث البيانات بنجاح');
      setEditingName(false);
      setEditingPhone(false);
      queryClient.invalidateQueries({ queryKey: ['technician-profile'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'فشل تحديث البيانات');
    },
  });

  const displayName = profile?.name || technician?.name || '';
  const displaySpecialty = translateSpecialty(profile?.specialty || technician?.specialty);
  const displayWorkshop = profile?.workshopName || technician?.workshopName || '';
  const displayEmail = profile?.email || technician?.email || '';
  const displayPhone = profile?.phone || technician?.phone || '';
  const displayCreated = profile?.createdAt;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate('/technician')} className="p-2 rounded-xl hover:bg-gray-100">
              <ArrowRight size={20} className="text-gray-500" />
            </button>
            <h1 className="font-bold text-[#111827]">حسابي</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-8">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/technician')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowRight size={20} className="text-gray-500" />
          </button>
          <h1 className="font-bold text-[#111827]">حسابي</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Avatar & Name */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 text-center">
          <div className="w-20 h-20 rounded-full bg-[#E31B23]/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-[#E31B23] font-bold text-2xl">
              {displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
            </span>
          </div>
          <h2 className="font-bold text-[#111827] text-lg">{displayName}</h2>
          <p className="text-sm text-gray-500">{displaySpecialty}</p>
          {displayWorkshop && (
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Building2 size={12} /> {displayWorkshop}
            </p>
          )}
          {displayCreated && (
            <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
              <Calendar size={12} /> عضو منذ {new Date(displayCreated).toLocaleDateString('ar-SA')}
            </p>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-[#111827]">البيانات الشخصية</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Name */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <User size={18} className="text-gray-400 shrink-0" />
                {editingName ? (
                  <input
                    type="text"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm text-[#111827] truncate">{displayName}</span>
                )}
              </div>
              {editingName ? (
                <div className="flex gap-2 mr-3 shrink-0">
                  <button onClick={() => setEditingName(false)} className="text-xs text-gray-500">إلغاء</button>
                  <button
                    onClick={() => {
                      if (nameValue.trim()) updateProfileMutation.mutate({ name: nameValue.trim() });
                    }}
                    disabled={updateProfileMutation.isPending || !nameValue.trim()}
                    className="text-xs text-[#E31B23] font-medium disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? '...' : 'حفظ'}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setNameValue(displayName); setEditingName(true); }} className="text-xs text-[#E31B23] font-medium shrink-0 mr-3">تعديل</button>
              )}
            </div>

            {/* Phone */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Phone size={18} className="text-gray-400 shrink-0" />
                {editingPhone ? (
                  <input
                    type="tel"
                    value={phoneValue}
                    onChange={e => setPhoneValue(e.target.value)}
                    dir="ltr"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#E31B23]/30 text-left"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm text-[#111827] truncate" dir="ltr">{displayPhone}</span>
                )}
              </div>
              {editingPhone ? (
                <div className="flex gap-2 mr-3 shrink-0">
                  <button onClick={() => setEditingPhone(false)} className="text-xs text-gray-500">إلغاء</button>
                  <button
                    onClick={() => {
                      if (phoneValue.trim()) updateProfileMutation.mutate({ phone: phoneValue.trim() });
                    }}
                    disabled={updateProfileMutation.isPending || !phoneValue.trim()}
                    className="text-xs text-[#E31B23] font-medium disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? '...' : 'حفظ'}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setPhoneValue(displayPhone); setEditingPhone(true); }} className="text-xs text-[#E31B23] font-medium shrink-0 mr-3">تعديل</button>
              )}
            </div>

            {/* Specialty (read-only) */}
            <div className="px-4 py-3 flex items-center gap-3">
              <Wrench size={18} className="text-gray-400 shrink-0" />
              <span className="text-sm text-[#111827] truncate">{displaySpecialty}</span>
              <span className="text-[10px] text-gray-400 mr-auto shrink-0">غير قابل للتعديل</span>
            </div>

            {/* Workshop (read-only) */}
            <div className="px-4 py-3 flex items-center gap-3">
              <Building2 size={18} className="text-gray-400 shrink-0" />
              <span className="text-sm text-[#111827] truncate">{displayWorkshop || 'غير محدد'}</span>
              <span className="text-[10px] text-gray-400 mr-auto shrink-0">غير قابل للتعديل</span>
            </div>
          </div>
        </div>

        {/* Login Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-[#111827]">بيانات تسجيل الدخول</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Mail size={18} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">البريد الإلكتروني</p>
                  <p className="text-sm text-[#111827] truncate" dir="ltr">{displayEmail}</p>
                </div>
              </div>
              <button onClick={() => setShowEmailModal(true)} className="text-xs text-[#E31B23] font-medium shrink-0 mr-3">تعديل</button>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Lock size={18} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400">كلمة المرور</p>
                  <p className="text-sm text-[#111827]">••••••••</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="text-xs text-[#E31B23] font-medium shrink-0 mr-3">تغيير</button>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-[#111827]">معلومات الحساب</h3>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-gray-400" />
                <span className="text-sm text-[#111827]">نوع الحساب</span>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">فني</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-gray-400" />
                <span className="text-sm text-[#111827]">حالة الحساب</span>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-md">نشط</span>
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-[#111827] flex items-center gap-2">
              <Bell size={16} className="text-[#E31B23]" />
              إعدادات الإشعارات
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Sound Toggle */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 size={18} className="text-gray-400" />
                <span className="text-sm text-[#111827]">الصوت</span>
              </div>
              <button
                onClick={toggleSound}
                className="relative w-12 h-7 rounded-full transition-colors shrink-0"
                style={{ backgroundColor: soundEnabled ? '#22C55E' : '#D1D5DB' }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all"
                  style={{ right: soundEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>

            {/* Vibration Toggle */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-lg">📳</span>
                <span className="text-sm text-[#111827]">الاهتزاز</span>
              </div>
              <button
                onClick={toggleVibration}
                className="relative w-12 h-7 rounded-full transition-colors shrink-0"
                style={{ backgroundColor: vibrationEnabled ? '#22C55E' : '#D1D5DB' }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all"
                  style={{ right: vibrationEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>

            {/* Ringtone Picker */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-gray-400 text-lg">🔔</span>
                <span className="text-sm text-[#111827] font-medium">نغمة الإشعار</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RINGTONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setRingtone(opt.id);
                      previewRingtone(opt.id);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-right ${
                      ringtoneId === opt.id
                        ? 'bg-[#E31B23] text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 flex items-center justify-center gap-2 text-red-500 font-medium text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>

      {/* Modals */}
      {showEmailModal && <ChangeEmailModal currentEmail={displayEmail} onClose={() => setShowEmailModal(false)} />}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}

export default function TechnicianAccountPage() {
  const role = useAuthStore((s) => s.role);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated || role !== 'technician') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-[#E31B23]" />
          </div>
          <p className="text-gray-500 mb-4">يجب تسجيل الدخول كفني</p>
          <a href="/login" className="px-6 py-2.5 rounded-xl bg-[#E31B23] text-white text-sm font-medium inline-block">تسجيل الدخول</a>
        </div>
      </div>
    );
  }

  return <AccountContent />;
}
