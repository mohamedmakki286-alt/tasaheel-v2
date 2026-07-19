export const WORKSHOP_TYPES = [
  { value: 'stationary', label: 'ورشة ثابتة', icon: 'Building2' },
  { value: 'mobile', label: 'ورشة متنقلة', icon: 'Truck' },
  { value: 'both', label: 'ثابتة ومتنقلة', icon: 'Briefcase' },
];

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  assigned: 'تم التخصيص',
  inspected: 'تم الفحص',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
  approved: 'معتمد',
  rejected: 'مرفوض',
  active: 'نشط',
  inactive: 'غير نشط',
  online: 'متصل',
  offline: 'غير متصل',
  paid: 'مدفوع',
  refunded: 'مسترجع',
  failed: 'فشل',
  cash: 'نقدي',
  card: 'بطاقة ائتمان',
  wallet: 'محفظة',
  bank_transfer: 'تحويل بنكي',
  good: 'جيد',
  needs_repair: 'بحاجة إصلاح',
  needs_replacement: 'بحاجة استبدال',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  inspected: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  online: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export const ROLES = {
  admin: 'مدير',
  super_admin: 'مدير عام',
  customer: 'عميل',
  workshop: 'ورشة',
  driver: 'سائق',
};

export const REQUEST_STATUSES = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'assigned', label: 'تم التخصيص' },
  { value: 'inspected', label: 'تم الفحص' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'ملغي' },
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'card', label: 'بطاقة ائتمان' },
  { value: 'wallet', label: 'محفظة' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
];

export const NAV_ITEMS = [
  { path: '/', label: 'لوحة الإحصائيات', icon: 'LayoutDashboard' },
  { path: '/customers', label: 'العملاء', icon: 'Users' },
  { path: '/workshops', label: 'ورش الصيانة', icon: 'Wrench' },
  { path: '/drivers', label: 'السائقين', icon: 'Truck' },
  { path: '/requests', label: 'طلبات الصيانة', icon: 'ClipboardList' },
  { path: '/payments', label: 'المدفوعات', icon: 'DollarSign' },
  { path: '/services', label: 'الخدمات', icon: 'Settings' },
  { path: '/reports', label: 'التقارير', icon: 'BarChart3' },
  { path: '/settings', label: 'الإعدادات', icon: 'Cog' },
];
