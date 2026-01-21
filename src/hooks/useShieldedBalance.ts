import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { balanceAPI } from '@/lib/api';
import { useCacheStore } from '@/stores/cache';

// Auto-refresh interval in ms (30 seconds)
const REFRESH_INTERVAL = 30000;

interface ShieldedBalance {
  sol: number;
  solLamports?: number;
  tokens: Array<{
    mint: string;
    balance: number;
    balanceFormatted?: number;
    symbol: string;
    decimals?: number;
  }>;
  totalUsd?: number;
}

export function useShieldedBalance() {
  const { address } = useAppKitAccount();
  const isFetchingRef = useRef(false);
  
  // Initialize local balance state from cache IMMEDIATELY (synchronous)
  const [localBalance, setLocalBalance] = useState<ShieldedBalance | null>(() => {
    return useCacheStore.getState().shieldedBalance?.data || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get store functions
  const setShieldedBalance = useCacheStore((state) => state.setShieldedBalance);
  const invalidateShielded = useCacheStore((state) => state.invalidateShielded);
  
  // Subscribe to cache changes to keep local state in sync
  const cachedBalance = useCacheStore((state) => state.shieldedBalance);
  
  // Sync local state when cache updates (from other components)
  useEffect(() => {
    if (cachedBalance?.data) {
      setLocalBalance(cachedBalance.data);
    }
  }, [cachedBalance]);

  const fetchBalance = useCallback(async (showLoader: boolean) => {
    if (!address) return;
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;

    // Only show loader if we have no data at all
    if (showLoader && !localBalance) {
      setIsLoading(true);
    }

    try {
      const { data } = await balanceAPI.getAll(address);
      
      const balance: ShieldedBalance = {
        sol: data.balances?.sol?.balance_formatted || 0,
        solLamports: data.balances?.sol?.balance || 0,
        tokens: [
          {
            mint: data.balances?.usdc?.mint,
            balance: data.balances?.usdc?.balance || 0,
            balanceFormatted: data.balances?.usdc?.balance_formatted || 0,
            symbol: 'USDC',
            decimals: 6,
          },
          {
            mint: data.balances?.usdt?.mint,
            balance: data.balances?.usdt?.balance || 0,
            balanceFormatted: data.balances?.usdt?.balance_formatted || 0,
            symbol: 'USDT',
            decimals: 6,
          },
        ].filter(t => t.balance > 0),
        totalUsd: 0,
      };

      setLocalBalance(balance);
      setShieldedBalance(balance);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [address, localBalance, setShieldedBalance]);

  // Fetch on mount only if no cached data
  useEffect(() => {
    if (!address) return;
    
    // Background refresh - don't show loader if we already have data
    fetchBalance(!localBalance);
  }, [address]); // Only run on address change, not on every render

  // Auto-refresh every 30 seconds in background
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      fetchBalance(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  return {
    balance: localBalance,
    isLoading: isLoading && !localBalance,
    error,
    refresh: () => fetchBalance(false),
    invalidate: invalidateShielded,
  };
}
