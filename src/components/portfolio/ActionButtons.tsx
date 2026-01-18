import { motion } from 'framer-motion';
import { Shield, ArrowLeftRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

const actions = [
  {
    icon: Shield,
    label: 'Shield',
    path: '/shield',
    gradient: 'from-brand/20 to-brand/5',
    iconColor: 'text-brand',
    borderColor: 'border-brand/20',
  },
  {
    icon: ArrowLeftRight,
    label: 'Swap',
    path: '/swap',
    gradient: 'from-success/20 to-success/5',
    iconColor: 'text-success',
    borderColor: 'border-success/20',
  },
  {
    icon: ArrowUpRight,
    label: 'Send',
    path: '/send',
    gradient: 'from-warning/20 to-warning/5',
    iconColor: 'text-warning',
    borderColor: 'border-warning/20',
  },
  {
    icon: ArrowDownLeft,
    label: 'Receive',
    path: '/receive',
    gradient: 'from-gray-800 to-gray-900',
    iconColor: 'text-gray-300',
    borderColor: 'border-white/10',
  },
];

export default function ActionButtons() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3 lg:gap-4">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(action.path)}
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-4 lg:p-5 rounded-2xl border transition-all duration-300',
            'bg-gradient-to-br hover:shadow-lg',
            action.gradient,
            action.borderColor
          )}
        >
          <action.icon className={cn('h-6 w-6 lg:h-7 lg:w-7', action.iconColor)} />
          <span className="text-xs lg:text-sm font-semibold text-white">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
