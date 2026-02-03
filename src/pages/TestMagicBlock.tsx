/**
 * MagicBlock Private SPL Token Test Page
 * Test shielding and unshielding of USDC/USDT
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMagicBlock, KNOWN_MINTS } from '@/hooks/useMagicBlock';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Shield, 
  ShieldOff, 
  Loader2, 
  Check, 
  AlertCircle,
  Wallet,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TokenType = 'USDC' | 'USDT';

export default function TestMagicBlock() {
  const { address, isConnected } = useAppKitAccount();
  const { 
    isLoading, 
    error, 
    fetchConfig, 
    initializeATA, 
    deposit, 
    withdraw,
    getEphemeralATAInfo,
  } = useMagicBlock();

  const [selectedToken, setSelectedToken] = useState<TokenType>('USDC');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [ataInfo, setAtaInfo] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Get current mint
  const currentMint = KNOWN_MINTS[selectedToken];

  // Auto-fetch config and ATA info on mount and token change
  useEffect(() => {
    if (address) {
      fetchConfig().catch(() => {});
      const info = getEphemeralATAInfo(currentMint);
      setAtaInfo(info);
    }
  }, [address, currentMint, fetchConfig, getEphemeralATAInfo]);

  // Handle deposit (shield) - auto-initialize ATA if needed
  const handleDeposit = async () => {
    if (!amount || isNaN(Number(amount))) {
      setResult({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    try {
      setResult(null);
      setIsInitializing(true);
      
      // Try to initialize ATA first (will fail if already exists, that's ok)
      try {
        await initializeATA(currentMint);
        setResult({ type: 'success', message: 'ATA initialized! Now shielding...' });
      } catch (initErr: any) {
        // If ATA already exists, continue to deposit
        if (!initErr.message?.includes('already in use') && !initErr.message?.includes('already initialized')) {
          // Only throw if it's not an "already exists" error
          console.log('ATA init skipped (may already exist):', initErr.message);
        }
      }
      
      setIsInitializing(false);
      
      // Convert to smallest unit (6 decimals for USDC/USDT)
      const amountInSmallestUnit = Math.floor(Number(amount) * 1_000_000);
      const sig = await deposit(currentMint, amountInSmallestUnit);
      setResult({ type: 'success', message: `Shielded ${amount} ${selectedToken}! Tx: ${sig.slice(0, 16)}...` });
      setAmount('');
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
      setIsInitializing(false);
    }
  };

  // Handle withdraw (unshield)
  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount))) {
      setResult({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    
    try {
      setResult(null);
      // Convert to smallest unit (6 decimals for USDC/USDT)
      const amountInSmallestUnit = Math.floor(Number(amount) * 1_000_000);
      const sig = await withdraw(currentMint, amountInSmallestUnit);
      setResult({ type: 'success', message: `Unshielded ${amount} ${selectedToken}! Tx: ${sig.slice(0, 16)}...` });
      setAmount('');
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Wallet className="w-16 h-16 text-brand mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-400">Please connect your wallet to test MagicBlock integration</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">MagicBlock Test</h1>
            <p className="text-sm text-gray-400">Private SPL Token Shield/Unshield</p>
          </div>
        </div>

        {/* Wallet Info */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-brand" />
              <div>
                <p className="text-sm text-gray-400">Connected Wallet</p>
                <p className="font-mono text-sm text-white">{address?.slice(0, 8)}...{address?.slice(-8)}</p>
              </div>
            </div>
            {ataInfo && (
              <div className="text-right text-xs text-gray-500">
                <p>Ephemeral ATA ready</p>
              </div>
            )}
          </div>
        </Card>

        {/* Token Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Token</h3>
          <div className="flex gap-3">
            {(['USDC', 'USDT'] as TokenType[]).map((token) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                  selectedToken === token
                    ? 'bg-brand/20 border-brand text-brand'
                    : 'bg-bg-tertiary border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <span className="font-medium">{token}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Shield / Unshield */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Shield / Unshield {selectedToken}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Amount ({selectedToken})</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(value) => setAmount(value)}
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeposit}
                disabled={isLoading || isInitializing || !amount}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-brand to-emerald-500 rounded-xl font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isInitializing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                {isInitializing ? 'Initializing...' : 'Shield'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWithdraw}
                disabled={isLoading || !amount}
                className="flex items-center justify-center gap-2 py-4 px-6 bg-bg-tertiary border border-white/10 rounded-xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldOff className="w-5 h-5" />
                )}
                Unshield
              </motion.button>
            </div>
          </div>
        </Card>

        {/* Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`p-4 ${
              result.type === 'success' 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              <div className="flex items-start gap-3">
                {result.type === 'success' ? (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className={`text-sm ${
                  result.type === 'success' ? 'text-green-400' : 'text-red-400'
                } break-all`}>
                  {result.message}
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Error from hook */}
        {error && !result && (
          <Card className="p-4 border-red-500/30 bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </Card>
        )}

        {/* Info */}
        <Card className="p-4 border-brand/20 bg-brand/5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-400">
              <span className="text-brand font-medium">Powered by MagicBlock</span>
              <p className="mt-1">
                Private Ephemeral Rollups enable SPL token privacy. 
                Your shielded tokens are invisible on-chain until you unshield them.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
