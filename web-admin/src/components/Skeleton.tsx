import React from 'react';
import clsx from 'clsx';

interface Props {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

export default function Skeleton({ className, variant = 'text', width, height, count = 1 }: Props) {
  const baseClass = clsx(
    'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[skeleton-pulse_1.5s_ease-in-out_infinite]',
    {
      'h-4 w-full rounded-lg': variant === 'text',
      'rounded-full': variant === 'circle',
      'rounded-2xl': variant === 'card',
      'rounded-xl': variant === 'rect',
    },
    className
  );

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;
  if (variant === 'circle' && !width) style.width = '40px';
  if (variant === 'circle' && !height) style.height = '40px';

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={baseClass} style={style} />
      ))}
    </>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="flex-1 h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-static space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton variant="circle" width="48px" height="48px" />
            <Skeleton className="w-16 h-5" />
          </div>
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-32 h-8" />
        </div>
      ))}
    </div>
  );
}
