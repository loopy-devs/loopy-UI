import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { pricesAPI } from '@/lib/api';
import { useCacheStore } from '@/stores/cache';

// Auto-refresh interval in ms (30 seconds)
const REFRESH_INTERVAL = 30000;

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  logo?: string;
  priceUsd?: number;
  priceChange24h?: number;
}

export function useWalletTokens() {
  const { address } = useAppKitAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  // Get store values - always call in same order, use stable selectors
  const tokens = useCacheStore((state) => state.tokens);
  const setTokens = useCacheStore((state) => state.setTokens);
  const invalidateTokens = useCacheStore((state) => state.invalidateTokens);

  // Get display tokens (cached data)
  const displayTokens = tokens?.data || null;
  
  // Use ref to track displayTokens for use in callback without dependency
  const displayTokensRef = useRef(displayTokens);
  displayTokensRef.current = displayTokens;

  const fetchTokens = useCallback(async (showLoader: boolean) => {
    if (!address) return;
    if (isFetchingRef.current) return; // Prevent concurrent fetches
    
    isFetchingRef.current = true;

    // Only show loading if no cached data exists
    if (showLoader && !displayTokensRef.current) {
      setIsLoading(true);
    }

    try {
      const { data } = await pricesAPI.getWallet(address);
      
      const fetchedTokens: TokenBalance[] = (data.tokens || []).map((t: any) => ({
        address: t.address,
        symbol: t.token?.symbol || 'UNKNOWN',
        name: t.token?.name || 'Unknown Token',
        balance: t.balance || 0,
        decimals: t.token?.decimals || 9,
        usdValue: t.value || 0,
        logo: t.token?.image,
        priceUsd: t.price?.usd,
        priceChange24h: t.priceChange24h,
      }));

      // Sort by USD value
      fetchedTokens.sort((a, b) => b.usdValue - a.usdValue);
      
      setTokens(fetchedTokens);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [address, setTokens]);

  // Initial fetch on mount
  useEffect(() => {
    if (!address) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    if (!displayTokens) {
      // No cache - fetch with loader
      fetchTokens(true);
    } else {
      // Cache exists - refresh in background
      fetchTokens(false);
    }
  }, [address, displayTokens, fetchTokens]);

  // Auto-refresh every 30 seconds in background
  useEffect(() => {
    if (!address) return;
    
    const interval = setInterval(() => {
      fetchTokens(false); // Background refresh, no loader
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [address, fetchTokens]);

  // Reset on address change
  useEffect(() => {
    hasFetchedRef.current = false;
  }, [address]);

  // Calculate totals
  const totalUsdValue = displayTokens?.reduce((sum, t) => sum + t.usdValue, 0) || 0;

  return {
    tokens: displayTokens || [],
    totalUsdValue,
    isLoading: isLoading && !displayTokens,
    error,
    refresh: () => fetchTokens(false),
    invalidate: invalidateTokens,
  };
}
