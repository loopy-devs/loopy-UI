import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import bs58 from 'bs58';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { SIGN_MESSAGE } from '@/config/constants';

export function useAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  
  const { user, isRegistered, isLoading, setUser, setLoading, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  // Get referral code from URL
  const referralCode = searchParams.get('ref') || undefined;

  // Check if user is already registered when wallet connects
  useEffect(() => {
    if (isConnected && address && !isRegistered) {
      checkExistingUser(address);
    }
  }, [isConnected, address]);

  // Redirect if already registered
  useEffect(() => {
    if (isConnected && isRegistered) {
      navigate('/dashboard', { replace: true });
    }
  }, [isConnected, isRegistered, navigate]);

  const checkExistingUser = async (walletAddress: string) => {
    try {
      const { data } = await authAPI.checkUser(walletAddress);
      if (data.exists) {
        // Fetch full user data
        const { data: userData } = await authAPI.getUser(walletAddress);
        setUser(userData);
      }
    } catch {
      // User doesn't exist, that's fine
    }
  };

  const register = useCallback(async () => {
    if (!address || !walletProvider) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create message with timestamp
      const message = `${SIGN_MESSAGE}${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message using wallet provider
      const signature = await walletProvider.signMessage(messageBytes);
      
      if (!signature) {
        throw new Error('Signature rejected');
      }

      // Convert signature to base58
      const signatureBase58 = bs58.encode(new Uint8Array(signature));

      // Register with server
      const { data } = await authAPI.register({
        wallet_address: address,
        signature: signatureBase58,
        message,
        referral_code: referralCode,
      });

      if (data.success && data.user) {
        setUser(data.user);
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }, [address, walletProvider, referralCode, setUser, setLoading, navigate]);

  return {
    user,
    isConnected,
    isRegistered,
    isLoading,
    error,
    referralCode,
    register,
    logout,
  };
}
