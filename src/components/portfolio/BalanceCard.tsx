import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { useState } from 'react';
import { formatUSD, formatPercentage } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';

interface BalanceCardProps {
  totalBalance: number;
  change24h?: number;
  shieldedBalance?: number;
  isLoading?: boolean;
}

export default function BalanceCard({ 
  totalBalance, 
  change24h = 0, 
  shieldedBalance = 0,
  isLoading 
}: BalanceCardProps) {
  const [isHidden, setIsHidden] = useState(false);
  const isPositive = change24h >= 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-secondary to-brand/5 border border-white/5 p-6 lg:p-8"
      >
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-bg-secondary via-bg-secondary to-brand/5 border border-white/5"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand/3 rounded-full blur-2xl" />
        
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="balance-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#fff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#balance-grid)" />
        </svg>
      </div>

      <div className="relative p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Balance
          </span>
          <button
            onClick={() => setIsHidden(!isHidden)}
            className="p-2 -m-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Balance */}
        <div className="mb-5">
          <h2 className="text-4xl lg:text-5xl text-white font-bold tracking-tight">
            {isHidden ? '••••••••' : formatUSD(totalBalance)}
          </h2>
          
          {/* Change */}
          <div className={cn(
            'flex items-center gap-2 mt-2',
            isPositive ? 'text-success' : 'text-error'
          )}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isHidden ? '••••' : formatPercentage(change24h)}
            </span>
            <span className="text-gray-500 text-sm">24h</span>
          </div>
        </div>

        {/* Shielded balance indicator */}
        {shieldedBalance > 0 && (
          <div className="flex items-center gap-3 pt-5 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <Shield className="h-4 w-4 text-brand" />
            </div>
            <span className="text-sm text-gray-400">
              {isHidden ? '••••••' : formatUSD(shieldedBalance)} <span className="text-gray-600">shielded</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
