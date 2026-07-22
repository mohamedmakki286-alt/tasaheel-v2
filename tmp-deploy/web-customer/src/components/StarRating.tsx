import { Star } from 'lucide-react';

export function StarRating({
  rating,
  onChange,
  size = 'md',
}: {
  rating: number;
  onChange?: (r: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={`${!onChange ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizes[size]} ${star <= rating ? 'fill-accent-400 text-accent-400' : 'text-surface-500'}`}
          />
        </button>
      ))}
    </div>
  );
}
