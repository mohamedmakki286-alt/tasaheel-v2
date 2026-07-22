import { useState, useEffect, useCallback, ErrorInfo, Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2, Phone, MapPin, Save, Star, Check, Clock, XCircle,
  Truck, Briefcase, Video, MessageCircle, Globe, Instagram, Twitter,
  Youtube, Image as ImageIcon, Shield, Wifi, Armchair, Coffee, BadgeCheck,
  ParkingCircle, Droplets, ChevronDown, ChevronUp, Upload, Trash2, Link2,
  User, FileText, Camera, Pencil, X, Plus
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateProfile, galleryApi, uploadImage } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { WORKSHOP_TYPES, CITIES, WORKSHOP_FEATURES } from '../utils/constants';
import Avatar from '../components/Avatar';
import LocationPicker from '../components/LocationPicker';

class LocationPickerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('LocationPicker error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-center">
          <p className="text-sm text-surface-500">تعذر تحميل الخريطة</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const LazyLocationPicker = ({ latitude, longitude, onChange }: { latitude?: number | null; longitude?: number | null; onChange: (lat: number, lng: number) => void }) => (
  <LocationPickerErrorBoundary>
    <LocationPicker latitude={latitude} longitude={longitude} onChange={onChange} />
  </LocationPickerErrorBoundary>
);

const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const DAYS_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function parseWorkingHours(json: string): { day: string; open: string; close: string; closed: boolean }[] {
  if (!json) {
    return DAYS_AR.map((day, i) => ({ day, open: '08:00', close: '22:00', closed: i === 6 }));
  }
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length === 7) return parsed;
    return DAYS_AR.map((day, i) => ({ day, open: '08:00', close: '22:00', closed: i === 6 }));
  } catch {
    return DAYS_AR.map((day, i) => ({ day, open: '08:00', close: '22:00', closed: i === 6 }));
  }
}

function SectionCard({ title, subtitle, icon: Icon, children, defaultOpen = true }: {
  title: string; subtitle?: string; icon: any; children: ReactNode; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-3 p-5 text-right hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-primary-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-surface-900 dark:text-surface-100 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-surface-400" /> : <ChevronDown size={18} className="text-surface-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-surface-100 dark:border-surface-800 pt-4">{children}</div>}
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { workshop, updateWorkshop } = useAuthStore();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [workshopType, setWorkshopType] = useState<string>('stationary');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [snapchatUrl, setSnapchatUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [workingHours, setWorkingHours] = useState<{ day: string; open: string; close: string; closed: boolean }[]>([]);
  const [features, setFeatures] = useState<string[]>([]);

  const { data: gallery = [], isLoading: galleryLoading } = useQuery({
    queryKey: ['workshop-gallery'],
    queryFn: async () => {
      const resp = await galleryApi.getAll();
      return Array.isArray(resp) ? resp : (resp?.data || []);
    },
  });

  useEffect(() => {
    if (workshop) {
      setName(workshop.name);
      setDescription(workshop.description || '');
      setPhone(workshop.phone);
      setAddress(workshop.address);
      setCity(workshop.city);
      setWorkshopType(workshop.workshopType || 'stationary');
      setWhatsapp(workshop.whatsapp || '');
      setWebsite(workshop.website || '');
      setTiktokUrl(workshop.tiktokUrl || '');
      setSnapchatUrl(workshop.snapchatUrl || '');
      setFacebookUrl(workshop.facebookUrl || '');
      setInstagramUrl(workshop.instagramUrl || '');
      setXUrl(workshop.xUrl || '');
      setYoutubeUrl(workshop.youtubeUrl || '');
      setLatitude(workshop.latitude);
      setLongitude(workshop.longitude);
      setLogoUrl(workshop.logoUrl || '');
      setCoverImageUrl(workshop.coverImageUrl || '');
      setWorkingHours(parseWorkingHours(workshop.workingHours || ''));
      setFeatures(workshop.features ? workshop.features.split(',').filter(Boolean) : []);
    }
  }, [workshop]);

  const toggleFeature = (featureId: string) => {
    setFeatures(prev => prev.includes(featureId) ? prev.filter(f => f !== featureId) : [...prev, featureId]);
  };

  const updateWorkingHour = (index: number, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setWorkingHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const mutation = useMutation({
    mutationFn: () => updateProfile({
      name, phone, address, city, workshopType: workshopType as any,
      services: workshop?.services || [],
      description, workingHours: JSON.stringify(workingHours),
      whatsapp, website, tiktokUrl, snapchatUrl, facebookUrl, instagramUrl, xUrl, youtubeUrl,
      features: features.join(','), latitude, longitude,
      logoUrl, coverImageUrl,
    }),
    onSuccess: (data) => {
      updateWorkshop(data);
      toast.success(t('toast.success.profileUpdated'));
    },
    onError: () => toast.error(t('toast.error.profileUpdateFailed')),
  });

  const handleSubmit = () => mutation.mutate();

  const handleAddGalleryImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const url = await uploadImage(file, 'gallery');
        await galleryApi.add(url, 'image', gallery.length === 0);
        queryClient.invalidateQueries({ queryKey: ['workshop-gallery'] });
        toast.success('تمت إضافة الصورة بنجاح');
      } catch { toast.error('فشل إضافة الصورة'); }
    };
    input.click();
  };

  const handleDeleteGalleryItem = async (itemId: number) => {
    if (!confirm('هل تريد حذف هذه الصورة؟')) return;
    try {
      await galleryApi.remove(itemId);
      queryClient.invalidateQueries({ queryKey: ['workshop-gallery'] });
      toast.success('تم الحذف بنجاح');
    } catch { toast.error('فشل الحذف'); }
  };

  const handleSetCover = async (itemId: number) => {
    try {
      await galleryApi.update(itemId, { isCover: true });
      queryClient.invalidateQueries({ queryKey: ['workshop-gallery'] });
      toast.success('تم تعيين الصورة الرئيسية');
    } catch { toast.error('فشل التعيين'); }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'logo');
      setLogoUrl(url);
      toast.success('تم رفع الشعار بنجاح');
    } catch { toast.error('فشل رفع الشعار'); }
    setUploadingLogo(false);
    e.target.value = '';
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage(file, 'cover');
      setCoverImageUrl(url);
      toast.success('تم رفع صورة الغلاف بنجاح');
    } catch { toast.error('فشل رفع صورة الغلاف'); }
    setUploadingCover(false);
    e.target.value = '';
  };

  if (!workshop) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded-xl" />
        <div className="h-32 bg-surface-200 dark:bg-surface-700 rounded-2xl" />
        <div className="h-64 bg-surface-200 dark:bg-surface-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-surface-900 dark:text-surface-100">{t('pages.profile.title')}</h1>
        <p className="text-surface-500 text-sm mt-1">{t('pages.profile.subtitle')}</p>
      </div>

      {/* Workshop Summary Card */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5">
        <div className="flex items-center gap-4">
          <Avatar name={workshop.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">{workshop.name}</h2>
            <p className="text-xs text-surface-400">{workshop.city}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-0.5">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-sm text-surface-800 dark:text-surface-200">{workshop.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-surface-400">({workshop.reviewsCount})</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            {workshop.isApproved === true && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <Check size={12} /> {t('pages.profile.approved')}
              </span>
            )}
            {workshop.isApproved === undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                <Clock size={12} /> {t('pages.profile.pendingReview')}
              </span>
            )}
            {workshop.isApproved === false && workshop.rejectionReason && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                <XCircle size={12} /> {t('pages.profile.rejected')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Reason */}
      {workshop.rejectionReason && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
          <p className="text-sm font-semibold text-red-700 mb-1">{t('pages.profile.rejectionReason')}</p>
          <p className="text-sm text-red-600">{workshop.rejectionReason}</p>
        </div>
      )}

      {/* Section 1: Identity */}
      <SectionCard title={t('pages.profile.sectionIdentity')} subtitle={t('pages.profile.sectionIdentityDesc')} icon={Building2}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('pages.profile.workshopName')}</label>
            <div className="relative">
              <Building2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field pr-10" required />
            </div>
          </div>
          <div>
            <label className="label">{t('pages.profile.description')}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[80px] resize-none" rows={3} placeholder={t('pages.profile.descriptionPlaceholder')} />
          </div>
          <div>
            <label className="label">{t('pages.profile.workshopType')}</label>
            <div className="grid grid-cols-3 gap-3">
              {WORKSHOP_TYPES.map((wt) => {
                const isSelected = workshopType === wt.value;
                const IconComp = wt.icon === 'Building2' ? Building2 : wt.icon === 'Truck' ? Truck : Briefcase;
                return (
                  <button key={wt.value} type="button" onClick={() => setWorkshopType(wt.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                        : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                    }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-400'}`}>
                      <IconComp size={18} />
                    </div>
                    <span className="text-xs font-bold">{t('constants.workshopTypes.' + wt.value)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('pages.profile.logo', 'شعار الورشة')}</label>
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="text-surface-300 mx-auto mb-1" />
                      <span className="text-xs text-surface-400">{uploadingLogo ? 'جاري الرفع...' : 'اضغث للرفع'}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div>
              <label className="label">{t('pages.profile.coverImage', 'صورة الغلاف')}</label>
              <div className="relative group">
                <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" id="cover-upload" />
                <label htmlFor="cover-upload" className="flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-400 transition-colors overflow-hidden">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload size={24} className="text-surface-300 mx-auto mb-1" />
                      <span className="text-xs text-surface-400">{uploadingCover ? 'جاري الرفع...' : 'اضغث للرفع'}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Contact */}
      <SectionCard title={t('pages.profile.sectionContact')} subtitle={t('pages.profile.sectionContactDesc')} icon={Phone}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('pages.profile.phone')}</label>
              <div className="relative">
                <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pr-10" dir="ltr" required />
              </div>
            </div>
            <div>
              <label className="label">{t('pages.profile.whatsapp')}</label>
              <div className="relative">
                <MessageCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input-field pr-10" dir="ltr" placeholder="9665xxxxxxxx" />
              </div>
            </div>
          </div>
          <div>
            <label className="label">{t('pages.profile.email')}</label>
            <div className="relative">
              <Globe size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="email" value={''} disabled className="input-field pr-10 bg-surface-50 dark:bg-surface-800 cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="label">{t('pages.profile.website')}</label>
            <div className="relative">
              <Link2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="input-field pr-10" dir="ltr" placeholder="https://example.com" />
            </div>
          </div>
          <div>
            <label className="label">{t('pages.profile.socialLinks')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Video size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.tiktokPlaceholder')} dir="ltr" />
              </div>
              <div className="relative">
                <MessageCircle size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={snapchatUrl} onChange={(e) => setSnapchatUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.snapchatPlaceholder')} dir="ltr" />
              </div>
              <div className="relative">
                <Globe size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.facebookPlaceholder')} dir="ltr" />
              </div>
              <div className="relative">
                <Instagram size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.instagramPlaceholder')} dir="ltr" />
              </div>
              <div className="relative">
                <Twitter size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={xUrl} onChange={(e) => setXUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.xPlaceholder')} dir="ltr" />
              </div>
              <div className="relative">
                <Youtube size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="input-field pr-10" placeholder={t('pages.profile.youtubePlaceholder')} dir="ltr" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Location */}
      <SectionCard title={t('pages.profile.sectionLocation')} subtitle={t('pages.profile.sectionLocationDesc')} icon={MapPin}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('pages.profile.city')}</label>
              <div className="relative">
                <MapPin size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none z-10" />
                <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field pr-10 appearance-none" required>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{t('constants.cityNames.' + c, c)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="label">{t('pages.profile.address')}</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input-field min-h-[60px] resize-none" rows={2} required />
          </div>
          <LazyLocationPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
        </div>
      </SectionCard>

      {/* Section 4: Working Hours */}
      <SectionCard title={t('pages.profile.sectionWorkingHours')} subtitle={t('pages.profile.sectionWorkingHoursDesc')} icon={Clock} defaultOpen={false}>
        <div className="space-y-2">
          {DAYS_AR.map((day, index) => {
            const wh = workingHours[index] || { day, open: '08:00', close: '22:00', closed: index === 6 };
            return (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                wh.closed ? 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700 opacity-60' : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700'
              }`}>
                <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 w-20 shrink-0">{day}</span>
                <div className="flex-1 flex items-center gap-2">
                  {!wh.closed ? (
                    <>
                      <input type="time" value={wh.open} onChange={(e) => updateWorkingHour(index, 'open', e.target.value)} className="text-xs border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300" />
                      <span className="text-xs text-surface-400">-</span>
                      <input type="time" value={wh.close} onChange={(e) => updateWorkingHour(index, 'close', e.target.value)} className="text-xs border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-1.5 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300" />
                    </>
                  ) : (
                    <span className="text-xs text-surface-400">{t('pages.profile.closed')}</span>
                  )}
                </div>
                <button type="button" onClick={() => updateWorkingHour(index, 'closed', !wh.closed)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${wh.closed ? 'bg-surface-300 dark:bg-surface-600' : 'bg-primary-500'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${wh.closed ? 'right-0.5' : 'right-5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 5: Gallery */}
      <SectionCard title={t('pages.profile.sectionGallery')} subtitle={t('pages.profile.sectionGalleryDesc')} icon={Camera} defaultOpen={false}>
        <div className="space-y-4">
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((item: any) => (
                <div key={item.id} className="relative group rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 aspect-square">
                  <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                  {item.isCover && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-bold">{t('pages.profile.setAsCover')}</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {!item.isCover && (
                      <button onClick={() => handleSetCover(item.id)} className="p-2 rounded-full bg-white/90 text-surface-700 hover:bg-white text-xs">
                        <Star size={14} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteGalleryItem(item.id)} className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-500 text-xs">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera size={36} className="text-surface-300 dark:text-surface-600 mx-auto mb-3" />
              <p className="text-sm text-surface-400">{t('pages.profile.noImages')}</p>
              <p className="text-xs text-surface-400 mt-1">{t('pages.profile.noImagesDesc')}</p>
            </div>
          )}
          <button type="button" onClick={handleAddGalleryImage} className="w-full p-3 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center justify-center gap-2 text-sm">
            <Plus size={16} />
            {t('pages.profile.addImage')}
          </button>
        </div>
      </SectionCard>

      {/* Section 6: Features */}
      <SectionCard title={t('pages.profile.sectionFeatures')} subtitle={t('pages.profile.sectionFeaturesDesc')} icon={BadgeCheck} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WORKSHOP_FEATURES.map((feat) => {
            const isSelected = features.includes(feat.id);
            const IconMap: Record<string, any> = {
              waiting_area: Armchair, wifi: Wifi, coffee: Coffee, warranty: Shield,
              pickup_delivery: Truck, original_parts: BadgeCheck, parking: ParkingCircle, car_wash: Droplets,
            };
            const FeatIcon = IconMap[feat.id] || Check;
            return (
              <button key={feat.id} type="button" onClick={() => toggleFeature(feat.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 text-center ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:border-surface-300'
                }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary-500 text-white' : 'bg-surface-100 dark:bg-surface-700 text-surface-400'}`}>
                  <FeatIcon size={16} />
                </div>
                <span className="text-[11px] font-semibold leading-tight">{feat.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Save Button */}
      <div className="sticky bottom-20 lg:bottom-6 z-30">
        <button onClick={handleSubmit} disabled={mutation.isPending} className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base font-bold shadow-lg shadow-primary-500/20">
          {mutation.isPending ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('pages.profile.saving')}</>
          ) : (
            <><Save size={20} /> {t('pages.profile.save')}</>
          )}
        </button>
      </div>
    </div>
  );
}
