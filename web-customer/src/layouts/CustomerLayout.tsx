import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import AIAssistant from '../components/AIAssistant';
import { useTranslation } from 'react-i18next';

const PAGE_TITLES: Record<string, string> = {
  '/account/support': 'الدعم والمساعدة',
  '/vehicles': 'سياراتي',
  '/orders': 'طلباتي',
  '/new-request': 'طلب جديد',
  '/reports': 'التقارير',
  '/invoices': 'الفواتير',
  '/account': 'حسابي',
};

export function CustomerLayout() {
  const { i18n } = useTranslation();
  const tr = (ar: string, en: string) => i18n.language.startsWith('en') ? en : ar;
  const navigate = useNavigate();
  const location = useLocation();

  const subTitle = useMemo(() => {
    const path = location.pathname;
    const englishTitles: Record<string, string> = { '/account/support': 'Support', '/vehicles': 'My Cars', '/orders': 'My Requests', '/new-request': 'New Request', '/reports': 'Reports', '/invoices': 'Invoices', '/account': 'My Account' };
    if (PAGE_TITLES[path]) return i18n.language.startsWith('en') ? englishTitles[path] : PAGE_TITLES[path];
    if (path.startsWith('/orders/')) return tr('تفاصيل الطلب', 'Request Details');
    if (path.startsWith('/vehicles/')) return tr('سجل السيارة', 'Car History');
    if (path.startsWith('/inspection-report/')) return tr('تقرير الفحص', 'Inspection Report');
    if (path.startsWith('/payment/')) return tr('الدفع', 'Payment');
    if (path.startsWith('/rating/')) return tr('التقييم', 'Rating');
    return '';
  }, [location.pathname, i18n.language]);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* Header with back button */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-surface-200/50 dark:border-surface-800/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-900 dark:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
          <span className="font-bold text-base text-surface-900 dark:text-white">{subTitle}</span>
        </div>
      </header>

      <main className="pb-36">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <AIAssistant />

    </div>
  );
}
