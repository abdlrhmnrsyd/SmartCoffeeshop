import { Coffee } from 'lucide-react';

export function Loader({ size = 'md', text = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const spinnerSizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer animated ring */}
        <div className={`animate-spin rounded-full border-primary border-t-transparent ${spinnerSizes[size]}`} />
        {/* Inner Coffee Icon (only for medium or large) */}
        {size !== 'sm' && (
          <Coffee className={`absolute text-primary/60 animate-pulse ${size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'}`} />
        )}
      </div>
      {text && <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}
