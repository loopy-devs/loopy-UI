import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokensAPI, pricesAPI } from '@/lib/api';
import { useCacheStore } from '@/stores/cache';
import { cn } from '@/lib/cn';
import { formatUSD } from '@/lib/format';

// Cache TTL constants - keep short to avoid stale data
const SUPPORTED_TOKENS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes (tokens don't change often)
const PRICES_CACHE_TTL = 30 * 1000; // 30 seconds (prices change more frequently)

export interface SupportedToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  supported_for_deposit: boolean;
  supported_for_withdraw: boolean;
  walletBalance?: number; // Balance in wallet (for shield mode)
  shieldedBalance?: number; // Shielded balance (for unshield mode)
}

interface WalletToken {
  address: string;
  symbol: string;
  balance: number;
  decimals: number;
}

interface TokenSelectorProps {
  selectedToken: SupportedToken | null;
  onSelect: (token: SupportedToken) => void;
  walletTokens?: WalletToken[]; // Tokens in user's wallet
  shieldedBalances?: { mint: string; balance: number }[]; // Shielded balances
  mode: 'shield' | 'unshield';
  className?: string;
}

// Price data can come in different formats from different APIs
interface PriceData {
  price?: number;
  usdPrice?: number;
}

// SOL mint addresses (there are 2 variants in the API)
const SOL_MINTS = [
  'So11111111111111111111111111111111111111112',
  '11111111111111111111111111111111',
];

export function TokenSelector({
  selectedToken,
  onSelect,
  walletTokens = [],
  shieldedBalances = [],
  mode,
  className,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allSupportedTokens, setAllSupportedTokens] = useState<SupportedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, number | PriceData>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasFetchedTokensRef = useRef(false);
  const hasFetchedPricesRef = useRef(false);

  // Get cached data (use getState to avoid re-renders)
  const setSupportedTokens = useCacheStore((s) => s.setSupportedTokens);
  const setTokenPrices = useCacheStore((s) => s.setTokenPrices);

  // Initialize from cache on mount
  useEffect(() => {
    const cache = useCacheStore.getState();
    
    // Load cached tokens immediately
    if (cache.supportedTokens?.data && cache.supportedTokens.data.length > 0) {
      setAllSupportedTokens(cache.supportedTokens.data);
      setIsLoading(false);
    }
    
    // Load cached prices immediately
    if (cache.tokenPrices?.data) {
      setPrices(cache.tokenPrices.data);
    }
  }, []); // Only run on mount

  // Fetch supported tokens (only once per component lifecycle if cache is fresh)
  useEffect(() => {
    if (hasFetchedTokensRef.current) return;
    
    const cache = useCacheStore.getState();
    
    // Check if cache is fresh
    if (cache.supportedTokens?.data && cache.supportedTokens.data.length > 0) {
      const cacheAge = Date.now() - cache.supportedTokens.timestamp;
      if (cacheAge < SUPPORTED_TOKENS_CACHE_TTL) {
        hasFetchedTokensRef.current = true;
        setIsLoading(false);
        return; // Cache is fresh, don't refetch
      }
    }

    hasFetchedTokensRef.current = true;

    const fetchTokens = async () => {
      // Only show loading if no cached data
      if (!cache.supportedTokens?.data) {
        setIsLoading(true);
      }
      
      try {
        const { data } = await tokensAPI.getSupported();
        // Filter out duplicate SOL entry and unknown duplicates
        const tokens = (data.tokens || []).filter((t: SupportedToken, index: number, arr: SupportedToken[]) => {
          // Keep only the first SOL entry
          if (SOL_MINTS.includes(t.mint)) {
            return t.mint === SOL_MINTS[0];
          }
          // Remove duplicate symbols (keep first occurrence)
          return arr.findIndex((x: SupportedToken) => x.symbol === t.symbol) === index;
        });
        setAllSupportedTokens(tokens);
        setSupportedTokens(tokens); // Cache the tokens
      } catch (err) {
       
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [setSupportedTokens]);

  // Fetch prices (only once per component lifecycle if cache is fresh)
  useEffect(() => {
    if (hasFetchedPricesRef.current) return;
    if (allSupportedTokens.length === 0) return;
    
    const cache = useCacheStore.getState();
    
    // Check if cache is fresh
    if (cache.tokenPrices?.data) {
      const cacheAge = Date.now() - cache.tokenPrices.timestamp;
      if (cacheAge < PRICES_CACHE_TTL) {
        hasFetchedPricesRef.current = true;
        return; // Cache is fresh, don't refetch
      }
    }

    hasFetchedPricesRef.current = true;

    const fetchPrices = async () => {
      try {
        const mints = allSupportedTokens.map(t => t.mint);
        const { data } = await pricesAPI.getMultiple(mints);
        
        // Normalize prices to simple number format for caching
        const normalizedPrices: Record<string, number> = {};
        for (const [mint, priceData] of Object.entries(data || {})) {
          if (typeof priceData === 'number') {
            normalizedPrices[mint] = priceData;
          } else if ((priceData as PriceData)?.price !== undefined) {
            normalizedPrices[mint] = (priceData as PriceData).price!;
          } else if ((priceData as PriceData)?.usdPrice !== undefined) {
            normalizedPrices[mint] = (priceData as PriceData).usdPrice!;
          }
        }
        
        setPrices(normalizedPrices);
        setTokenPrices(normalizedPrices); // Cache prices
      } catch (err) {
       
      }
    };

    fetchPrices();
  }, [allSupportedTokens, setTokenPrices]);

  // Filter tokens based on mode and what user actually has
  const availableTokens = useMemo((): SupportedToken[] => {
    const result: SupportedToken[] = [];
    
    // Tokens supported by ShadowWire SDK for shielding
    const SUPPORTED_SHIELD_TOKENS = ['SOL', 'USDC', 'USD1'];
    
    if (mode === 'shield') {
      // For shielding: SOL and USDC are supported by ShadowWire SDK
      for (const supportedToken of allSupportedTokens) {
        // Only allow SOL and USDC for shielding
        if (!SUPPORTED_SHIELD_TOKENS.includes(supportedToken.symbol)) {
          continue;
        }
        
        // Find matching wallet token
        const walletToken = walletTokens.find((wt) => wt.symbol === supportedToken.symbol);

        if (walletToken && walletToken.balance > 0) {
          // walletToken.balance is already in decimal format from useWalletTokens
          result.push({
            ...supportedToken,
            walletBalance: walletToken.balance,
          });
        }
      }
    } else {
      // For unshielding: only show supported tokens that have shielded balance > 0
      for (const supportedToken of allSupportedTokens) {
        const shielded = shieldedBalances.find((sb) => {
          if (supportedToken.symbol === 'SOL' && sb.mint === 'SOL') {
            return true;
          }
          return sb.mint === supportedToken.mint;
        });

        if (shielded && shielded.balance > 0) {
          result.push({
            ...supportedToken,
            shieldedBalance: shielded.balance,
          });
        }
      }
    }
    
    return result;
  }, [allSupportedTokens, walletTokens, shieldedBalances, mode]);

  // Auto-select the token with highest balance if none selected
  useEffect(() => {
    if (availableTokens.length === 0) return;
    
    // Find the token with the highest balance
    const getTokenBalance = (token: SupportedToken) => {
      return mode === 'shield' ? (token.walletBalance || 0) : (token.shieldedBalance || 0);
    };
    
    const highestBalanceToken = availableTokens.reduce((highest, current) => {
      return getTokenBalance(current) > getTokenBalance(highest) ? current : highest;
    }, availableTokens[0]);
    
    if (selectedToken) {
      // Check if selected token is still available
      const updatedToken = availableTokens.find((t) => t.mint === selectedToken.mint || t.symbol === selectedToken.symbol);
      
      if (updatedToken) {
        // Token still available - update if balance changed
        const currentBalance = getTokenBalance(selectedToken);
        const newBalance = getTokenBalance(updatedToken);
        
        if (currentBalance !== newBalance) {
          onSelect(updatedToken);
        }
      } else {
        // Token no longer available - select highest balance token
        onSelect(highestBalanceToken);
      }
    } else {
      // No token selected - select highest balance token
      onSelect(highestBalanceToken);
    }
  }, [availableTokens, selectedToken, onSelect, mode]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (token: SupportedToken) => {
    onSelect(token);
    setIsOpen(false);
  };

  const getBalanceInfo = (token: SupportedToken) => {
    let balance = 0;
    if (mode === 'shield' && token.walletBalance !== undefined) {
      balance = token.walletBalance;
    } else if (mode === 'unshield' && token.shieldedBalance !== undefined) {
      balance = token.shieldedBalance;
    } else {
      return null;
    }
    
    // Handle different price response formats (SolanaTracker vs Jupiter)
    const priceData = prices[token.mint];
    let price = 0;
    if (typeof priceData === 'number') {
      price = priceData;
    } else if (priceData?.price !== undefined) {
      price = priceData.price;
    } else if (priceData?.usdPrice !== undefined) {
      price = priceData.usdPrice;
    }
    
    const usdValue = balance * price;
    
    return { balance, usdValue };
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || availableTokens.length === 0}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl w-full',
          'bg-bg-tertiary border border-white/10',
          'hover:border-brand/30 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand/30',
          isOpen && 'border-brand/50 ring-2 ring-brand/20',
          (isLoading || availableTokens.length === 0) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selectedToken ? (
          <>
            <img
              src={selectedToken.logo}
              alt={selectedToken.symbol}
              className="h-8 w-8 rounded-full bg-bg-secondary"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedToken.symbol}&background=1a1a24&color=fff&size=32`;
              }}
            />
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">{selectedToken.symbol}</p>
              <p className="text-xs text-gray-500">{selectedToken.name}</p>
            </div>
            {getBalanceInfo(selectedToken) && (
              <div className="text-right">
                <p className="text-sm font-medium text-white">
                  {getBalanceInfo(selectedToken)!.balance.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUSD(getBalanceInfo(selectedToken)!.usdValue)}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 text-left">
            <p className="text-gray-400">
              {isLoading ? 'Loading...' : availableTokens.length === 0 ? 'No tokens available' : 'Select token'}
            </p>
          </div>
        )}
        <ChevronDown
          className={cn(
            'h-5 w-5 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && availableTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full left-0 right-0 mt-2 z-50',
              'bg-bg-secondary border border-white/10 rounded-xl',
              'shadow-lg shadow-black/30 overflow-hidden'
            )}
          >
            <div className="max-h-64 overflow-y-auto py-2">
              {availableTokens.map((token) => (
                <button
                  key={token.mint}
                  onClick={() => handleSelect(token)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3',
                    'hover:bg-white/5 transition-colors duration-150',
                    selectedToken?.mint === token.mint && 'bg-brand/10'
                  )}
                >
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="h-8 w-8 rounded-full bg-bg-tertiary"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=1a1a24&color=fff&size=32`;
                    }}
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-500">{token.name}</p>
                  </div>
                  {getBalanceInfo(token) && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {getBalanceInfo(token)!.balance.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatUSD(getBalanceInfo(token)!.usdValue)}
                      </p>
                    </div>
                  )}
                  {selectedToken?.mint === token.mint && (
                    <Check className="h-5 w-5 text-brand ml-2" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook to use supported tokens
export function useSupportedTokens() {
  const [tokens, setTokens] = useState<SupportedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const { data } = await tokensAPI.getSupported();
        setTokens(data.tokens || []);
      } catch (err) {
      
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, isLoading };
}
