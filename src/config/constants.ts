// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token Constants
export const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
} as const;

export const LAMPORTS_PER_SOL = 1_000_000_000;

// Cache TTLs (in ms)
export const CACHE_TTL = {
  TOKENS: 60 * 1000,        // 1 minute
  PRICES: 30 * 1000,        // 30 seconds
  BALANCE: 60 * 1000,       // 1 minute
  USER: 5 * 60 * 1000,      // 5 minutes
} as const;

// Sign message for registration
export const SIGN_MESSAGE = `Welcome to Loopy!

Sign this message to verify your wallet ownership.

This signature will be used to:
• Register your account
• Enable privacy features
• Access your shielded balances

This request will not trigger a blockchain transaction or cost any gas fees.

Timestamp: `;

// Number formatting
export const FORMAT = {
  MAX_DECIMALS_SOL: 9,
  MAX_DECIMALS_USD: 2,
  MAX_DECIMALS_TOKEN: 6,
  DISPLAY_DECIMALS: 4,
} as const;
