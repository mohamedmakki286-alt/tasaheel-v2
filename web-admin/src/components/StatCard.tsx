import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend?: { value: number; isUp: boolean };
  formatValue?: (val: number) => string;
  color?: 'primary' | 'accent' | 'accent2' | 'green' | 'blue' | 'purple';
}

const colorVariants = {
  primary: { bg: 'bg-[#0f1724]/5', iconBg: 'bg-gradient-to-br from-[#0f1724] to-[#1e293b]', text: 'text-[#0f1724]' },
  accent: { bg: 'bg-amber-50', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500', text: 'text-amber-600' },
  accent2: { bg: 'bg-orange-50', iconBg: 'bg-gradient-to-br from-orange-500 to-rose-500', text: 'text-orange-600' },
  green: { bg: 'bg-emerald-50', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50', iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-gradient-to-br from-purple-500 to-violet-500', text: 'text-purple-600' },
};

export default function StatCard({
  icon,
  label,
  value,
  trend,
  formatValue = (v) => v.toLocaleString('ar-SA'),
  color = 'primary',
}: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const colorSet = colorVariants[color];

  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    const from = 0;
    const to = value;

    function animate(time: number) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(from + (to - from) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    if (value > 0) requestAnimationFrame(animate);
    else setDisplayValue(0);
  }, [value]);

  return (
    <div
      className={clsx(
        'card relative overflow-hidden group cursor-default',
        'hover:shadow-xl hover:-translate-y-1 transition-all duration-300'
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className={clsx('p-3 rounded-2xl', colorSet.iconBg, 'shadow-lg shadow-black/10')}>
            <div className="text-white [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
          </div>
          {trend && (
            <div
              className={clsx(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                trend.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}
            >
              {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className={clsx('text-2xl font-bold mt-1', colorSet.text)}>
            {formatValue(displayValue)}
          </p>
        </div>
      </div>
      <div className={clsx('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300', colorSet.bg)} />
    </div>
  );
}
