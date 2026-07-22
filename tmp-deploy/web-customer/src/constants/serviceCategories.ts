export interface ServiceItem {
  id: string | null;
  name: string;
  duration?: string;
  group?: string;
}

export interface ServiceCategory {
  key: string;
  label: string;
  icon: string;
  desc: string;
  services: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    key: 'periodic',
    label: 'الصيانة الدورية',
    icon: '🚗',
    desc: 'تغيير زيت وفلاتر وفحص دوري',
    services: [
      { id: '1', name: 'تغيير زيت المحرك', duration: '٢٠-٣٠ دقيقة' },
      { id: '2', name: 'تغيير فلتر الهواء', duration: '١٠-١٥ دقيقة' },
      { id: '3', name: 'تغيير فلتر المكيف', duration: '١٥-٢٠ دقيقة' },
      { id: '4', name: 'تغيير شمعات الاحتراق', duration: '٣٠-٤٥ دقيقة' },
      { id: '5', name: 'تغيير زيت القير', duration: '٣٠-٤٥ دقيقة' },
      { id: '6', name: 'تغيير زيت الفرامل', duration: '٢٠-٣٠ دقيقة' },
      { id: '7', name: 'تغيير ماء الردياتير', duration: '٢٠-٣٠ دقيقة' },
      { id: '8', name: 'فحص دوري شامل', duration: '٤٥-٦٠ دقيقة' },
      { id: '9', name: 'تغيير سير المكينة', duration: '٣٠-٤٥ دقيقة' },
      { id: '10', name: 'تغيير فلتر البنزين', duration: '٢٠-٣٠ دقيقة' },
    ],
  },
  {
    key: 'mechanical',
    label: 'الميكانيكا',
    icon: '🔧',
    desc: 'مكينة وقير وفرامل وتعليق',
    services: [
      { id: '11', name: 'عمرة مكينة', group: 'المحرك', duration: '٣-٥ أيام' },
      { id: '12', name: 'تغيير وجه سلندر', group: 'المحرك', duration: '٢-٣ أيام' },
      { id: '13', name: 'تغيير طرمبة الزيت', group: 'المحرك', duration: '٢-٤ ساعات' },
      { id: '14', name: 'تغيير طرمبة الماء', group: 'المحرك', duration: '٢-٣ ساعات' },
      { id: '15', name: 'تغيير كراسي المكينة', group: 'المحرك', duration: '١-٢ ساعة' },
      { id: '16', name: 'تغيير ديناميكيات المكينة', group: 'المحرك', duration: '٢-٣ ساعات' },
      { id: '17', name: 'إصلاح تسريبات زيت', group: 'المحرك', duration: '١-٢ ساعة' },
      { id: '18', name: 'تنظيف البخاخات', group: 'المحرك', duration: '١-٢ ساعة' },
      { id: '19', name: 'تغيير حساس الأكسجين', group: 'المحرك', duration: '٣٠-٤٥ دقيقة' },
      { id: '20', name: 'تغيير طرمبة البنزين', group: 'المحرك', duration: '١-٢ ساعة' },
      { id: '21', name: 'عمرة قير أوتوماتيك', group: 'ناقل الحركة', duration: '٢-٤ أيام' },
      { id: '22', name: 'عمرة قير عادي', group: 'ناقل الحركة', duration: '١-٣ أيام' },
      { id: '23', name: 'تغيير كلتش', group: 'ناقل الحركة', duration: '٣-٦ ساعات' },
      { id: '24', name: 'تغيير دبل', group: 'ناقل الحركة', duration: '٢-٤ ساعات' },
      { id: '25', name: 'تغيير زيت الدفرنس', group: 'ناقل الحركة', duration: '٣٠-٤٥ دقيقة' },
      { id: '26', name: 'تغيير عمود كردان', group: 'ناقل الحركة', duration: '١-٢ ساعة' },
      { id: '27', name: 'تغيير مساعدات', group: 'التعليق', duration: '١-٢ ساعة' },
      { id: '28', name: 'تغيير يايات', group: 'التعليق', duration: '١-٢ ساعة' },
      { id: '29', name: 'تغيير جلنط', group: 'التعليق', duration: '٣٠-٤٥ دقيقة' },
      { id: '30', name: 'تغيير ذراع سفلي', group: 'التعليق', duration: '٣٠-٤٥ دقيقة' },
      { id: '31', name: 'تغيير مقصات', group: 'التعليق', duration: '٣٠-٤٥ دقيقة' },
      { id: '32', name: 'تغيير اكسس', group: 'التعليق', duration: '١-٢ ساعة' },
      { id: '33', name: 'تغيير فرامل أمامية', group: 'الفرامل', duration: '١-٢ ساعة' },
      { id: '34', name: 'تغيير فرامل خلفية', group: 'الفرامل', duration: '١-٢ ساعة' },
      { id: '35', name: 'تغيير طرمبة فرامل', group: 'الفرامل', duration: '١-٢ ساعة' },
      { id: '36', name: 'تغيير اسطوانات فرامل', group: 'الفرامل', duration: '١-٢ ساعة' },
    ],
  },
  {
    key: 'electrical',
    label: 'الكهرباء',
    icon: '⚡',
    desc: 'بطارية ودينمو وكمبيوتر',
    services: [
      { id: '37', name: 'تغيير دينمو', duration: '٣٠-٤٥ دقيقة' },
      { id: '38', name: 'تغيير سلف', duration: '٣٠-٤٥ دقيقة' },
      { id: '39', name: 'تغيير بطارية', duration: '١٠-١٥ دقيقة' },
      { id: '40', name: 'تغيير كويل', duration: '٣٠-٤٥ دقيقة' },
      { id: '41', name: 'برمجة كمبيوتر', duration: '١-٢ ساعة' },
      { id: '42', name: 'تغيير حساسات', duration: '٣٠-٤٥ دقيقة' },
      { id: '43', name: 'إصلاح أسواريم', duration: '١-٣ ساعات' },
      { id: '44', name: 'تغيير لمبات', duration: '١٥-٣٠ دقيقة' },
      { id: '45', name: 'تركيب نظام صوت', duration: '١-٢ ساعة' },
      { id: '46', name: 'تركيب إنذار', duration: '١-٢ ساعة' },
    ],
  },
  {
    key: 'ac',
    label: 'التكييف',
    icon: '❄️',
    desc: 'فريون وكمبروسر وتبريد',
    services: [
      { id: '47', name: 'شحن فلور', duration: '٣٠-٤٥ دقيقة' },
      { id: '48', name: 'تغيير كمبروسر', duration: '٢-٣ ساعات' },
      { id: '49', name: 'تغيير ثرمستات', duration: '٣٠-٤٥ دقيقة' },
      { id: '50', name: 'تغيير مروحة ردياتير', duration: '٣٠-٤٥ دقيقة' },
      { id: '51', name: 'تغيير ردياتير', duration: '١-٢ ساعة' },
      { id: '52', name: 'تغيير طرمبة مكيف', duration: '٢-٣ ساعات' },
      { id: '53', name: 'غسيل ردياتير', duration: '٣٠-٤٥ دقيقة' },
      { id: '54', name: 'تغيير مبخر', duration: '٢-٤ ساعات' },
    ],
  },
  {
    key: 'tires',
    label: 'الإطارات',
    icon: '🛞',
    desc: 'تغيير إطارات وترصيص',
    services: [
      { id: '63', name: 'تغيير إطار', duration: '١٥-٣٠ دقيقة' },
      { id: null, name: 'ترصيص إطارات' },
      { id: null, name: 'وزن أذرعة' },
      { id: null, name: 'إصلاح بنشر' },
    ],
  },
  {
    key: 'bodywork',
    label: 'السمكرة والدهان',
    icon: '🎨',
    desc: 'صدمات ودهان وتلميع',
    services: [
      { id: null, name: 'سمكرة صدمات' },
      { id: '56', name: 'دهان أجزاء (دوكو)', duration: '١-٢ يوم' },
      { id: '57', name: 'دهان كامل', duration: '٣-٥ أيام' },
      { id: '55', name: 'سمكة', duration: '١-٣ ساعات' },
      { id: '58', name: 'معجون', duration: '١-٢ ساعة' },
      { id: '59', name: 'تلميع سيارات', duration: '٢-٤ ساعات' },
      { id: '60', name: 'إصلاح زجاج', duration: '١-٢ ساعة' },
      { id: '61', name: 'تظليل', duration: '٢-٣ ساعات' },
    ],
  },
  {
    key: 'emergency',
    label: 'الطوارئ',
    icon: '🚨',
    desc: 'سحب وبطارية وفتح باب',
    services: [
      { id: '62', name: 'ونش سحاب', duration: '٣٠-٦٠ دقيقة' },
      { id: '67', name: 'ترحيل سيارة', duration: 'يعتمد على المسافة' },
      { id: '66', name: 'شحن بطارية', duration: '١٠-١٥ دقيقة' },
      { id: '63', name: 'تغيير إطار بالموقع', duration: '١٥-٣٠ دقيقة' },
      { id: '65', name: 'فتح باب السيارة', duration: '١٠-٢٠ دقيقة' },
      { id: '64', name: 'بنزين طوارئ', duration: '١٥-٣٠ دقيقة' },
    ],
  },
  {
    key: 'inspection',
    label: 'الفحص والتقييم',
    icon: '🔍',
    desc: 'فحص شامل وتقرير حالة',
    services: [
      { id: '8', name: 'فحص دوري شامل', duration: '٤٥-٦٠ دقيقة' },
      { id: null, name: 'فحص قبل الشراء' },
      { id: null, name: 'تقرير حالة السيارة' },
    ],
  },
];
