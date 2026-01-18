import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
  animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, animate = true, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-200';
    
    const variants = {
      default: 'bg-bg-secondary border border-white/5',
      elevated: 'bg-bg-secondary shadow-card border border-white/5',
      glass: 'glass',
    };

    const hoverStyles = hover
      ? 'hover:border-brand/20 hover:shadow-glow cursor-pointer'
      : '';

    const animateStyles = animate ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, animateStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-5 py-4 border-b border-white/5', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// Card Content
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// Card Title
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-h2 text-white font-semibold', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export { Card, CardHeader, CardContent, CardTitle };
