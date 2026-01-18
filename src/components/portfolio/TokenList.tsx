import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { formatNumber, formatUSD } from '@/lib/format';
import { SkeletonTokenList } from '@/components/ui/Skeleton';
import { ChangeBadge } from '@/components/ui/Badge';

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  logo?: string;
  priceChange24h?: number;
}

interface TokenListProps {
  tokens: Token[];
  walletAddress?: string;
  isLoading?: boolean;
  emptyMessage?: string;
}

const MAX_TOKENS = 10;
const VISIBLE_DESKTOP = 6;
const VISIBLE_MOBILE = 2;

export default function TokenList({ 
  tokens, 
  walletAddress,
  isLoading, 
  emptyMessage = 'No tokens found' 
}: TokenListProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-bg-secondary border border-white/5 overflow-hidden">
        <SkeletonTokenList count={5} />
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="rounded-2xl bg-bg-secondary border border-white/5 p-8 text-center">
        <p className="text-gray-400 text-caption">{emptyMessage}</p>
      </div>
    );
  }

  // Limit to max tokens
  const displayTokens = tokens.slice(0, MAX_TOKENS);
  
  // Check if scrolling is needed
  const needsScrollMobile = displayTokens.length > VISIBLE_MOBILE;
  const needsScrollDesktop = displayTokens.length > VISIBLE_DESKTOP;

  const handleViewAll = () => {
    if (walletAddress) {
      // Open Solscan wallet explorer
      window.open(`https://solscan.io/account/${walletAddress}`, '_blank');
    }
  };

  return (
    <div className="rounded-2xl bg-bg-secondary border border-white/5 overflow-hidden">
      {/* Custom scrollbar styles */}
      <style>{`
        .token-list-scroll {
          scrollbar-width: thin;
          scrollbar-color: #3B82F6 transparent;
        }
        .token-list-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .token-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .token-list-scroll::-webkit-scrollbar-thumb {
          background: #3B82F6;
          border-radius: 3px;
        }
        .token-list-scroll::-webkit-scrollbar-thumb:hover {
          background: #60A5FA;
        }
      `}</style>
      
      {/* Token list with responsive visibility */}
      <div 
        className={`divide-y divide-white/5 ${needsScrollMobile ? 'overflow-y-auto token-list-scroll lg:overflow-y-hidden' : 'overflow-hidden'} ${needsScrollDesktop ? 'lg:overflow-y-auto lg:token-list-scroll' : ''}`}
        style={{
          // Only set max height if scrolling is needed
          maxHeight: needsScrollMobile || needsScrollDesktop 
            ? `${VISIBLE_MOBILE * 70}px` 
            : 'none',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .token-list-scroll {
              max-height: ${needsScrollDesktop ? `${VISIBLE_DESKTOP * 70}px` : 'none'} !important;
            }
          }
        `}</style>
        {displayTokens.map((token, index) => (
          <TokenRow key={token.address} token={token} index={index} />
        ))}
      </div>

      {/* View All button */}
      {walletAddress && (
        <button
          onClick={handleViewAll}
          className="w-full py-3 px-4 flex items-center justify-center gap-2 text-sm text-brand hover:text-brand-light transition-colors border-t border-white/5 hover:bg-bg-tertiary/30"
        >
          <span>View all on Explorer</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function TokenRow({ token, index }: { token: Token; index: number }) {
  const displayBalance = token.balance;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 p-4 hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
    >
      {/* Token icon */}
      <div className="relative h-11 w-11 rounded-full bg-bg-tertiary flex items-center justify-center overflow-hidden flex-shrink-0">
        {token.logo ? (
          <img
            src={token.logo}
            alt={token.symbol}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-body font-bold text-gray-400">
            {token.symbol.charAt(0)}
          </span>
        )}
      </div>

      {/* Token info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-semibold text-white truncate">
            {token.symbol}
          </span>
          {token.priceChange24h !== undefined && (
            <ChangeBadge value={token.priceChange24h} />
          )}
        </div>
        <p className="text-caption text-gray-400 truncate">{token.name}</p>
      </div>

      {/* Balance */}
      <div className="text-right flex-shrink-0">
        <p className="text-body font-semibold text-white">
          {formatNumber(displayBalance)} <span className="text-gray-400">{token.symbol}</span>
        </p>
        <p className="text-caption text-gray-400">
          {formatUSD(token.usdValue)}
        </p>
      </div>
    </motion.div>
  );
}
