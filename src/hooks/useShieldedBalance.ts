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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  // Get store values - always call in same order, use stable selectors
  const shieldedBalance = useCacheStore((state) => state.shieldedBalance);
  const setShieldedBalance = useCacheStore((state) => state.setShieldedBalance);
  const invalidateShielded = useCacheStore((state) => state.invalidateShielded);

  // Get display balance (cached data)
  const displayBalance = shieldedBalance?.data || null;
  
  // Use ref to track displayBalance for use in callback without dependency
  const displayBalanceRef = useRef(displayBalance);
  displayBalanceRef.current = displayBalance;

  const fetchBalance = useCallback(async (showLoader: boolean) => {
    if (!address) return;
    if (isFetchingRef.current) return; // Prevent concurrent fetches
    
    isFetchingRef.current = true;

    if (showLoader && !displayBalanceRef.current) {
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

      setShieldedBalance(balance);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [address, setShieldedBalance]);

  // Initial fetch on mount
  useEffect(() => {
    if (!address) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    if (!displayBalance) {
      fetchBalance(true);
    } else {
      fetchBalance(false);
    }
  }, [address, displayBalance, fetchBalance]);

  // Auto-refresh every 30 seconds in background
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      fetchBalance(false); // Background refresh, no loader
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  // Reset on address change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [address]);

  return {
    balance: displayBalance,
    isLoading: isLoading && !displayBalance,
    error,
    refresh: () => fetchBalance(false),
    invalidate: invalidateShielded,
  };
}
