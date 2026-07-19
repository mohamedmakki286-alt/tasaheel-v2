import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, User, Phone, Mail, Lock, MapPin, Building2, Upload, FileText, Check, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Clock, Truck, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { register } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { SERVICE_TYPES, WORKSHOP_TYPES, CITIES } from '../utils/constants';
import StepIndicator from '../components/StepIndicator';



export default function RegisterPage() {
  const { t } = useTranslation();
  const STEPS = [
    { label: t('pages.register.steps.basicInfo'), description: t('pages.register.steps.basicInfoDesc') },
    { label: t('pages.register.steps.workshopType'), description: t('pages.register.steps.workshopTypeDesc') },
    { label: t('pages.register.steps.location'), description: t('pages.register.steps.locationDesc') },
    { label: t('pages.register.steps.services'), description: t('pages.register.steps.servicesDesc') },
  ];
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workshopType, setWorkshopType] = useState<string>('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [commercialReg, setCommercialReg] = useState<File | null>(null);
  const [commercialRegPreview, setCommercialRegPreview] = useState<string>('');
  const [municipalityLicense, setMunicipalityLicense] = useState<File | null>(null);
  const [municipalityPreview, setMunicipalityPreview] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const toggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.includes(serviceId) ? prev.filter((s) => s !== serviceId) : [...prev, serviceId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File) => void, setPreview: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: () =>
      register({ name, ownerName, phone, email, password, address, city, workshopType: workshopType as any, services, commercialRegistration: commercialReg || undefined, municipalityLicense: municipalityLicense || undefined }),
    onSuccess: (data) => {
      setAuth({ token: data.token, refreshToken: data.refreshToken, role: 'workshop', workshop: data.workshop });
      setSuccess(true);
      toast.success(t('toast.success.registerSuccess'));
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('toast.error.registrationFailed'));
    },
  });

  const canGoNext = () => {
    if (step === 0) return name && ownerName && email && phone && password && password === confirmPassword;
    if (step === 1) return workshopType;
    if (step === 2) return address && city;
    if (step === 3) return services.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      if (password !== confirmPassword) { toast.error(t('toast.error.passwordMismatch')); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error(t('toast.error.invalidEmail')); return; }
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleSubmit = () => {
    if (services.length === 0) { toast.error(t('toast.error.chooseService')); return; }
    mutation.mutate();
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in max-w-md">
          <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Clock size={60} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">{t('pages.register.successTitle')}</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-white/10">
            <p className="text-white/80 text-lg font-medium mb-2">{t('pages.register.pendingReview')}</p>
            <p className="text-white/50 text-sm">
              {t('pages.register.pendingReviewDesc')}
            </p>
          </div>
          <p className="text-white/40 text-sm">{t('pages.register.redirecting')}</p>
          <div className="flex justify-center gap-1 mt-6">
            {[1, 2, 3].map((i) => (
              <Sparkles key={i} size={24} className="text-accent-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 flex items-start justify-center p-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 shadow-xl" style={{ background: 'linear-gradient(135deg, #D90408, #B10306)' }}>
            <Wrench size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">{t('pages.register.title')}</h1>
          <p className="text-surface-500 text-sm">{t('pages.register.subtitle')}</p>
        </div>

        <StepIndicator steps={STEPS} currentStep={step} />

        <div className="bg-white rounded-3xl shadow-xl border border-surface-200 overflow-hidden animate-slide-up">
          <div className="p-6 lg:p-8">
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-surface-900 mb-1">{t('pages.register.basicInfoTitle')}</h2>
                <p className="text-sm text-surface-400 mb-6">{t('pages.register.basicInfoDesc2')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">{t('pages.register.workshopName')}</label>
                    <div className="relative">
                      <Building2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.workshopNamePlaceholder')} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">{t('pages.register.ownerName')}</label>
                    <div className="relative">
                      <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.ownerNamePlaceholder')} required />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">{t('pages.register.phone')}</label>
                    <div className="relative">
                      <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.phonePlaceholder')} dir="ltr" required />
                    </div>
                  </div>
                  <div>
                    <label className="label">{t('pages.register.email')} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.emailPlaceholder')} dir="ltr" required />
                    </div>
                  </div>
                  <div>
                    <label className="label">{t('pages.register.commercialReg')}</label>
                    <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-surface-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
                      <FileText size={20} className="text-surface-400" />
                      <span className="text-sm text-surface-500">{commercialReg ? commercialReg.name : t('pages.register.chooseFile')}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setCommercialReg, setCommercialRegPreview)} className="hidden" />
                    </label>
                    {commercialRegPreview && (
                      <img src={commercialRegPreview} alt={t('pages.dashboard.commercialRecord')} className="w-full h-28 object-cover rounded-xl border-2 border-surface-200 mt-2" />
                    )}
                  </div>
                  <div>
                    <label className="label">{t('pages.register.municipalityLicense')}</label>
                    <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-surface-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
                      <FileText size={20} className="text-surface-400" />
                      <span className="text-sm text-surface-500">{municipalityLicense ? municipalityLicense.name : t('pages.register.chooseFile')}</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setMunicipalityLicense, setMunicipalityPreview)} className="hidden" />
                    </label>
                    {municipalityPreview && (
                      <img src={municipalityPreview} alt={t('pages.dashboard.municipalityLicense')} className="w-full h-28 object-cover rounded-xl border-2 border-surface-200 mt-2" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">{t('pages.register.password')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.passwordPlaceholder')} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">{t('pages.register.confirmPassword')}</label>
                    <div className="relative">
                      <Lock size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field pr-10" placeholder={t('pages.register.passwordPlaceholder')} required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-surface-900 mb-1">{t('pages.register.steps.workshopType')}</h2>
                <p className="text-sm text-surface-400 mb-6">{t('pages.register.selectWorkshopType')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {WORKSHOP_TYPES.map((wt) => {
                    const isSelected = workshopType === wt.value;
                    const IconComp = wt.icon === 'Building2' ? Building2 : wt.icon === 'Truck' ? Truck : Briefcase;
                    return (
                      <button
                        key={wt.value}
                        type="button"
                        onClick={() => setWorkshopType(wt.value)}
                        className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                            : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400'
                        }`}>
                          <IconComp size={28} />
                        </div>
                        <div>
                          <p className="text-base font-bold">{t('constants.workshopTypes.' + wt.value)}</p>
                          <p className="text-xs text-surface-400 mt-1">{t('constants.workshopTypes.' + wt.value + '_desc', wt.description)}</p>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-surface-900 mb-1">{t('pages.register.steps.location')}</h2>
                <p className="text-sm text-surface-400 mb-6">{t('pages.register.selectLocation')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">{t('pages.register.city')}</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none z-10" />
                      <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field pr-10 appearance-none" required>
                        <option value="">{t('pages.register.selectCity')}</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{t('constants.cityNames.' + c, c)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">{t('pages.register.address')}</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute right-3.5 top-3.5 text-surface-400 pointer-events-none" />
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field pr-10 min-h-[100px] resize-none" placeholder={t('pages.register.addressPlaceholder')} rows={3} required />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <h2 className="text-xl font-bold text-surface-900 mb-1">{t('pages.register.steps.services')}</h2>
                <p className="text-sm text-surface-400 mb-6">{t('pages.register.selectServices')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_TYPES.map((service) => {
                    const isSelected = services.includes(service.id);
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => toggleService(service.id)}
                        className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-right ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                            : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          isSelected ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-400'
                        }`}>
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Wrench size={14} />}
                        </div>
                        <span className="text-sm font-semibold">{t('constants.serviceTypes.' + service.id, service.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 lg:px-8 py-4 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
            <div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-secondary">
                  <ChevronRight size={18} />
                  {t('pages.register.previous')}
                </button>
              )}
            </div>
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext} disabled={!canGoNext()} className="btn-primary">
                {t('pages.register.next')}
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={mutation.isPending || !canGoNext()} className="btn-primary">
                {mutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('pages.register.registering')}
                  </>
                ) : (
                  t('pages.register.submit')
                )}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-surface-400 text-sm">
            {t('pages.register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold transition-colors">
              {t('pages.register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
