import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, Car, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate, formatPhone, timeAgo } from '../utils/formatters';

import Avatar from './Avatar';
import type { ServiceRequest } from '../types';

interface RequestCardProps {
  request: ServiceRequest;
  showQuoteButton?: boolean;
  showStatusUpdate?: boolean;
  onQuote?: () => void;
  onStatusUpdate?: () => void;
  onInspectionReport?: () => void;
}

export default function RequestCard({
  request,
  showQuoteButton,
  showStatusUpdate,
  onQuote,
  onStatusUpdate,
  onInspectionReport,
}: RequestCardProps) {
  const { t } = useTranslation();
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    quoted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    awaiting_payment: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-lg hover:border-surface-300 transition-all duration-300 cursor-pointer group">
      <Link to={`/requests/${request.id}`} className="block">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={request.customer?.name} size="md" />
            <div>
              <p className="font-semibold text-surface-800">{request.customer?.name || t('components.requestCard.customer')}</p>
              <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                <Calendar size={12} />
                {timeAgo(request.createdAt)}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[request.status] || 'bg-surface-100 text-surface-600'}`}>
            {t('constants.requestStatuses.' + request.status, request.status)}
          </span>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Car size={15} className="text-surface-400 shrink-0" />
            <span className="text-surface-700 font-medium">{request.car?.make} {request.car?.model} ({request.car?.year})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700">
              {request.service}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm text-surface-500">
            <MapPin size={14} className="shrink-0 mt-0.5" />
            <span className="truncate">{request.location} - {request.city}</span>
          </div>
        </div>

        {request.description && (
          <p className="text-sm text-surface-500 line-clamp-2 mb-4">{request.description}</p>
        )}
      </Link>

      <div className="flex gap-2 pt-4 border-t border-surface-100">
        {showQuoteButton && onQuote && (
          <button onClick={(e) => { e.preventDefault(); onQuote(); }} className="btn-primary flex-1 text-sm py-2">
            {t('components.requestCard.submitQuote')}
          </button>
        )}
        {showStatusUpdate && onStatusUpdate && (
          <button onClick={(e) => { e.preventDefault(); onStatusUpdate(); }} className="btn-secondary flex-1 text-sm py-2">
            {t('components.requestCard.updateStatus')}
          </button>
        )}
        {showStatusUpdate && onInspectionReport && (
          <button onClick={(e) => { e.preventDefault(); onInspectionReport(); }} className="btn-accent flex-1 text-sm py-2">
            {t('components.requestCard.inspectionReport')}
          </button>
        )}
        {!showQuoteButton && !showStatusUpdate && (
          <Link to={`/requests/${request.id}`} className="btn-secondary flex-1 text-sm py-2">
            <MessageCircle size={16} />
            {t('components.requestCard.details')}
          </Link>
        )}
      </div>
    </div>
  );
}
