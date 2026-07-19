import { useTranslation } from 'react-i18next';
import { Clock, LogOut, Shield, Phone, Mail } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovalPage() {
  const { t } = useTranslation();
  const { workshop, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col transition-colors duration-200">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 bg-gradient-to-br from-accent-500 to-accent-700">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {t('pages.pendingApproval.title', 'حسابك قيد المراجعة')}
            </h1>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 sm:p-8 space-y-6">
            {workshop?.name && (
              <div className="text-center pb-4 border-b border-surface-100 dark:border-surface-800">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t('pages.pendingApproval.workshopName', 'اسم الورشة')}
                </p>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">
                  {workshop.name}
                </p>
              </div>
            )}

            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {t('pages.pendingApproval.pendingMessage', 'تم إنشاء حسابك بنجاح')}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                    {t('pages.pendingApproval.pendingDescription', 'بانتظار موافقة الإدارة على حسابك. سيتم مراجعة بياناتك والموافقة عليك في أقرب وقت ممكن.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                {t('pages.pendingApproval.whatNext', 'ماذا بعد؟')}
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  {t('pages.pendingApproval.step1', 'تأكد من إكمال جميع بيانات ورشتك')}
                </li>
                <li className="flex items-center gap-2.5 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  {t('pages.pendingApproval.step2', 'سيتم إشعارك عند الموافقة على حسابك')}
                </li>
                <li className="flex items-center gap-2.5 text-sm text-surface-600 dark:text-surface-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                  {t('pages.pendingApproval.step3', 'يمكنك التواصل مع الإدارة للاستفسار')}
                </li>
              </ul>
            </div>

            <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-surface-500 dark:text-surface-400">
                {t('pages.pendingApproval.contactInfo', 'معلومات التواصل')}
              </p>
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Mail size={14} className="shrink-0" />
                <span dir="ltr">support@tasaheel.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Phone size={14} className="shrink-0" />
                <span dir="ltr">800-123-4567</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors font-medium text-sm"
            >
              <LogOut size={18} />
              {t('pages.pendingApproval.logout', 'تسجيل الخروج')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
