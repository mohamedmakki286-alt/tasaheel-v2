import React from 'react';
import { STATUS_LABELS, STATUS_COLORS } from '../utils/constants';
import clsx from 'clsx';
import type { BadgeVariant } from '../types';
import { useTranslation } from 'react-i18next';

interface Props {
  status: string;
  className?: string;
  dot?: boolean;
}

const dotVariants: Record<string, string> = {
  pending: 'bg-amber-500',
  assigned: 'bg-blue-500',
  inspected: 'bg-indigo-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-emerald-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  active: 'bg-emerald-500',
  inactive: 'bg-gray-400',
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  paid: 'bg-emerald-500',
  refunded: 'bg-orange-500',
  failed: 'bg-red-500',
  cash: 'bg-amber-500',
  card: 'bg-blue-500',
  wallet: 'bg-purple-500',
  bank_transfer: 'bg-cyan-500',
};

export default function StatusBadge({ status, className, dot = true }: Props) {
  const { t } = useTranslation();
  const i18nLabel = t(`constants.statusLabels.${status}`, { defaultValue: '' });
  const label = i18nLabel || STATUS_LABELS[status] || status;
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-black/5',
        colorClass,
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotVariants[status] || 'bg-gray-400')} />}
      {label}
    </span>
  );
}
