/**
 * MagicBlock Private SPL Token Hook
 * Provides SPL token shielding/unshielding via MagicBlock's Private Ephemeral Rollup
 */

import { useState, useCallback } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { 
  PublicKey, 
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import type { Provider } from '@reown/appkit-adapter-solana/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Known token mints
export const KNOWN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

// MagicBlock program IDs
const MAGICBLOCK_PROGRAM_ID = 'SPLxh1LVZzEkX99H6rqYizhytLWPZVV296zyYDPagv2';

interface MagicBlockConfig {
  cluster_url: string;
  program_id: string;
  system_program: string;
  token_program: string;
  delegation_program: string;
  permission_program: string;
  magic_program: string;
}

/**
 * Derive ephemeral ATA PDA for a user-mint pair
 */
function deriveEphemeralATA(user: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('ephemeral_ata'), user.toBuffer(), mint.toBuffer()],
    new PublicKey(MAGICBLOCK_PROGRAM_ID)
  );
}

/**
 * Derive global vault PDA for a mint
 */
function deriveGlobalVault(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global_vault'), mint.toBuffer()],
    new PublicKey(MAGICBLOCK_PROGRAM_ID)
  );
}

export function useMagicBlock() {
  const { address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<MagicBlockConfig | null>(null);

  /**
   * Fetch MagicBlock configuration
   */
  const fetchConfig = useCallback(async (): Promise<MagicBlockConfig> => {
    const res = await fetch(`${API_BASE_URL}/magicblock/config`);
    if (!res.ok) throw new Error('Failed to fetch config');
    const data = await res.json();
    setConfig(data);
    return data;
  }, []);

  /**
   * Initialize ephemeral ATA for a token
   * Must be called once per user per token type
   */
  const initializeATA = useCallback(async (mint: string): Promise<string> => {
    if (!address || !walletProvider || !connection) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const userPubkey = new PublicKey(address);
      const mintPubkey = new PublicKey(mint);
      
      // Derive ephemeral ATA PDA
      const [ephemeralATA, bump] = deriveEphemeralATA(userPubkey, mintPubkey);
      
      // Request transaction from backend
      const res = await fetch(`${API_BASE_URL}/magicblock/init-ata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payer: address,
          user: address,
          mint,
          ephemeral_ata: ephemeralATA.toBase58(),
          ephemeral_ata_bump: bump,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to initialize ATA');
      }

      const { transaction: txBase64 } = await res.json();
      
      // Decode and sign transaction
      const txBuffer = Buffer.from(txBase64, 'base64');
      let tx: Transaction | VersionedTransaction;
      
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }

      // Sign and send
      const signedTx = await walletProvider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, walletProvider, connection]);

  /**
   * Deposit (shield) SPL tokens
   */
  const deposit = useCallback(async (mint: string, amount: number): Promise<string> => {
    if (!address || !walletProvider || !connection) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const userPubkey = new PublicKey(address);
      const mintPubkey = new PublicKey(mint);
      
      // Get user's source token account
      const sourceToken = await getAssociatedTokenAddress(
        mintPubkey,
        userPubkey
      );
      
      // Derive PDAs
      const [ephemeralATA] = deriveEphemeralATA(userPubkey, mintPubkey);
      const [vault] = deriveGlobalVault(mintPubkey);
      
      // Get vault's token account
      const vaultToken = await getAssociatedTokenAddress(
        mintPubkey,
        vault,
        true // allowOwnerOffCurve
      );

      // Request transaction from backend
      const res = await fetch(`${API_BASE_URL}/magicblock/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: address,
          user: address,
          mint,
          source_token: sourceToken.toBase58(),
          vault_token: vaultToken.toBase58(),
          amount,
          ephemeral_ata: ephemeralATA.toBase58(),
          vault: vault.toBase58(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to deposit');
      }

      const { transaction: txBase64 } = await res.json();
      
      // Decode and sign transaction
      const txBuffer = Buffer.from(txBase64, 'base64');
      let tx: Transaction | VersionedTransaction;
      
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }

      // Sign and send
      const signedTx = await walletProvider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, walletProvider, connection]);

  /**
   * Withdraw (unshield) SPL tokens
   */
  const withdraw = useCallback(async (mint: string, amount: number): Promise<string> => {
    if (!address || !walletProvider || !connection) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const userPubkey = new PublicKey(address);
      const mintPubkey = new PublicKey(mint);
      
      // Get user's destination token account
      const userDest = await getAssociatedTokenAddress(
        mintPubkey,
        userPubkey
      );
      
      // Derive PDAs
      const [ephemeralATA] = deriveEphemeralATA(userPubkey, mintPubkey);
      const [vault, vaultBump] = deriveGlobalVault(mintPubkey);
      
      // Get vault's source token account
      const vaultSource = await getAssociatedTokenAddress(
        mintPubkey,
        vault,
        true // allowOwnerOffCurve
      );

      // Request transaction from backend
      const res = await fetch(`${API_BASE_URL}/magicblock/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: address,
          mint,
          vault_source: vaultSource.toBase58(),
          user_dest: userDest.toBase58(),
          amount,
          ephemeral_ata: ephemeralATA.toBase58(),
          vault: vault.toBase58(),
          vault_bump: vaultBump,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to withdraw');
      }

      const { transaction: txBase64 } = await res.json();
      
      // Decode and sign transaction
      const txBuffer = Buffer.from(txBase64, 'base64');
      let tx: Transaction | VersionedTransaction;
      
      try {
        tx = VersionedTransaction.deserialize(txBuffer);
      } catch {
        tx = Transaction.from(txBuffer);
      }

      // Sign and send
      const signedTx = await walletProvider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, walletProvider, connection]);

  /**
   * Get ephemeral ATA info for a token
   */
  const getEphemeralATAInfo = useCallback((mint: string) => {
    if (!address) return null;
    
    const userPubkey = new PublicKey(address);
    const mintPubkey = new PublicKey(mint);
    
    const [ephemeralATA, bump] = deriveEphemeralATA(userPubkey, mintPubkey);
    const [vault, vaultBump] = deriveGlobalVault(mintPubkey);
    
    return {
      ephemeralATA: ephemeralATA.toBase58(),
      ephemeralATABump: bump,
      vault: vault.toBase58(),
      vaultBump,
    };
  }, [address]);

  return {
    // State
    isLoading,
    error,
    config,
    
    // Actions
    fetchConfig,
    initializeATA,
    deposit,
    withdraw,
    getEphemeralATAInfo,
    
    // Constants
    KNOWN_MINTS,
  };
}
