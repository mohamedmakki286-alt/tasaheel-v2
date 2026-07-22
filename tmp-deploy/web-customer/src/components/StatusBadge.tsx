import { useTranslation } from 'react-i18next';
import type { RequestStatus } from '../types';

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    pending: t('constants.requestStatuses.pending'),
    quoted: t('constants.requestStatuses.quoted'),
    customer_approved: t('constants.requestStatuses.customer_approved'),
    in_progress: t('constants.requestStatuses.in_progress'),
    inspection_report: t('constants.requestStatuses.inspection_report'),
    awaiting_payment: t('constants.requestStatuses.awaiting_payment'),
    completed: t('constants.requestStatuses.completed'),
    cancelled: t('constants.requestStatuses.cancelled'),
  };
  const cls = `status-badge status-${status}`;
  return <span className={cls}>{labels[status] || status}</span>;
}
