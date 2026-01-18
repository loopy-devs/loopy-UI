import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useCacheStore } from '@/stores/cache';

// Cache TTL for shielded balances - keep short to avoid stale data
const SHIELDED_BALANCE_CACHE_TTL = 5 * 1000; // 5 seconds only

// Dynamic import to handle CommonJS module
let ShadowWireClientClass: any = null;
let initWASMFn: any = null;
let isWASMSupportedFn: any = null;

import('@radr/shadowwire').then((mod) => {
  ShadowWireClientClass = mod.ShadowWireClient || mod.default?.ShadowWireClient;
  initWASMFn = mod.initWASM;
  isWASMSupportedFn = mod.isWASMSupported;
  console.log('[ShadowWire] SDK loaded, WASM supported:', isWASMSupportedFn?.());
}).catch((err) => {
  console.error('Failed to load ShadowWire SDK:', err);
});

// Supported tokens - from SDK constants
export type SupportedToken = 'SOL' | 'USDC' | 'USD1';

export const TOKEN_CONFIG: Record<SupportedToken, { decimals: number; mint: string; minDeposit: number; minWithdraw: number; minTransfer: number }> = {
  SOL: { 
    decimals: 9, 
    mint: 'Native',
    minDeposit: 0.11, // 0.11 SOL
    minWithdraw: 0.1, // 0.1 SOL minimum withdraw
    minTransfer: 0.105, // 0.105 SOL (0.1 + 1% fee buffer)
  },
  USDC: { 
    decimals: 6, 
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    minDeposit: 1, // $1 USDC
    minWithdraw: 1, // $1 USDC minimum withdraw
    minTransfer: 1.01, // $1 + 1% fee
  },
  USD1: { 
    decimals: 6, // Assuming 6 decimals like USDC
    mint: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB',
    minDeposit: 1, // $1 USD1
    minWithdraw: 1, // $1 USD1 minimum withdraw
    minTransfer: 1.01, // $1 + 1% fee
  },
};

interface TransferResult {
  tx_signature: string;
  amount_hidden: boolean;
}

interface TokenBalance {
  available: number; // In smallest unit (lamports/micro-USDC)
  deposited: number;
  pool_address: string;
}

interface ShadowWireHook {
  client: any | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  balances: Record<SupportedToken, TokenBalance | null>;
  deposit: (amount: number, token?: SupportedToken) => Promise<{ transaction: string; recent_blockhash: string; last_valid_block_height: number }>;
  withdraw: (amount: number, token?: SupportedToken) => Promise<{ transaction: string; recent_blockhash: string; last_valid_block_height: number }>;
  transfer: (
    recipient: string,
    amount: number,
    type: 'internal' | 'external',
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    token?: SupportedToken
  ) => Promise<TransferResult>;
  manualTransfer: (
    recipient: string,
    amount: number
  ) => Promise<TransferResult>;
  refreshBalance: (token?: SupportedToken, force?: boolean) => Promise<void>;
  // Legacy support
  balance: TokenBalance | null;
}

export function useShadowWire(): ShadowWireHook {
  const { address } = useAppKitAccount();
  const [client, setClient] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<SupportedToken, TokenBalance | null>>({
    SOL: null,
    USDC: null,
    USD1: null,
  });
  const initRef = useRef(false);

  // Initialize client
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initClient = async () => {
      // Wait for dynamic import to complete
      let attempts = 0;
      while (!ShadowWireClientClass && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
      }

      if (!ShadowWireClientClass) {
        setError('ShadowWire SDK failed to load');
        return;
      }

      try {
        const shadowClient = new ShadowWireClientClass({ debug: true });
        setClient(shadowClient);
        
        // Initialize WASM for client-side proofs (required for transferWithClientProofs)
        if (isWASMSupportedFn?.()) {
          console.log('[ShadowWire] Initializing WASM for client-side proofs...');
          try {
            // Try with custom path first (for Vite), then default
            await initWASMFn?.('/wasm/settler_wasm_bg.wasm');
            console.log('[ShadowWire] WASM initialized successfully');
          } catch (wasmErr: any) {
            console.warn('[ShadowWire] Custom WASM path failed, trying default:', wasmErr.message);
            try {
              await initWASMFn?.();
              console.log('[ShadowWire] WASM initialized with default path');
            } catch (wasmErr2: any) {
              console.warn('[ShadowWire] WASM initialization failed (will use backend proofs):', wasmErr2.message);
            }
          }
        } else {
          console.warn('[ShadowWire] WASM not supported in this browser');
        }
        
        setIsReady(true);
        console.log('[ShadowWire] Client initialized');
      } catch (err: any) {
        console.error('[ShadowWire] Failed to initialize:', err);
        setError(err.message);
      }
    };

    initClient();
  }, []);

  // Get cache functions
  const setShadowWireBalances = useCacheStore((s) => s.setShadowWireBalances);
  
  // Subscribe to cache changes to get updates when cache is invalidated
  const cachedBalances = useCacheStore((s) => s.shadowWireBalances);
  
  // Sync local state with cache when cache changes
  useEffect(() => {
    if (cachedBalances?.data) {
      console.log('[ShadowWire] Cache updated, syncing to local state:', cachedBalances.data);
      setBalances(cachedBalances.data as Record<SupportedToken, TokenBalance | null>);
    }
  }, [cachedBalances]);

  // Fetch balance for a specific token or all tokens
  const refreshBalance = useCallback(async (token?: SupportedToken, force = false) => {
    if (!client || !address) {
      console.warn('[ShadowWire] refreshBalance called but client or address not ready');
      return;
    }

    // If force=true, skip ALL cache checks
    if (!force) {
      const cache = useCacheStore.getState();
      if (cache.shadowWireBalances?.data) {
        const cacheAge = Date.now() - cache.shadowWireBalances.timestamp;
        if (cacheAge < SHIELDED_BALANCE_CACHE_TTL) {
          console.log('[ShadowWire] Cache is fresh, skipping refresh');
          return; // Cache is fresh, don't refetch
        }
      }
    }

    console.log('[ShadowWire] Refreshing balances...', { token, force });

    try {
      setIsLoading(true);
      
      const tokensToFetch: SupportedToken[] = token ? [token] : ['SOL', 'USDC', 'USD1'];
      
      // Start fresh - don't copy old balances
      const newBalances: Record<string, TokenBalance | null> = {
        SOL: null,
        USDC: null,
        USD1: null,
      };
      
      for (const t of tokensToFetch) {
        try {
          console.log(`[ShadowWire] Fetching ${t} balance...`);
          const bal = await client.getBalance(address, t);
          console.log(`[ShadowWire] ${t} balance:`, bal);
          newBalances[t] = {
            available: bal.available || 0,
            deposited: bal.deposited || 0,
            pool_address: bal.pool_address || '',
          };
        } catch (tokenErr: any) {
          console.warn(`[ShadowWire] Failed to fetch ${t} balance:`, tokenErr.message);
          // Keep null for failed tokens
        }
      }
      
      console.log('[ShadowWire] Setting new balances:', newBalances);
      setBalances(newBalances as Record<SupportedToken, TokenBalance | null>);
      setShadowWireBalances(newBalances); // Cache the balances
    } catch (err: any) {
      console.error('[ShadowWire] Balance fetch failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [client, address, setShadowWireBalances]);

  // Fetch balances on ready
  useEffect(() => {
    if (isReady && address) {
      // Check if cache needs refresh
      const cache = useCacheStore.getState();
      const needsFetch = !cache.shadowWireBalances?.data || 
        (Date.now() - cache.shadowWireBalances.timestamp) > SHIELDED_BALANCE_CACHE_TTL;
      
      if (needsFetch) {
        console.log('[ShadowWire] Auto-fetching balances on ready...');
        refreshBalance();
      }
    }
  }, [isReady, address, refreshBalance]);

  // Deposit - supports SOL and USDC
  const deposit = useCallback(async (amount: number, token: SupportedToken = 'SOL') => {
    if (!client || !address) {
      throw new Error('Client not ready or wallet not connected');
    }

    const config = TOKEN_CONFIG[token];
    const minDepositSmallestUnit = config.minDeposit * Math.pow(10, config.decimals);
    
    if (amount < minDepositSmallestUnit) {
      throw new Error(`Minimum deposit is ${config.minDeposit} ${token} (anti-spam protection)`);
    }

    console.log(`[ShadowWire] Depositing ${amount} smallest units of ${token}...`);
    const result = await client.deposit({
      wallet: address,
      amount,
      token, // Pass token to SDK
    });

    console.log('[ShadowWire] Deposit result:', result);
    
    return {
      transaction: result.transaction || result.unsigned_tx_base64,
      recent_blockhash: result.recent_blockhash || result.recentBlockhash,
      last_valid_block_height: result.last_valid_block_height || result.lastValidBlockHeight,
    };
  }, [client, address]);

  // Withdraw - supports SOL, USDC, USD1
  const withdraw = useCallback(async (amount: number, token: SupportedToken = 'SOL') => {
    if (!client || !address) {
      throw new Error('Client not ready or wallet not connected');
    }

    const config = TOKEN_CONFIG[token];
    const minWithdrawSmallestUnit = config.minWithdraw * Math.pow(10, config.decimals);
    
    if (amount < minWithdrawSmallestUnit) {
      throw new Error(`Minimum withdraw is ${config.minWithdraw} ${token} (anti-spam protection)`);
    }

    console.log(`[ShadowWire] Withdrawing ${amount} smallest units of ${token}...`);
    const result = await client.withdraw({
      wallet: address,
      amount,
      token, // Pass token to SDK
    });

    console.log('[ShadowWire] Withdraw result:', result);
    
    return {
      transaction: result.transaction || result.unsigned_tx_base64,
      recent_blockhash: result.recent_blockhash || result.recentBlockhash,
      last_valid_block_height: result.last_valid_block_height || result.lastValidBlockHeight,
    };
  }, [client, address]);

  // Private Transfer - THE MAIN PRIVACY FEATURE!
  // type: 'internal' = amount hidden with ZK proofs (both users must be ShadowWire users)
  // type: 'external' = sender anonymous but amount visible (any wallet can receive)
  const transfer = useCallback(async (
    recipient: string,
    amount: number, // In human-readable units (e.g. 1.5 SOL, 10 USDC)
    type: 'internal' | 'external',
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    token: SupportedToken = 'SOL'
  ): Promise<TransferResult> => {
    if (!client || !address) {
      throw new Error('Client not ready or wallet not connected');
    }

    if (recipient === address) {
      throw new Error('Cannot transfer to yourself');
    }

    const config = TOKEN_CONFIG[token];
    if (amount < config.minTransfer) {
      throw new Error(`Minimum transfer is ${config.minTransfer} ${token} (anti-spam protection)`);
    }

    console.log(`[ShadowWire] Transferring ${amount} ${token} to ${recipient} (${type})...`);
    console.log('[ShadowWire] signMessage function:', signMessage);
    console.log('[ShadowWire] signMessage type:', typeof signMessage);
    
    // The SDK expects signMessage in the exact format from @solana/wallet-adapter-react
    // We need to wrap Reown's signMessage to match that interface
    const signMessageFn = async (message: Uint8Array): Promise<Uint8Array> => {
      console.log('[ShadowWire] signMessage called with:', message);
      console.log('[ShadowWire] Message string:', new TextDecoder().decode(message));
      try {
        const sig = await signMessage(message);
        console.log('[ShadowWire] Got signature:', sig, 'type:', typeof sig);
        return sig;
      } catch (err) {
        console.error('[ShadowWire] signMessage error:', err);
        throw err;
      }
    };

    // Test that signMessage is callable
    console.log('[ShadowWire] signMessage function:', signMessageFn);
    console.log('[ShadowWire] Is function?', typeof signMessageFn === 'function');
    
    // Create wallet object matching the expected interface
    const walletObj = { signMessage: signMessageFn };
    
    console.log('[ShadowWire] Wallet object keys:', Object.keys(walletObj));
    console.log('[ShadowWire] wallet.signMessage exists?', 'signMessage' in walletObj);
    console.log('[ShadowWire] About to call client.transfer with type:', type);
    
    // Log the full params we're sending
    const transferParams = {
      sender: address,
      recipient,
      amount,
      token,
      type,
      wallet: walletObj,
    };
    console.log('[ShadowWire] Transfer params:', JSON.stringify({
      ...transferParams,
      wallet: { signMessage: '[Function]' }
    }, null, 2));
    
    // SDK's transfer() has bug - doesn't pass wallet to sub-methods!
    // We call uploadProof + externalTransfer/internalTransfer directly with wallet
    let result;
    try {
      const amountSmallestUnit = Math.floor(amount * Math.pow(10, config.decimals));
      const nonce = Math.floor(Date.now() / 1000);
      const relayerFee = Math.floor(amountSmallestUnit * 0.01); // 1% relayer fee
      
      // Step 1: Upload proof WITH wallet signature
      console.log('[ShadowWire] Step 1: Uploading proof with wallet signature...');
      const proofResult = await client.uploadProof({
        sender_wallet: address,
        token,
        amount: amountSmallestUnit,
        nonce,
      }, walletObj); // Pass wallet as 2nd argument!
      
      console.log('[ShadowWire] Proof uploaded:', proofResult);
      
      // Step 2: Execute transfer WITH wallet signature
      if (type === 'internal') {
        console.log('[ShadowWire] Step 2: Executing internal transfer...');
        result = await client.internalTransfer({
          sender_wallet: address,
          recipient_wallet: recipient,
          token,
          nonce: proofResult.nonce,
          relayer_fee: relayerFee,
        }, walletObj); // Pass wallet as 2nd argument!
      } else {
        console.log('[ShadowWire] Step 2: Executing external transfer...');
        result = await client.externalTransfer({
          sender_wallet: address,
          recipient_wallet: recipient,
          token,
          nonce: proofResult.nonce,
          relayer_fee: relayerFee,
        }, walletObj); // Pass wallet as 2nd argument!
      }
    } catch (sdkError: any) {
      console.error('[ShadowWire] SDK threw error:', sdkError);
      console.error('[ShadowWire] Error details:', sdkError.response?.data || sdkError.message);
      throw new Error(sdkError.response?.data?.error || sdkError.message || 'SDK transfer failed');
    }

    console.log('[ShadowWire] Transfer result:', result);
    console.log('[ShadowWire] Full result JSON:', JSON.stringify(result, null, 2));
    
    // Check if transfer was successful
    if (!result.success) {
      const errorMsg = result.error || result.message || result.reason || 'Transfer failed (no error message from API)';
      console.error('[ShadowWire] Transfer failed. Full response:', JSON.stringify(result, null, 2));
      // Also log any nested error
      if (result.details) console.error('[ShadowWire] Error details:', result.details);
      throw new Error(errorMsg);
    }
    
    if (!result.tx_signature) {
      console.error('[ShadowWire] Transfer succeeded but no tx_signature:', result);
      throw new Error('Transfer completed but no transaction signature returned');
    }
    
    return {
      tx_signature: result.tx_signature,
      amount_hidden: result.amount_hidden || type === 'internal',
    };
  }, [client, address]);

  // Manual 2-step transfer (alternative if the simple transfer doesn't work)
  // Step 1: Upload proof, Step 2: Execute transfer
  const manualTransfer = useCallback(async (
    recipient: string,
    amount: number
  ): Promise<TransferResult> => {
    if (!client || !address) {
      throw new Error('Client not ready or wallet not connected');
    }

    console.log('[ShadowWire] Manual transfer - Step 1: Generating proof...');
    
    const nonce = Math.floor(Date.now() / 1000);
    const amountLamports = Math.floor(amount * 1e9);
    
    // Step 1: Upload proof
    const proofResult = await client.uploadProof({
      sender_wallet: address,
      token: 'SOL',
      amount: amountLamports,
      nonce,
    });
    
    console.log('[ShadowWire] Proof uploaded:', proofResult);
    
    // Step 2: Execute transfer
    console.log('[ShadowWire] Manual transfer - Step 2: Executing transfer...');
    const result = await client.internalTransfer({
      sender_wallet: address,
      recipient_wallet: recipient,
      token: 'SOL',
      nonce: proofResult.nonce,
      relayer_fee: 1000000, // 0.001 SOL relayer fee
    });
    
    console.log('[ShadowWire] Transfer result:', result);
    return {
      tx_signature: result.tx_signature || result.signature,
      amount_hidden: true,
    };
  }, [client, address]);

  return {
    client,
    isReady,
    isLoading,
    error,
    balances,
    balance: balances.SOL, // Legacy: returns SOL balance for backward compatibility
    deposit,
    withdraw,
    transfer,
    manualTransfer, // Alternative method
    refreshBalance,
  };
}
