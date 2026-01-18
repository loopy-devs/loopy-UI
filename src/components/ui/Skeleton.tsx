import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse-slow rounded-lg bg-gradient-to-r from-bg-tertiary via-gray-800 to-bg-tertiary',
        'bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

// Add shimmer keyframes via style tag (will be added to index.css)
// @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

// Pre-built skeleton components
function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  
  return <Skeleton className={cn('rounded-full', sizes[size])} />;
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-5 rounded-2xl bg-bg-secondary border border-white/5', className)}>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonAvatar />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

function SkeletonBalance() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-12 w-40" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function SkeletonTokenRow() {
  return (
    <div className="flex items-center gap-3 p-4">
      <SkeletonAvatar size="lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

function SkeletonTokenList({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTokenRow key={i} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonBalance,
  SkeletonTokenRow,
  SkeletonTokenList,
};
