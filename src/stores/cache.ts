import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  logo?: string;
  priceUsd?: number;
}

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

interface SupportedToken {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  supported_for_deposit: boolean;
  supported_for_withdraw: boolean;
}

// ShadowWire SDK balance format
interface ShadowWireBalance {
  available: number;
  deposited: number;
  pool_address: string;
}

type ShadowWireBalances = Record<string, ShadowWireBalance | null>;

interface CacheState {
  // Wallet tokens
  tokens: CacheEntry<TokenBalance[]> | null;
  setTokens: (tokens: TokenBalance[]) => void;

  // Shielded balances  
  shieldedBalance: CacheEntry<ShieldedBalance> | null;
  setShieldedBalance: (balance: ShieldedBalance) => void;

  // ShadowWire SDK balances (SOL, USDC, USD1)
  shadowWireBalances: CacheEntry<ShadowWireBalances> | null;
  setShadowWireBalances: (balances: ShadowWireBalances) => void;

  // Supported tokens (from API)
  supportedTokens: CacheEntry<SupportedToken[]> | null;
  setSupportedTokens: (tokens: SupportedToken[]) => void;

  // Token prices
  tokenPrices: CacheEntry<Record<string, number>> | null;
  setTokenPrices: (prices: Record<string, number>) => void;

  // First load flags
  hasLoadedTokens: boolean;
  hasLoadedShielded: boolean;
  hasLoadedSupportedTokens: boolean;

  // Invalidate
  invalidateTokens: () => void;
  invalidateShielded: () => void;
  invalidateShadowWireBalances: () => void;
  invalidateSupportedTokens: () => void;
  invalidateAll: () => void;
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set) => ({
      tokens: null,
      shieldedBalance: null,
      shadowWireBalances: null,
      supportedTokens: null,
      tokenPrices: null,
      hasLoadedTokens: false,
      hasLoadedShielded: false,
      hasLoadedSupportedTokens: false,

      setTokens: (tokens) =>
        set({
          tokens: { data: tokens, timestamp: Date.now() },
          hasLoadedTokens: true,
        }),

      setShieldedBalance: (balance) =>
        set({
          shieldedBalance: { data: balance, timestamp: Date.now() },
          hasLoadedShielded: true,
        }),

      setShadowWireBalances: (balances) =>
        set({
          shadowWireBalances: { data: balances, timestamp: Date.now() },
        }),

      setSupportedTokens: (tokens) =>
        set({
          supportedTokens: { data: tokens, timestamp: Date.now() },
          hasLoadedSupportedTokens: true,
        }),

      setTokenPrices: (prices) =>
        set({
          tokenPrices: { data: prices, timestamp: Date.now() },
        }),

      invalidateTokens: () => set({ tokens: null, hasLoadedTokens: false }),
      invalidateShielded: () => set({ shieldedBalance: null, hasLoadedShielded: false }),
      invalidateShadowWireBalances: () => set({ shadowWireBalances: null }),
      invalidateSupportedTokens: () => set({ supportedTokens: null, hasLoadedSupportedTokens: false }),
      invalidateAll: () =>
        set({
          tokens: null,
          shieldedBalance: null,
          shadowWireBalances: null,
          supportedTokens: null,
          tokenPrices: null,
          hasLoadedTokens: false,
          hasLoadedShielded: false,
          hasLoadedSupportedTokens: false,
        }),
    }),
    {
      name: 'loopy-cache',
      partialize: (state) => ({
        tokens: state.tokens,
        shieldedBalance: state.shieldedBalance,
        shadowWireBalances: state.shadowWireBalances,
        supportedTokens: state.supportedTokens,
        tokenPrices: state.tokenPrices,
        hasLoadedTokens: state.hasLoadedTokens,
        hasLoadedShielded: state.hasLoadedShielded,
        hasLoadedSupportedTokens: state.hasLoadedSupportedTokens,
      }),
    }
  )
);
