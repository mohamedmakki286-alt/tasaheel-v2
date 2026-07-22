import { Calendar, MapPin, Wrench } from 'lucide-react';
import type { Request } from '../types';
import { StatusBadge } from './StatusBadge';

export function RequestCard({ request, onClick }: { request: Request; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="card hover:shadow-card-hover cursor-pointer transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-brand" />
          </div>
          <span className="font-medium text-sm text-primary-500 dark:text-white">{request.serviceTypeName || request.description}</span>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <div className="flex items-center gap-2 text-sm text-surface-400 mb-1 mt-2">
        <Calendar className="h-4 w-4" />
        <span>{new Date(request.createdAt).toLocaleDateString('ar-SA')}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-surface-400">
        <MapPin className="h-4 w-4" />
        <span>{request.locationAddress || request.city}</span>
      </div>
    </div>
  );
}
