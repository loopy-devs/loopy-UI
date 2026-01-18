import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'brand';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-800 text-gray-100',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
  brand: 'bg-brand/10 text-brand border border-brand/20',
};

function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-micro font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Status dot badge
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'pending';
  label?: string;
  className?: string;
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusColors = {
    online: 'bg-success',
    offline: 'bg-gray-600',
    pending: 'bg-warning',
  };

  const statusLabels = {
    online: 'Connected',
    offline: 'Disconnected',
    pending: 'Pending',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-micro text-gray-400',
        className
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', statusColors[status])} />
      {label || statusLabels[status]}
    </span>
  );
}

// Points badge
interface PointsBadgeProps {
  points: number;
  className?: string;
}

function PointsBadge({ points, className }: PointsBadgeProps) {
  return (
    <Badge variant="brand" className={className}>
      {points.toLocaleString()} pts
    </Badge>
  );
}

// Change badge (for price changes)
interface ChangeBadgeProps {
  value: number;
  className?: string;
}

function ChangeBadge({ value, className }: ChangeBadgeProps) {
  const isPositive = value >= 0;
  
  return (
    <Badge variant={isPositive ? 'success' : 'error'} className={className}>
      {isPositive ? '+' : ''}{value.toFixed(2)}%
    </Badge>
  );
}

export { Badge, StatusBadge, PointsBadge, ChangeBadge };
