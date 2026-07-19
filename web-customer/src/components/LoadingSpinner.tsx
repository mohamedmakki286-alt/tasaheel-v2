export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`${sizes[size]} border-4 border-surface-600 border-t-accent-500 rounded-full animate-spin`} />
    </div>
  );
}
