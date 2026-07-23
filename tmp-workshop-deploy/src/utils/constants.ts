export const REQUEST_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'بانتظار دفع الفاتورة',
  pending: 'قيد الانتظار',
  quoted: 'تم التسعير',
  accepted: 'مقبول',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد المراجعة',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-amber-100 text-amber-800',
  pending: 'bg-yellow-100 text-yellow-800',
  quoted: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const WORKSHOP_TYPES = [
  { value: 'stationary', label: 'ورشة ثابتة', icon: 'Building2', description: 'الورشة في موقع ثابت، العميل يحضر سيارته' },
  { value: 'mobile', label: 'ورشة متنقلة', icon: 'Truck', description: 'الورشة تنتقل لموقع العميل لتقديم الخدمة' },
  { value: 'both', label: 'ثابتة ومتنقلة', icon: 'Briefcase', description: 'خدمات في الموقع ولدينا ورشة ثابتة' },
];

export const WORKSHOP_FEATURES = [
  { id: 'waiting_area', label: 'غرفة انتظار', icon: 'Armchair' },
  { id: 'wifi', label: 'واي فاي', icon: 'Wifi' },
  { id: 'coffee', label: 'قهوة ومشروبات', icon: 'Coffee' },
  { id: 'warranty', label: 'ضمان على الخدمات', icon: 'Shield' },
  { id: 'pickup_delivery', label: 'استلام وتسليم', icon: 'Truck' },
  { id: 'original_parts', label: 'قطع أصلية', icon: 'BadgeCheck' },
  { id: 'parking', label: 'موقف سيارات', icon: 'ParkingCircle' },
  { id: 'car_wash', label: 'غسيل سيارات', icon: 'Droplets' },
];

export const SERVICE_TYPES = [
  { id: 'oil_change', label: 'تغيير زيت' },
  { id: 'brake_repair', label: 'إصلاح الفرامل' },
  { id: 'engine_repair', label: 'إصلاح المحرك' },
  { id: 'transmission', label: 'ناقل الحركة' },
  { id: 'electrical', label: 'كهرباء السيارات' },
  { id: 'air_conditioning', label: 'تكييف' },
  { id: 'tire_change', label: 'تغيير إطارات' },
  { id: 'alignment', label: 'ضبط الزوايا' },
  { id: 'painting', label: 'دهان' },
  { id: 'body_repair', label: 'سمكرة' },
  { id: 'car_wash', label: 'غسيل وتلميع' },
  { id: 'diagnostics', label: 'فحص كمبيوتر' },
  { id: 'suspension', label: 'العارض والتعليق' },
  { id: 'exhaust', label: 'نظام العادم' },
  { id: 'battery', label: 'بطارية' },
  { id: 'towing', label: 'سحب ونقل' },
];

export const CITIES = [
  'الرياض',
  'جدة',
  'مكة المكرمة',
  'المدينة المنورة',
  'الدمام',
  'الخبر',
  'الظهران',
  'الأحساء',
  'القطيف',
  'تبوك',
  'بريدة',
  'حائل',
  'نجران',
  'جازان',
  'ينبع',
  'الطائف',
  'القصيم',
  'أبها',
  'خميس مشيط',
  'عنيزة',
  'سكاكا',
  'عرعر',
];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  awaiting_payment: [],
  pending: ['quoted'],
  quoted: ['accepted'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const UPDATABLE_STATUSES = ['accepted', 'in_progress'];
