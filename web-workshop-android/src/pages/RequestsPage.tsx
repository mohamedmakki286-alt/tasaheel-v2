import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  Car,
  MessageCircle,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getNewRequests, getMyRequests } from '../api/requests.api';
import { formatDate, timeAgo, formatPhone } from '../utils/formatters';
import QuoteForm from '../components/QuoteForm';
import InspectionReportForm from '../components/InspectionReportForm';
import StatusUpdateModal from '../components/StatusUpdateModal';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import type { ServiceRequest } from '../types';

type TabType = 'new' | 'mine' | 'active' | 'completed';

interface RequestCardProps {
  request: ServiceRequest;
  showQuoteButton?: boolean;
  showStatusUpdate?: boolean;
  onQuote?: () => void;
  onStatusUpdate?: () => void;
  onInspectionReport?: () => void;
  onClick?: () => void;
}

function RequestCardView({ request, showQuoteButton, showStatusUpdate, onQuote, onStatusUpdate, onInspectionReport, onClick }: RequestCardProps) {
  const { t } = useTranslation();
  const statusColors: Record<string, string> = {
    pending: 'bg-accent-500/20 text-accent-500',
    quoted: 'bg-blue-500/20 text-blue-500',
    accepted: 'bg-success-500/20 text-success-500',
    in_progress: 'bg-purple-500/20 text-purple-500',
    awaiting_payment: 'bg-amber-500/20 text-amber-500',
    completed: 'bg-success-500/20 text-success-500',
    cancelled: 'bg-danger-500/20 text-danger-500',
  };

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer active:scale-[0.98] transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
          <Avatar name={request.customer?.name} size="sm" />
          <div>
            <p className="font-semibold text-sm text-surface-900 dark:text-white">{request.customer?.name || t('pages.requests.customer')}</p>
            <p className="text-[11px] text-surface-400 flex items-center gap-1 mt-0.5">
              <Car size={11} />
              {request.car?.make} {request.car?.model} {request.car?.year}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[request.status] || 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'}`}>
          {t('constants.statuses.' + request.status, request.status)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-surface-400 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {timeAgo(request.createdAt)}
        </span>
        {request.service && (
          <span className="flex items-center gap-1">
            <Wrench size={11} />
            {request.service}
          </span>
        )}
        {request.city && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {request.city}
          </span>
        )}
      </div>

      {request.description && (
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">{request.description}</p>
      )}

      {request.technicianName && (
        <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
          <User size={12} className="text-primary-500 shrink-0" />
          <span className="text-[11px] font-medium text-surface-600 dark:text-surface-300">الفني: {request.technicianName}</span>
          {request.technicianSpecialty && (
            <span className="text-[10px] text-surface-400">({request.technicianSpecialty})</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {showQuoteButton && onQuote && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuote(); }} className="btn-primary flex-1 text-xs py-2">
            {t('pages.requests.sendQuote')}
          </button>
        )}
        {showStatusUpdate && onStatusUpdate && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStatusUpdate(); }} className="btn-accent flex-1 text-xs py-2">
            {t('pages.requests.updateStatus')}
          </button>
        )}
        {showStatusUpdate && onInspectionReport && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInspectionReport(); }} className="btn-accent flex-1 text-xs py-2">
            {t('pages.requests.inspectionReport')}
          </button>
        )}
        {!showQuoteButton && !showStatusUpdate && (
          <button onClick={(e) => { e.stopPropagation(); }} className="btn-secondary flex-1 text-xs py-2">
            <MessageCircle size={14} />
            {t('pages.requests.chat')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tabs = [
    { id: 'new' as TabType, label: t('pages.requests.tabs.new'), icon: ClipboardList },
    { id: 'mine' as TabType, label: t('pages.requests.tabs.mine'), icon: FileText },
    { id: 'active' as TabType, label: t('pages.requests.tabs.active'), icon: Clock },
    { id: 'completed' as TabType, label: t('pages.requests.tabs.completed'), icon: CheckCircle2 },
  ];
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [quoteRequestId, setQuoteRequestId] = useState<string | null>(null);
  const [statusUpdateRequestId, setStatusUpdateRequestId] = useState<string | null>(null);
  const [statusUpdateCurrentStatus, setStatusUpdateCurrentStatus] = useState<any>(null);
  const [inspectionRequestId, setInspectionRequestId] = useState<string | null>(null);
  const [inspectionRequest, setInspectionRequest] = useState<any>(null);

  const { data: newRequests = [], isFetching: loadingNew } = useQuery({
    queryKey: ['new-requests'],
    queryFn: getNewRequests,
    refetchInterval: 15000,
  });

  const { data: allMyRequests = [], isFetching: loadingMine } = useQuery({
    queryKey: ['my-requests'],
    queryFn: getMyRequests,
    refetchInterval: 15000,
  });

  const myRequests = allMyRequests.filter((r) => r.status !== 'completed');
  const activeRequestsTab = allMyRequests.filter((r) => r.status === 'accepted' || r.status === 'in_progress');
  const completedRequestsTab = allMyRequests.filter((r) => r.status === 'completed');

  const getTabRequests = () => {
    switch (activeTab) {
      case 'new': return newRequests;
      case 'mine': return myRequests;
      case 'active': return activeRequestsTab;
      case 'completed': return completedRequestsTab;
    }
  };

  const requests = getTabRequests();
  const isLoading = loadingNew || loadingMine;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">{t('pages.requests.title')}</h1>
          <p className="text-surface-500 dark:text-surface-400 text-xs mt-0.5">{t('pages.requests.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-surface-800 px-2.5 py-1 rounded-lg">
          <RefreshCw size={12} className="animate-spin-slow" />
          <span>{t('pages.requests.autoRefresh')}</span>
        </div>
      </div>

      <div className="tab-bar overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === 'new' ? newRequests.length : tab.id === 'active' ? activeRequestsTab.length : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? 'tab-item-active' : 'tab-item'}
            >
              <tab.icon size={16} />
              {tab.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-accent-500 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {isLoading && requests.length === 0 && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <Skeleton variant="circular" width={36} height={36} />
                  <div className="flex-1">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </div>
                </div>
                <Skeleton variant="text" count={2} />
              </div>
            ))}
          </>
        )}
        {!isLoading && requests.length === 0 && (
          <EmptyState
            icon={activeTab === 'completed' ? CheckCircle2 : activeTab === 'active' ? Clock : activeTab === 'mine' ? FileText : ClipboardList}
            title={
              activeTab === 'new' ? t('pages.requests.noNewRequests') :
              activeTab === 'mine' ? t('pages.requests.noRequests') :
              activeTab === 'active' ? t('pages.requests.noActiveRequests') :
              t('pages.requests.noCompletedRequests')
            }
            description={
              activeTab === 'new' ? t('pages.requests.newRequestsDesc') :
              t('pages.requests.noRequestsDesc')
            }
          />
        )}
        {requests.map((request, idx) => (
          <div key={request.id} className="animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <RequestCardView
              request={request}
              showQuoteButton={activeTab === 'new' && !request.hasQuote}
              showStatusUpdate={(activeTab === 'active' || (activeTab === 'mine' && (request.status === 'accepted' || request.status === 'in_progress')))}
              onQuote={() => setQuoteRequestId(request.id)}
              onStatusUpdate={() => {
                setStatusUpdateRequestId(request.id);
                setStatusUpdateCurrentStatus(request.status);
              }}
              onInspectionReport={() => { setInspectionRequestId(request.id); setInspectionRequest(request); }}
              onClick={() => navigate(`/requests/${request.id}`)}
            />
          </div>
        ))}
      </div>

      {quoteRequestId && (
        <QuoteForm requestId={quoteRequestId} onClose={() => setQuoteRequestId(null)} />
      )}
      {statusUpdateRequestId && statusUpdateCurrentStatus && (
        <StatusUpdateModal
          requestId={statusUpdateRequestId}
          currentStatus={statusUpdateCurrentStatus}
          onClose={() => { setStatusUpdateRequestId(null); setStatusUpdateCurrentStatus(null); }}
        />
      )}
      {inspectionRequestId && (
        <InspectionReportForm requestId={inspectionRequestId} request={inspectionRequest} onClose={() => { setInspectionRequestId(null); setInspectionRequest(null); }} />
      )}
    </div>
  );
}
