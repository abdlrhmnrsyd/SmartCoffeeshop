import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon = Coffee, 
  title, 
  description, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-2xl shadow-2xs max-w-md mx-auto my-6">
      <div className="bg-muted p-4 rounded-full text-muted-foreground mb-4">
        <Icon className="h-8 w-8 text-primary/70" />
      </div>
      <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} size="sm" className="font-semibold">
          {actionText}
        </Button>
      )}
    </div>
  );
}
