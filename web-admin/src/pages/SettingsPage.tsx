import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, User, Bell, Shield, Palette, ChevronDown, Eye, EyeOff, Sun, Moon, Percent, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { getPlatformSettings, updatePlatformSetting } from '../api/financial.api';
import { updateProfile, changePassword } from '../api/auth.api';
import Button from '../components/Button';
import NumberInput from '../components/NumberInput';
import Avatar from '../components/Avatar';
import clsx from 'clsx';

export default function SettingsPage() {
  const { t } = useTranslation();
  const TABS = [
    { key: 'profile', icon: User },
    { key: 'notifications', icon: Bell },
    { key: 'accounting', icon: Percent },
    { key: 'security', icon: Shield },
    { key: 'appearance', icon: Palette },
  ];
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useThemeStore();
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({
    name: user?.name || t('pages.settings.profile.defaultName'),
    email: user?.email || 'admin@salaba.com',
    phone: user?.phone || '0500000000',
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { data: platformSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettings,
    enabled: activeTab === 'accounting',
  });

  const defaultCommission = platformSettings?.find((s) => s.settingKey === 'default_commission_percentage');
  const [commissionValue, setCommissionValue] = useState('');

  React.useEffect(() => {
    if (defaultCommission) setCommissionValue(defaultCommission.settingValue);
  }, [defaultCommission]);

  const updateSettingMutation = useMutation({
    mutationFn: (payload: { key: string; value: string; description?: string }) => updatePlatformSetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success(t('toast.success.accountingSaved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.accountingSaveFailed')),
  });

  const profileMutation = useMutation({
    mutationFn: () => updateProfile(profile),
    onSuccess: (data) => {
      setUser(data);
      toast.success(t('toast.success.settingsSaved'));
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.settingsSaveFailed')),
  });

  const passwordMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: password.current, newPassword: password.new }),
    onSuccess: () => {
      toast.success(t('toast.success.passwordChanged'));
      setPassword({ current: '', new: '', confirm: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('toast.error.passwordChangeFailed')),
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.new !== password.confirm) {
      toast.error(t('toast.error.passwordMismatch'));
      return;
    }
    passwordMutation.mutate();
  };

  const handleSaveAccounting = () => {
    updateSettingMutation.mutate({
      key: 'default_commission_percentage',
      value: commissionValue,
      description: t('pages.settings.accounting.commissionDesc'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">{t('pages.settings.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">{t('pages.settings.subtitle')}</p>
      </div>

      <div className="card p-0 overflow-hidden dark:bg-surface-900 dark:border-surface-800">
        <div className="border-b border-gray-100 dark:border-surface-800">
          <div className="flex overflow-x-auto p-1 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-200 hover:bg-gray-50 dark:hover:bg-surface-800'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{t(`pages.settings.tabs.${tab.key}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-surface-800">
                <Avatar name={profile.name} size="xl" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-surface-100 text-lg">{profile.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-surface-400">{t('pages.settings.profile.role')}</p>
                </div>
                <Button variant="outline" size="sm" className="mr-auto">
                  {t('pages.settings.profile.changePhoto')}
                </Button>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.profile.name')}</label>
                    <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.profile.email')}</label>
                    <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.profile.phone')}</label>
                    <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100" dir="ltr" />
                  </div>
                </div>
                <Button type="submit" isLoading={profileMutation.isPending} icon={<Save className="w-4 h-4" />}>{t('pages.settings.profile.save')}</Button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-lg space-y-1">
              {[
                { label: t('pages.settings.notifications.newOrders'), desc: t('pages.settings.notifications.newOrdersDesc') },
                { label: t('pages.settings.notifications.payments'), desc: t('pages.settings.notifications.paymentsDesc') },
                { label: t('pages.settings.notifications.workshopRegistration'), desc: t('pages.settings.notifications.workshopRegistrationDesc') },
                { label: t('pages.settings.notifications.reports'), desc: t('pages.settings.notifications.reportsDesc') },
              ].map((item, idx) => (
                <div key={item.label} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-surface-100 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-surface-400 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={idx < 2} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:rtl:-translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'accounting' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-surface-100 text-lg mb-1">{t('pages.settings.accounting.title')}</h3>
                <p className="text-sm text-gray-500 dark:text-surface-400">{t('pages.settings.accounting.subtitle')}</p>
              </div>

              <div className="card bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-surface-100">{t('pages.settings.accounting.defaultCommission')}</h4>
                    <p className="text-xs text-gray-500 dark:text-surface-400">
                      {t('pages.settings.accounting.commissionDescription')}
                    </p>
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.accounting.commissionPercent')}</label>
                    <NumberInput
                      value={commissionValue}
                      onValueChange={(v) => setCommissionValue(v)}
                      mode="decimal"
                      decimalScale={1}
                      min={0}
                      max={100}
                      placeholder="10"
                      suffix="%"
                    />
                  </div>
                  <Button
                    onClick={handleSaveAccounting}
                    isLoading={updateSettingMutation.isPending}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t('pages.settings.accounting.save')}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl">
                <h4 className="font-semibold text-gray-900 dark:text-surface-100 text-sm mb-2">{t('pages.settings.accounting.howItWorks')}</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-surface-400">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{t('pages.settings.accounting.howItWorks1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{t('pages.settings.accounting.howItWorks2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{t('pages.settings.accounting.howItWorks3')}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-lg">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.security.currentPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={password.current}
                      onChange={(e) => setPassword({ ...password, current: e.target.value })}
                      className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100"
                      required
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300">
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.security.newPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={password.new}
                      onChange={(e) => setPassword({ ...password, new: e.target.value })}
                      className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100"
                      required
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300">
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-1.5">{t('pages.settings.security.confirmPassword')}</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={password.confirm}
                      onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                      className="input-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100"
                      required
                    />
                    <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-surface-500 hover:text-gray-600 dark:hover:text-surface-300">
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" isLoading={passwordMutation.isPending} icon={<Save className="w-4 h-4" />}>{t('pages.settings.security.changePassword')}</Button>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-lg space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-2">{t('pages.settings.appearance.language')}</label>
                <select className="select-field dark:bg-surface-800 dark:border-surface-700 dark:text-surface-100">
                  <option value="ar">{t('pages.settings.appearance.arabic')}</option>
                  <option value="en">{t('pages.settings.appearance.english')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-surface-300 mb-3">{t('pages.settings.appearance.theme')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                      <Sun className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-medium ${theme === 'light' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-surface-400'}`}>{t('pages.settings.appearance.light')}</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                        : 'border-gray-200 dark:border-surface-700 hover:border-gray-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`font-medium ${theme === 'dark' ? 'text-amber-700 dark:text-amber-400' : 'text-gray-600 dark:text-surface-400'}`}>{t('pages.settings.appearance.dark')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
