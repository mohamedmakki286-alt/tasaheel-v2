import React from 'react';
import clsx from 'clsx';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  overlay?: boolean;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function LoadingSpinner({ size = 'md', className, overlay = false }: Props) {
  const spinner = (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className="relative">
        <div
          className={clsx(
            sizes[size],
            'rounded-full border-2 border-gray-200'
          )}
        />
        <div
          className={clsx(
            sizes[size],
            'absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin'
          )}
        />
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
