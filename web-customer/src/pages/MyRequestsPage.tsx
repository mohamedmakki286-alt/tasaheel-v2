import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestsApi } from '../api/requests.api';
import type { Request } from '../types';
import { RequestCard } from '../components/RequestCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RefreshCw, Save, Send, FileText, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'active' | 'completed' | 'drafts';
const COMPLETED_STATUSES = new Set(['completed', 'verified', 'paid', 'cancelled']);

export function MyRequestsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('active');
  const [requests, setRequests] = useState<Request[]>([]);
  const [drafts, setDrafts] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      requestsApi.getAll(),
      requestsApi.getDrafts(),
    ]).then(([reqRes, draftRes]: [any, any]) => {
      setRequests(reqRes.data || reqRes || []);
      setDrafts(draftRes.data || draftRes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmitDraft = async (id: string) => {
    try {
      await requestsApi.submitDraft(id);
      toast.success(t('toast.success.draftSubmitted'));
      load();
    } catch {
      toast.error(t('toast.error.draftSubmitFailed'));
    }
  };

  if (loading) return <LoadingSpinner />;

  const activeRequests = requests.filter(request => !COMPLETED_STATUSES.has(request.status));
  const completedRequests = requests.filter(request => COMPLETED_STATUSES.has(request.status));

  const tabs = [
    { key: 'active' as Tab, label: 'النشطة', count: activeRequests.length, icon: Clock },
    { key: 'completed' as Tab, label: 'السجل', count: completedRequests.length, icon: CheckCircle2 },
    { key: 'drafts' as Tab, label: 'المسودات', count: drafts.length, icon: Save },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary-500 dark:text-white">{t('pages.requests.title')}</h2>
        <button onClick={load} className="p-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-[12px] transition-colors">
          <RefreshCw className="h-5 w-5 text-surface-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-surface-50 dark:bg-surface-800/50 rounded-[14px] p-1">
        {tabs.map((t) => {
          const isActive = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 rounded-[12px] text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                isActive ? 'bg-brand text-white shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-surface-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
              <span className={`text-[10px] font-bold ${isActive ? 'text-white/80' : 'text-surface-400'}`}>({t.count})</span>
            </button>
          );
        })}
      </div>

      {/* Active requests */}
      {tab === 'active' && (
        activeRequests.length === 0 ? (
          <EmptyState title={t('pages.requests.emptyActive')} description={t('pages.requests.emptyActiveDesc')} />
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onClick={() => navigate(`/orders/${req.id}`)}
              />
            ))}
          </div>
        )
      )}

      {tab === 'completed' && (
        completedRequests.length === 0 ? (
          <EmptyState title="لا يوجد سجل سابق" description="تظهر هنا الطلبات المكتملة والمدفوعة والملغاة" />
        ) : (
          <div className="space-y-3">
            {completedRequests.map((req) => (
              <RequestCard key={req.id} request={req} onClick={() => navigate(`/orders/${req.id}`)} />
            ))}
          </div>
        )
      )}

      {/* Drafts */}
      {tab === 'drafts' && (
        drafts.length === 0 ? (
          <EmptyState title={t('pages.requests.emptyDrafts')} description={t('pages.requests.emptyDraftsDesc')} />
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="card border border-surface-200 dark:border-surface-700/40 hover:shadow-card-hover transition-all"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/orders/${draft.id}`)}
                >
                  <RequestCard request={draft} onClick={() => {}} />
                </div>
                <div className="px-4 pb-3 pt-1 flex gap-2 border-t border-surface-100 dark:border-surface-700/20 mt-2">
                  <button
                    onClick={() => handleSubmitDraft(draft.id)}
                    className="flex-1 py-2 text-sm rounded-[12px] bg-brand text-white font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {t('pages.requests.submitDraft')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
