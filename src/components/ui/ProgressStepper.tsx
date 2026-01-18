import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createPortal } from 'react-dom';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: ProgressStep[];
  currentStep: number; // 0-indexed, -1 means not started
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className }: ProgressStepperProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isPending = index > currentStep;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            {/* Bullet indicator */}
            <div className="relative flex-shrink-0 mt-0.5">
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-5 w-5 rounded-full bg-success flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </motion.div>
              ) : isActive ? (
                <div className="relative h-5 w-5">
                  {/* Pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-brand/30"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Rotating ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  {/* Center dot */}
                  <div className="absolute inset-1 rounded-full bg-brand" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-600 bg-transparent" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isCompleted && 'text-gray-500',
                  isActive && 'text-white',
                  isPending && 'text-gray-600'
                )}
              >
                {step.label}
              </p>
              {step.description && isActive && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-gray-500 mt-0.5"
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Success modal component
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  amount?: string;
  symbol?: string;
}

export function SuccessModal({ isOpen, onClose, title, message, amount, symbol }: SuccessModalProps) {
  if (!isOpen) return null;

  // Use portal to render at document root, ensuring it covers everything
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-bg-secondary border border-white/10 rounded-3xl p-6 text-center"
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, stiffness: 100 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-14 h-14 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="h-8 w-8 text-white" />
          </motion.div>
        </motion.div>

        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        
        {amount && symbol && (
          <p className="text-2xl font-bold text-brand mb-2">
            {amount} {symbol}
          </p>
        )}
        
        <p className="text-gray-400 text-sm mb-6">{message}</p>

        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors"
        >
          Done
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}
