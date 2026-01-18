import { forwardRef, type InputHTMLAttributes, useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { parseAmount, sanitizeInput } from '@/lib/format';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  onChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightElement, type = 'text', onChange, ...props }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = sanitizeInput(e.target.value);
        onChange?.(value);
      },
      [onChange]
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-caption text-gray-400 mb-2 font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            onChange={handleChange}
            className={cn(
              'w-full h-12 bg-bg-tertiary border border-white/10 rounded-xl',
              'text-base text-white placeholder:text-gray-600', 
              'transition-all duration-200',
              'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : 'pl-4',
              rightElement ? 'pr-20' : 'pr-4',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {(error || hint) && (
          <p className={cn('mt-1.5 text-micro', error ? 'text-error' : 'text-gray-400')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Amount Input - specialized for token amounts
interface AmountInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
  maxDecimals?: number;
  onValueChange?: (value: string, isValid: boolean) => void;
  tokenSymbol?: string;
  onMax?: () => void;
  value?: string; // Controlled value from parent
}

const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ maxDecimals = 9, onValueChange, tokenSymbol, onMax, value = '', ...props }, ref) => {
    const [inputError, setInputError] = useState<string>();

    const handleChange = useCallback(
      (newValue: string) => {
        // Only allow numbers and one decimal point
        const cleaned = newValue.replace(/[^0-9.]/g, '');
        
        // Prevent multiple decimal points
        const parts = cleaned.split('.');
        const formatted = parts.length > 2 
          ? `${parts[0]}.${parts.slice(1).join('')}`
          : cleaned;

        const { value: parsed, isValid, error } = parseAmount(formatted, maxDecimals);
        setInputError(error);
        onValueChange?.(formatted, isValid && parsed.gt(0));
      },
      [maxDecimals, onValueChange]
    );

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        error={inputError || props.error}
        placeholder="0.00"
        rightElement={
          <div className="flex items-center gap-2">
            {onMax && (
              <button
                type="button"
                onClick={onMax}
                className="text-micro text-brand hover:text-brand-glow transition-colors"
              >
                MAX
              </button>
            )}
            {tokenSymbol && (
              <span className="text-caption text-gray-400 font-medium">
                {tokenSymbol}
              </span>
            )}
          </div>
        }
        {...props}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';

export { Input, AmountInput };
