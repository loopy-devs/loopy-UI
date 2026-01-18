import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-brand text-white
    hover:bg-brand-glow hover:shadow-glow
    active:bg-brand-dark
    disabled:bg-brand/50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-bg-tertiary text-white
    hover:bg-gray-600
    active:bg-gray-800
    disabled:bg-bg-tertiary/50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-gray-100
    hover:bg-bg-tertiary hover:text-white
    active:bg-bg-secondary
    disabled:text-gray-600 disabled:cursor-not-allowed
  `,
  outline: `
    bg-transparent text-brand border border-brand/50
    hover:bg-brand/10 hover:border-brand
    active:bg-brand/20
    disabled:border-brand/30 disabled:text-brand/50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-error/10 text-error border border-error/30
    hover:bg-error/20 hover:border-error
    active:bg-error/30
    disabled:bg-error/5 disabled:text-error/50 disabled:cursor-not-allowed
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-caption rounded-lg',
  md: 'h-10 px-4 text-body rounded-xl',
  lg: 'h-12 px-6 text-body rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };
