import { useNavigate } from 'react-router-dom';
import { Wrench, Shield, ClipboardCheck, Truck, Star, Menu, X, ChevronDown, ArrowLeft, Settings, Gauge, Cog, Fuel, Wind, Droplets, Zap, Hammer, User, Building2, MapPin, Phone, Mail, MapPinned, MessageCircle, Globe, Search, Clock, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { workshopsApi } from '../api/workshops.api';
import type { Workshop } from '../types';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';

function Counter({ value, suffix }: { value: string; suffix: string }) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const num = parseInt(value.replace(/[^0-9]/g, ''));
        if (isNaN(num)) { setDisplay(value); return; }
        let current = 0;
        const step = Math.max(1, Math.floor(num / 40));
        const timer = setInterval(() => {
          current += step;
          if (current >= num) { setDisplay(value); clearInterval(timer); }
          else setDisplay(String(current));
        }, 30);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

function FloatingIcon({ icon: Icon, className, delay }: { icon: any; className: string; delay: number }) {
  return (
    <div
      className={`absolute opacity-[0.04] pointer-events-none ${className}`}
      style={{ animation: `float ${12 + delay}s ease-in-out infinite`, animationDelay: `${delay}s` }}
    >
      <Icon size={48} strokeWidth={1} />
    </div>
  );
}

const serviceIcons = ['Wrench', 'Cog', 'Wind', 'Fuel'];
const phoneContents = [
  {
    name: 'workshopName',
    rating: 4.8,
    city: 'workshopCity',
    services: 'workshopServices',
  },
  {
    progress: 65,
    items: ['progressService', 'progressStatus', 'progressTime'],
    values: ['oilFilter', 'inProgress', 'timeLeft'],
  },
  {
    rating: 5,
  },
];

function PhoneAnimation({ t, i18n: i18nObj }: { t: (key: string) => string; i18n: any }) {
  const lang = i18nObj.language;
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => setStep((s) => (s + 1) % 4), 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered]);

  const serviceLabels = [
    t('landing.phoneAnimation.label0'),
    t('landing.phoneAnimation.label1'),
    t('landing.phoneAnimation.label2'),
    t('landing.phoneAnimation.label3'),
  ];

  const phoneLabel = (key: string): string => {
    const keyMap: Record<string, string> = {
      workshopName: 'landing.phoneAnimation.workshopName',
      workshopCity: 'landing.phoneAnimation.workshopCity',
      workshopServices: 'landing.phoneAnimation.workshopServices',
      oilFilter: 'landing.phoneAnimation.oilFilter',
      inProgress: 'landing.phoneAnimation.inProgress',
      timeLeft: 'landing.phoneAnimation.timeLeft',
      progressService: 'landing.phoneAnimation.progressService',
      progressStatus: 'landing.phoneAnimation.progressStatus',
      progressTime: 'landing.phoneAnimation.progressTime',
    };
    return t(keyMap[key] || key);
  };

  const renderScreen = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-2 gap-2 p-3">
            {serviceIcons.map((iconName, i) => {
              const iconMap: Record<string, any> = { Wrench, Cog, Wind, Fuel };
              const Icon = iconMap[iconName] || Wrench;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 bg-surface-800/60 rounded-xl p-2.5 border border-surface-700/30">
                  <div className="w-8 h-8 rounded-lg bg-accent-500/15 flex items-center justify-center">
                    <Icon size={15} className="text-accent-400" />
                  </div>
                  <span className="text-[10px] text-surface-300 text-center leading-tight">
                    {serviceLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
        );
      case 1:
        return (
          <div className="p-3">
            <div className="bg-surface-800/60 rounded-xl p-3 border border-surface-700/30">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-2">
                <Building2 size={18} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-white text-center mb-1.5">
                {phoneLabel('workshopName')}
              </p>
              <div className="flex items-center justify-center gap-0.5 mb-1.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={10} className={s <= 5 ? 'text-amber-400 fill-amber-400' : 'text-surface-600'} />
                ))}
                <span className="text-[10px] text-surface-400 mr-1">4.8</span>
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-surface-500 mb-2">
                <MapPin size={10} />
                <span>{phoneLabel('workshopCity')}</span>
              </div>
              <p className="text-[9px] text-surface-500 text-center mb-2">{phoneLabel('workshopServices')}</p>
              <button className="w-full text-[10px] bg-emerald-500 text-black font-bold py-1.5 rounded-lg hover:bg-emerald-400 transition-colors">
                {t('landing.phoneAnimation.selectWorkshop')}
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="p-3">
            <div className="bg-surface-800/60 rounded-xl p-3 border border-surface-700/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <ClipboardCheck size={15} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{t('landing.phoneAnimation.serviceRequest')}</p>
                  <p className="text-[9px] text-surface-400">#SAL-2024</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-2.5">
                {[0,1,2].map((i) => (
                  <div key={i} className="flex justify-between text-[10px] py-1 border-b border-surface-700/30 last:border-0">
                    <span className="text-surface-400">{phoneLabel('progressService')}</span>
                    <span className={`font-semibold ${i === 1 ? 'text-amber-400' : 'text-white'}`}>
                      {phoneLabel(['oilFilter', 'inProgress', 'timeLeft'][i])}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-surface-500 mb-1">
                  <span>{t('landing.phoneAnimation.progress')}</span>
                  <span>65%</span>
                </div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-l from-red-500 to-red-400 rounded-full transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="p-3 flex flex-col items-center justify-center h-full min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1">
              {t('landing.phoneAnimation.serviceComplete')}
            </p>
            <p className="text-[10px] text-surface-400 text-center mb-3">
              {t('landing.phoneAnimation.carReady')}
            </p>
            <div className="flex items-center gap-0.5 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={12} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-[9px] text-surface-500">
              {t('landing.phoneAnimation.rateService')}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className="relative w-full max-w-[280px] sm:max-w-[300px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-accent-500/20 via-accent-600/10 to-transparent rounded-[3rem] blur-2xl" />
      <div className="relative bg-surface-900 rounded-[2.5rem] p-3 border-2 border-surface-700 shadow-2xl shadow-accent-500/10">
        <div className="flex items-center justify-center mb-2">
          <div className="w-20 h-1.5 bg-surface-800 rounded-full" />
        </div>
        <div className="relative bg-surface-950 rounded-[1.5rem] overflow-hidden border border-surface-800">
          <div className="h-6 flex items-center justify-center gap-1 bg-surface-900">
            <div className="w-2 h-2 rounded-full bg-surface-700" />
            <div className="w-2 h-2 rounded-full bg-surface-700" />
            <div className="w-2 h-2 rounded-full bg-surface-700" />
          </div>
          <div className="min-h-[280px] transition-all duration-500 ease-in-out">
            {renderScreen()}
          </div>
          <div className="h-5 flex items-center justify-center gap-1.5 bg-surface-900">
            {[0,1,2,3].map((i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-4 bg-accent-400' : 'bg-surface-600 hover:bg-surface-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [topWorkshops, setTopWorkshops] = useState<Workshop[]>([]);

  const features = [
    { icon: Wrench, title: t('landing.features.chooseService'), desc: t('landing.features.chooseServiceDesc'), color: 'from-amber-500/20 to-amber-600/10' },
    { icon: Truck, title: t('landing.features.compareQuotes'), desc: t('landing.features.compareQuotesDesc'), color: 'from-blue-500/20 to-blue-600/10' },
    { icon: ClipboardCheck, title: t('landing.features.inspection'), desc: t('landing.features.inspectionDesc'), color: 'from-emerald-500/20 to-emerald-600/10' },
    { icon: Star, title: t('landing.features.track'), desc: t('landing.features.trackDesc'), color: 'from-purple-500/20 to-purple-600/10' },
  ];

  const serviceCategories = [
    { icon: Gauge, label: t('constants.serviceCategories.periodic'), desc: t('landing.serviceCategoryDescs.periodic') },
    { icon: Cog, label: t('constants.serviceCategories.mechanical'), desc: t('landing.serviceCategoryDescs.mechanical') },
    { icon: Settings, label: t('landing.serviceCategoryLabels.transmission'), desc: t('landing.serviceCategoryDescs.transmission') },
    { icon: Hammer, label: t('landing.serviceCategoryLabels.suspension'), desc: t('landing.serviceCategoryDescs.suspension') },
    { icon: Zap, label: t('constants.serviceCategories.electrical'), desc: t('landing.serviceCategoryDescs.electrical') },
    { icon: Wind, label: t('constants.serviceCategories.ac'), desc: t('landing.serviceCategoryDescs.ac') },
    { icon: Droplets, label: t('constants.serviceCategories.bodywork'), desc: t('landing.serviceCategoryDescs.bodywork') },
    { icon: Fuel, label: t('constants.serviceCategories.emergency'), desc: t('landing.serviceCategoryDescs.emergency') },
  ];

  const testimonials = [
    { name: t('landing.reviews.testimonial1Name'), role: t('layout.header.customer'), text: t('landing.reviews.testimonial1Text'), rating: 5, initial: t('landing.reviews.testimonial1Name')[0] },
    { name: t('landing.reviews.testimonial2Name'), role: t('layout.header.customer'), text: t('landing.reviews.testimonial2Text'), rating: 5, initial: t('landing.reviews.testimonial2Name')[0] },
    { name: t('landing.reviews.testimonial3Name'), role: t('layout.header.customer'), text: t('landing.reviews.testimonial3Text'), rating: 5, initial: t('landing.reviews.testimonial3Name')[0] },
  ];

  const stats = [
    { value: '66+', label: t('landing.stats.services'), suffix: '' },
    { value: '5+', label: t('landing.stats.workshops'), suffix: '' },
    { value: '1+', label: t('landing.stats.cities'), suffix: '' },
    { value: '100%', label: t('landing.stats.satisfaction'), suffix: '' },
  ];

  useEffect(() => {
    if (isAuthenticated) navigate('/app', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    workshopsApi.getAll().then((list) => {
      setTopWorkshops((list || []).slice(0, 3));
    }).catch(() => {});
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-950 text-white font-cairo overflow-x-hidden" dir="rtl">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(3deg); }
          66% { transform: translateY(10px) rotate(-2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.1); }
          50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.3); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-slide-right { animation: slide-right 0.6s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.5s ease-out forwards; }
        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.2s; opacity: 0; }
        .stagger-3 { animation-delay: 0.3s; opacity: 0; }
        .stagger-4 { animation-delay: 0.4s; opacity: 0; }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .text-gradient {
          background: linear-gradient(135deg, #D90408, #B50307, #8B0205);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .btn-shine {
          position: relative;
          overflow: hidden;
        }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
          background-size: 200% auto;
        }
        .hero-gradient {
          background:
            radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.05) 0%, transparent 50%);
        }
      `}</style>

      <FloatingIcon icon={Settings} className="top-20 left-[10%]" delay={0} />
      <FloatingIcon icon={Cog} className="top-40 right-[15%]" delay={2} />
      <FloatingIcon icon={Gauge} className="bottom-40 left-[20%]" delay={4} />
      <FloatingIcon icon={Zap} className="top-60 left-[30%]" delay={1} />
      <FloatingIcon icon={Wind} className="bottom-60 right-[25%]" delay={3} />

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-surface-950/95 backdrop-blur-xl shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <img src="/tasaheel-logo.png" alt={t('common.appName')} className="h-14 lg:h-16 w-auto object-contain" />

          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'features', label: t('landing.nav.features') },
              { id: 'services', label: t('landing.nav.services') },
              { id: 'workshops-preview', label: t('landing.nav.workshops') },
              { id: 'how', label: t('landing.nav.howItWorks') },
              { id: 'reviews', label: t('landing.nav.reviews') },
              { id: 'contact', label: t('landing.nav.contact') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="px-4 py-2 text-surface-300 hover:text-white rounded-xl hover:bg-surface-800/50 transition-all duration-300 text-sm font-medium"
              >
                {item.label}
              </button>
            ))}
            <div className="mr-4 pr-4 border-r border-surface-700 flex items-center gap-3">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/50 transition-all text-sm"
              >
                <Globe size={15} />
                <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>
              <button onClick={() => navigate('/login')} className="px-5 py-2 text-surface-300 hover:text-white transition-colors text-sm font-medium">
                {t('landing.nav.login')}
              </button>
              <button onClick={() => navigate('/register')} className="bg-accent-500 hover:bg-accent-400 text-black font-bold px-5 py-2 rounded-xl transition-all duration-300 text-sm hover:shadow-lg hover:shadow-accent-500/25 btn-shine">
                {t('landing.nav.register')}
              </button>
            </div>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-surface-800 rounded-xl transition-colors">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div className={`md:hidden transition-all duration-400 overflow-hidden ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-surface-800 bg-surface-900/95 backdrop-blur-xl px-4 py-4 space-y-2">
            {[
              { id: 'features', label: t('landing.nav.features') },
              { id: 'services', label: t('landing.nav.services') },
              { id: 'how', label: t('landing.nav.howItWorks') },
              { id: 'reviews', label: t('landing.nav.reviews') },
            ].map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="block w-full text-right text-surface-300 hover:text-white py-3 px-3 rounded-xl hover:bg-surface-800 transition-all">
                {item.label}
              </button>
            ))}
            <div className="pt-3 space-y-2 border-t border-surface-700">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 w-full text-surface-400 hover:text-white py-3 px-3 rounded-xl hover:bg-surface-800 transition-all text-sm"
              >
                <Globe size={15} />
                <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>
              <button onClick={() => navigate('/login')} className="w-full btn-outline text-sm">{t('landing.nav.login')}</button>
              <button onClick={() => navigate('/register')} className="w-full btn-primary text-sm">{t('landing.nav.register')}</button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center hero-gradient pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-accent-500/10 text-accent-400 text-sm px-4 py-2 rounded-full mb-6 animate-scale-in backdrop-blur-sm border border-accent-500/20">
                <Shield size={16} />
                {t('landing.hero.badge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-6 animate-slide-up">
                <span className="text-gradient">{t('landing.hero.title1')}</span>
                <br />
                <span className="text-white">{t('landing.hero.title2')}</span>
              </h1>

              <p className="text-surface-400 text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-slide-up stagger-1">
                {t('landing.hero.description')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 animate-slide-up stagger-2">
                <button onClick={() => navigate('/register')} className="btn-primary text-base sm:text-lg px-8 py-4 w-full sm:w-auto btn-shine flex items-center justify-center gap-2" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
                  {t('landing.hero.cta')}
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => navigate('/login')} className="btn-outline text-base sm:text-lg px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2 border-2">
                  {t('landing.hero.login')}
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 mt-10 animate-slide-up stagger-3">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {['أ', 'م', 'ف', 'س'].map((letter, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br ${['from-red-500 to-red-600', 'from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600'][i]} flex items-center justify-center text-sm font-bold border-2 border-surface-950`}>
                      {letter}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-xs text-surface-400 border-2 border-surface-950">
                    +2k
                  </div>
                </div>
                <span className="text-surface-400 text-sm">{t('landing.hero.users')}</span>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <PhoneAnimation t={t} i18n={i18n} />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-surface-500" size={24} />
        </div>
      </section>

      <section className="py-16 lg:py-20 relative">
        <div className="absolute inset-0 bg-surface-900/30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className="text-center group">
                <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-400 mb-2 transition-all duration-500 group-hover:scale-110 animate-slide-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <Counter value={stat.value} suffix={stat.suffix} />
                  {stat.suffix}
                </div>
                <div className="text-surface-400 text-sm lg:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 lg:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
              {t('landing.features.title')}
            </h2>
            <p className="text-surface-400 text-base lg:text-lg max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group card-hover bg-surface-800/40 backdrop-blur-sm border border-surface-700/50 rounded-2xl sm:rounded-3xl p-6 lg:p-8 text-center relative overflow-hidden"
                style={{ animation: `slide-up 0.6s ease-out ${i * 0.15}s forwards`, opacity: 0 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 lg:mb-5 group-hover:scale-110 group-hover:bg-accent-500/20 transition-all duration-300">
                    <f.icon className="h-7 w-7 lg:h-8 lg:w-8 text-accent-400" />
                  </div>
                  <h3 className="font-bold text-base lg:text-lg mb-2 text-white group-hover:text-accent-400 transition-colors">{f.title}</h3>
                  <p className="text-surface-400 text-sm lg:text-base group-hover:text-surface-300 transition-colors">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-16 lg:py-24 px-4 bg-surface-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
              <span className="text-gradient">{t('landing.services.title')}</span>
            </h2>
            <p className="text-surface-400 text-base lg:text-lg">{t('landing.services.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {serviceCategories.map((cat, i) => (
              <div
                key={cat.label}
                className="group card-hover bg-surface-800/30 backdrop-blur-sm border border-surface-700/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center"
                style={{ animation: `slide-up 0.5s ease-out ${i * 0.08}s forwards`, opacity: 0 }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-3 lg:mb-4 group-hover:bg-accent-500/20 group-hover:scale-110 transition-all duration-300">
                  <cat.icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-accent-400" />
                </div>
                <h3 className="font-bold text-sm sm:text-base mb-1">{cat.label}</h3>
                <p className="text-xs sm:text-sm text-surface-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {topWorkshops.length > 0 && (
        <section id="workshops-preview" className="py-16 lg:py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-surface-900/20" />
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                <span className="text-gradient">{t('landing.workshops.title')}</span>
              </h2>
              <p className="text-surface-400 text-base lg:text-lg">{t('landing.workshops.subtitle')}</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              {topWorkshops.map((w, i) => (
                <div
                  key={w.id}
                  className="group card-hover bg-surface-800/40 backdrop-blur-sm border border-surface-700/50 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-center"
                  style={{ animation: `slide-up 0.5s ease-out ${i * 0.12}s forwards`, opacity: 0 }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Building2 size={32} className="text-accent-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white">{w.name}</h3>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= Math.round(w.rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-600'} />
                    ))}
                    <span className="text-sm text-surface-400 mr-1">{w.rating?.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-surface-500 mb-3">
                    <MapPin size={14} />
                    <span>{w.city}</span>
                  </div>
                  {w.services && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {w.services.split(',').slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-700/50 text-surface-400">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {topWorkshops.length > 0 && (
              <div className="text-center mt-8 lg:mt-12">
                <button onClick={() => navigate('/login')} className="text-accent-400 hover:text-accent-300 font-bold text-sm flex items-center gap-1.5 justify-center mx-auto transition-colors">
                  {t('landing.workshops.viewAll')}
                  <ArrowLeft size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <section id="how" className="py-16 lg:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/3 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-surface-400 text-base lg:text-lg">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: '١', title: t('landing.howItWorks.step1'), desc: t('landing.howItWorks.step1Desc'), icon: User },
              { step: '٢', title: t('landing.howItWorks.step2'), desc: t('landing.howItWorks.step2Desc'), icon: Wrench },
              { step: '٣', title: t('landing.howItWorks.step3'), desc: t('landing.howItWorks.step3Desc'), icon: Star },
            ].map((s, i) => (
              <div key={s.step} className="text-center group" style={{ animation: `slide-up 0.6s ease-out ${i * 0.2}s forwards`, opacity: 0 }}>
                <div className="relative inline-block mb-6 lg:mb-8">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-accent-500/20">
                    <span className="text-3xl lg:text-4xl font-bold text-accent-400">{s.step}</span>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block absolute top-1/2 -left-[calc(50%+2rem)] w-[calc(100%+4rem)] h-0.5 bg-gradient-to-l from-accent-500/20 to-transparent" />
                  )}
                </div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 lg:mb-5 group-hover:bg-accent-500/20 group-hover:scale-110 transition-all duration-300">
                  <s.icon className="h-7 w-7 lg:h-8 lg:w-8 text-accent-400" />
                </div>
                <h3 className="font-bold text-lg lg:text-xl mb-2">{s.title}</h3>
                <p className="text-surface-400 text-sm lg:text-base max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="py-16 lg:py-24 px-4 bg-surface-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 animate-slide-up">
              {t('landing.reviews.title')}
            </h2>
            <p className="text-surface-400 text-base lg:text-lg">{t('landing.reviews.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((review, i) => (
              <div
                key={review.name}
                className="bg-surface-800/30 backdrop-blur-sm border border-surface-700/40 rounded-2xl lg:rounded-3xl p-6 lg:p-8 card-hover"
                style={{ animation: `slide-up 0.5s ease-out ${i * 0.15}s forwards`, opacity: 0 }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-surface-300 text-sm lg:text-base mb-6 leading-relaxed">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center font-bold text-sm lg:text-base">
                    {review.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm lg:text-base">{review.name}</p>
                    <p className="text-surface-500 text-xs">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 lg:py-24 px-4 bg-surface-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-gradient">{t('landing.contact.title')}</span>
            </h2>
            <p className="text-surface-400 text-base lg:text-lg">{t('landing.contact.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center group card-hover bg-surface-800/30 backdrop-blur-sm border border-surface-700/40 rounded-2xl p-6 lg:p-8"
              style={{ animation: 'slide-up 0.5s ease-out 0.1s forwards', opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Phone size={28} className="text-accent-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{t('landing.contact.callUs')}</h3>
              <p className="text-surface-400 text-sm" dir="ltr">0575903086</p>
            </div>
            <div className="text-center group card-hover bg-surface-800/30 backdrop-blur-sm border border-surface-700/40 rounded-2xl p-6 lg:p-8"
              style={{ animation: 'slide-up 0.5s ease-out 0.2s forwards', opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail size={28} className="text-accent-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{t('landing.contact.email')}</h3>
              <p className="text-surface-400 text-sm" dir="ltr">info@salaba.sa</p>
            </div>
            <div className="text-center group card-hover bg-surface-800/30 backdrop-blur-sm border border-surface-700/40 rounded-2xl p-6 lg:p-8"
              style={{ animation: 'slide-up 0.5s ease-out 0.3s forwards', opacity: 0 }}>
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MapPinned size={28} className="text-accent-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{t('landing.contact.location')}</h3>
              <p className="text-surface-400 text-sm">{t('landing.contact.saudiArabia')}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            {[
              { label: t('landing.contact.whatsapp'), href: '#' },
              { label: t('landing.contact.twitter'), href: '#' },
              { label: t('landing.contact.instagram'), href: '#' },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-12 h-12 rounded-2xl bg-surface-800/50 border border-surface-700/40 flex items-center justify-center text-surface-400 hover:text-accent-400 hover:border-accent-500/30 hover:bg-accent-500/5 transition-all duration-300"
              >
                <MessageCircle size={20} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-700 to-accent-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 lg:mb-6 animate-slide-up">
            {t('landing.cta.title')}
          </h2>
          <p className="text-white/80 text-base lg:text-lg mb-8 lg:mb-10 max-w-xl mx-auto">
            {t('landing.cta.subtitle')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-accent-700 font-bold px-8 sm:px-10 lg:px-12 py-3.5 lg:py-4 rounded-2xl hover:bg-white/90 transition-all duration-300 text-base lg:text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 btn-shine"
          >
            {t('landing.cta.button')}
          </button>
        </div>
      </section>

      <footer className="py-10 lg:py-12 px-4 border-t border-surface-800 bg-surface-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <img src="/tasaheel-logo.png" alt={t('common.appName')} className="h-16 w-auto object-contain mb-3" />
              <p className="text-surface-500 text-sm leading-relaxed">{t('landing.footer.description')}</p>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">{t('landing.footer.quickLinks')}</h4>
              <div className="space-y-2">
                <a href="#" className="block text-surface-500 text-sm hover:text-accent-400 transition-colors">{t('landing.footer.privacy')}</a>
                <a href="#" className="block text-surface-500 text-sm hover:text-accent-400 transition-colors">{t('landing.footer.terms')}</a>
                <a href="#" className="block text-surface-500 text-sm hover:text-accent-400 transition-colors">{t('landing.footer.faq')}</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-3">{t('landing.footer.contact')}</h4>
              <div className="space-y-2 text-surface-500 text-sm">
                <p>📞 0575903086</p>
                <p>✉️ info@salaba.sa</p>
                <p>📍 {t('landing.contact.saudiArabia')}</p>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-surface-800 text-center">
            <span className="text-surface-600 text-xs">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
