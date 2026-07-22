import { PackageOpen } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <PackageOpen className="h-16 w-16 text-surface-500 mb-4" />
      <h3 className="text-lg font-semibold text-surface-300">{title}</h3>
      {description && <p className="text-surface-400 mt-1">{description}</p>}
    </div>
  );
}
