import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import BottomNav from '../components/BottomNav';
import AIAssistant from '../components/AIAssistant';
import { useAuthStore } from '../stores/authStore';
import UnifiedCallHost from '@shared/call/UnifiedCallHost';

const PAGE_TITLES: Record<string, string> = {
  '/vehicles': 'سياراتي',
  '/orders': 'طلباتي',
  '/new-request': 'طلب جديد',
  '/reports': 'التقارير',
  '/invoices': 'الفواتير',
  '/account': 'حسابي',
};

export function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const subTitle = useMemo(() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.startsWith('/orders/')) return 'تفاصيل الطلب';
    if (path.startsWith('/vehicles/')) return 'سجل السيارة';
    if (path.startsWith('/inspection-report/')) return 'تقرير الفحص';
    if (path.startsWith('/payment/')) return 'الدفع';
    if (path.startsWith('/rating/')) return 'التقييم';
    return '';
  }, [location.pathname]);

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

      <main className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <AIAssistant />

      {useAuthStore.getState().customer && useAuthStore.getState().token && (
        <UnifiedCallHost
          userId={useAuthStore.getState().customer!.id}
          userName={useAuthStore.getState().customer!.name}
          userRole="customer"
          token={useAuthStore.getState().token!}
        />
      )}
    </div>
  );
}
