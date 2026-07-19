import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { requestsApi } from '../api/requests.api';
import type { Request } from '../types';
import { RequestCard } from '../components/RequestCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RefreshCw, Save, Send, FileText } from 'lucide-react';
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

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('pages.requests.title')}</h2>
        <button onClick={load} className="p-2 hover:bg-surface-800 rounded-lg transition-colors">
          <RefreshCw className="h-5 w-5 text-surface-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-surface-100 dark:bg-surface-800/50 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            tab === 'active' ? 'bg-accent-500 text-white' : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          النشطة ({activeRequests.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            tab === 'completed' ? 'bg-accent-500 text-white' : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          السجل ({completedRequests.length})
        </button>
        <button
          onClick={() => setTab('drafts')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            tab === 'drafts' ? 'bg-accent-500 text-white' : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
          }`}
        >
          <Save className="h-4 w-4" />
          المسودات ({drafts.length})
        </button>
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
                className="card border border-surface-700/40 hover:border-surface-600/60 transition-all"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/orders/${draft.id}`)}
                >
                  <RequestCard request={draft} onClick={() => {}} />
                </div>
                <div className="px-4 pb-3 pt-1 flex gap-2 border-t border-surface-700/20 mt-2">
                  <button
                    onClick={() => handleSubmitDraft(draft.id)}
                    className="flex-1 py-2 text-sm rounded-xl bg-accent-500 text-black font-bold hover:bg-accent-400 transition-colors flex items-center justify-center gap-1.5"
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
