import { Calendar, MapPin, Wrench } from 'lucide-react';
import type { Request } from '../types';
import { StatusBadge } from './StatusBadge';

export function RequestCard({ request, onClick }: { request: Request; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="card hover:bg-surface-700/80 cursor-pointer transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-accent-400" />
          <span className="font-medium">{request.serviceTypeName || request.description}</span>
        </div>
        <StatusBadge status={request.status} />
      </div>
      <div className="flex items-center gap-2 text-sm text-surface-400 mb-1">
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
