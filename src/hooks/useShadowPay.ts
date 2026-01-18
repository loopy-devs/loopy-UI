import { useState, useEffect, useCallback, useRef } from 'react';

// Declare global types for ShadowPay client
declare global {
  interface Window {
    ShadowPayClient?: new () => ShadowPayClientInstance;
    snarkjs?: unknown;
    solanaWeb3?: unknown;
  }
}

interface ShadowPayClientInstance {
  initialize(): Promise<void>;
  generatePaymentProof(
    senderWallet: string,
    recipientWallet: string,
    amount: number,
    resourceUrl?: string
  ): Promise<{
    commitment: string;
    nullifier: string;
    proof: string;
    publicSignals: string[];
    encryptedAmount?: number[];
  }>;
}

interface UseShadowPayReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  generateProof: (
    senderWallet: string,
    recipientWallet: string,
    amount: number
  ) => Promise<{
    commitment: string;
    nullifier: string;
    proof: string;
    publicSignals: string[];
    encryptedAmount?: number[];
  } | null>;
}

export function useShadowPay(): UseShadowPayReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<ShadowPayClientInstance | null>(null);

  // Initialize ShadowPayClient on mount
  useEffect(() => {
    const initClient = async () => {
      // Skip if already initialized or initializing
      if (isInitialized || isInitializing || clientRef.current) return;

      // Check if ShadowPayClient is available
      if (!window.ShadowPayClient) {
        console.log('[ShadowPay] Client not loaded yet, waiting...');
        // Retry after a short delay
        setTimeout(initClient, 1000);
        return;
      }

      try {
        setIsInitializing(true);
        console.log('[ShadowPay] Initializing client...');
        
        const client = new window.ShadowPayClient();
        await client.initialize(); // Loads ZK circuit artifacts (~5-10s)
        
        clientRef.current = client;
        setIsInitialized(true);
        setError(null);
        console.log('[ShadowPay] Client initialized successfully!');
      } catch (err: any) {
        console.error('[ShadowPay] Initialization failed:', err);
        setError(err.message || 'Failed to initialize ShadowPay client');
      } finally {
        setIsInitializing(false);
      }
    };

    initClient();
  }, [isInitialized, isInitializing]);

  // Generate ZK proof for payment
  const generateProof = useCallback(async (
    senderWallet: string,
    recipientWallet: string,
    amount: number
  ) => {
    if (!clientRef.current) {
      setError('ShadowPay client not initialized');
      return null;
    }

    try {
      console.log('[ShadowPay] Generating ZK proof...', { senderWallet, recipientWallet, amount });
      
      const proofData = await clientRef.current.generatePaymentProof(
        senderWallet,
        recipientWallet,
        amount,
        'loopy-private-send' // Resource identifier
      );
      
      console.log('[ShadowPay] Proof generated:', proofData);
      return proofData;
    } catch (err: any) {
      console.error('[ShadowPay] Proof generation failed:', err);
      setError(err.message || 'Failed to generate proof');
      return null;
    }
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    generateProof,
  };
}
