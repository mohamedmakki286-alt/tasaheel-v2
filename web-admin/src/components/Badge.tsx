import React from 'react';
import clsx from 'clsx';
import type { BadgeVariant } from '../types';

interface Props {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-600/10',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10',
  gray: 'bg-gray-100 text-gray-600 ring-1 ring-gray-600/10',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  gray: 'bg-gray-400',
};

export default function Badge({ children, variant = 'gray', dot = false, className }: Props) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold', variantClasses[variant], className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
