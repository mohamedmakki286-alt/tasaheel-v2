import { CarFront } from 'lucide-react';
import { getCarBrandLogo } from '../utils/carBrands';

export function CarBrandLogo({ make, className = '' }: { make?: string; className?: string }) {
  const logo = getCarBrandLogo(make);
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 ring-1 ring-surface-200 dark:bg-white ${className}`}>
      {logo ? <img src={logo} alt={`شعار ${make}`} className="h-full w-full object-contain" /> : <CarFront className="h-7 w-7 text-accent-500" />}
    </div>
  );
}
