import BigNumber from 'bignumber.js';
import { FORMAT, LAMPORTS_PER_SOL } from '@/config/constants';

// Configure BigNumber
BigNumber.config({
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-20, 20],
});

/**
 * Format a number with proper decimal handling
 */
export function formatNumber(
  value: number | string | BigNumber,
  decimals: number = FORMAT.DISPLAY_DECIMALS
): string {
  const bn = new BigNumber(value);
  if (bn.isNaN() || !bn.isFinite()) return '0';
  
  // Remove trailing zeros
  return bn.toFixed(decimals).replace(/\.?0+$/, '') || '0';
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format large USD values (compact)
 */
export function formatUSDCompact(value: number): string {
  if (value >= 1_000_000) {
    return `$${formatNumber(value / 1_000_000)}M`;
  }
  if (value >= 1_000) {
    return `$${formatNumber(value / 1_000)}K`;
  }
  return formatUSD(value);
}

/**
 * Format token balance (with symbol)
 */
export function formatTokenBalance(
  balance: number | string,
  decimals: number,
  symbol?: string
): string {
  const bn = new BigNumber(balance).dividedBy(new BigNumber(10).pow(decimals));
  const formatted = formatNumber(bn, FORMAT.DISPLAY_DECIMALS);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | string): BigNumber {
  return new BigNumber(lamports).dividedBy(LAMPORTS_PER_SOL);
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number | string): BigNumber {
  return new BigNumber(sol).multipliedBy(LAMPORTS_PER_SOL);
}

/**
 * Convert token amount to smallest unit
 */
export function toSmallestUnit(amount: number | string, decimals: number): BigNumber {
  return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals));
}

/**
 * Convert from smallest unit to display amount
 */
export function fromSmallestUnit(amount: number | string, decimals: number): BigNumber {
  return new BigNumber(amount).dividedBy(new BigNumber(10).pow(decimals));
}

/**
 * Format percentage change
 */
export function formatPercentage(value: number, includeSign = true): string {
  const formatted = Math.abs(value).toFixed(2);
  if (!includeSign) return `${formatted}%`;
  
  if (value > 0) return `+${formatted}%`;
  if (value < 0) return `-${formatted}%`;
  return `${formatted}%`;
}

/**
 * Truncate wallet address
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Parse and validate amount input
 */
export function parseAmount(
  input: string,
  maxDecimals: number
): { value: BigNumber; isValid: boolean; error?: string } {
  // Sanitize input
  const sanitized = input.replace(/[^0-9.]/g, '');
  
  // Check for multiple decimals
  if ((sanitized.match(/\./g) || []).length > 1) {
    return { value: new BigNumber(0), isValid: false, error: 'Invalid number' };
  }
  
  // Check decimal places
  const parts = sanitized.split('.');
  if (parts[1] && parts[1].length > maxDecimals) {
    return {
      value: new BigNumber(0),
      isValid: false,
      error: `Maximum ${maxDecimals} decimal places`,
    };
  }
  
  const value = new BigNumber(sanitized || 0);
  
  if (value.isNaN()) {
    return { value: new BigNumber(0), isValid: false, error: 'Invalid number' };
  }
  
  if (value.isNegative()) {
    return { value: new BigNumber(0), isValid: false, error: 'Must be positive' };
  }
  
  return { value, isValid: true };
}

/**
 * Sanitize text input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}
