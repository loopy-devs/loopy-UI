import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowUp, Shield as ShieldIcon, Info } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { Transaction } from '@solana/web3.js';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AmountInput } from '@/components/ui/Input';
import { TokenSelector, type SupportedToken } from '@/components/ui/TokenSelector';
import { ProgressStepper, SuccessModal, type ProgressStep } from '@/components/ui/ProgressStepper';
import { useShadowWire, TOKEN_CONFIG, type SupportedToken as ShadowToken } from '@/hooks/useShadowWire';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import { formatNumber, formatUSD } from '@/lib/format';
import { cn } from '@/lib/cn';

// ShadowPay fee constants
const SHADOWPAY_FEES = {
  RELAYER_FEE: 0.02, // $0.02 per transaction
};

// Progress steps
const SHIELD_STEPS: ProgressStep[] = [
  { id: 'preparing', label: 'Preparing transaction', description: 'Building the shield transaction...' },
  { id: 'signing', label: 'Awaiting signature', description: 'Please sign in your wallet' },
  { id: 'confirming', label: 'Confirming on-chain', description: 'Waiting for blockchain confirmation...' },
  { id: 'finalizing', label: 'Finalizing', description: 'Updating your shielded balance...' },
];

const UNSHIELD_STEPS: ProgressStep[] = [
  { id: 'preparing', label: 'Preparing withdrawal', description: 'Building the unshield transaction...' },
  { id: 'signing', label: 'Awaiting signature', description: 'Please sign in your wallet' },
  { id: 'confirming', label: 'Confirming on-chain', description: 'Waiting for blockchain confirmation...' },
  { id: 'finalizing', label: 'Finalizing', description: 'Updating your balance...' },
];

type Mode = 'shield' | 'unshield';

export default function Shield() {
  const [mode, setMode] = useState<Mode>('shield');
  const [selectedToken, setSelectedToken] = useState<SupportedToken | null>(null);
  const [amount, setAmount] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');
  const [successSymbol, setSuccessSymbol] = useState('');
  const [tokenPrice, setTokenPrice] = useState(0);

  // Refs for scroll behavior
  const widgetRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { connection } = useAppKitConnection();
  
  const { 
    isReady, 
    balances,
    deposit, 
    withdraw, 
    refreshBalance 
  } = useShadowWire();
  
  const { tokens: walletTokens, refresh: refreshWalletTokens } = useWalletTokens();

  // Get shielded balance for selected token
  const getShieldedBalance = useCallback(() => {
    if (!selectedToken) return 0;
    const tokenSymbol = selectedToken.symbol as ShadowToken;
    const balance = balances[tokenSymbol];
    if (!balance) return 0;
    const config = TOKEN_CONFIG[tokenSymbol];
    return balance.available / Math.pow(10, config.decimals);
  }, [selectedToken, balances]);

  // Get wallet balance for selected token
  const getWalletBalance = useCallback(() => {
    if (!selectedToken) return 0;
    return selectedToken.walletBalance || 0;
  }, [selectedToken]);

  const shieldedBalance = getShieldedBalance();
  const walletBalance = getWalletBalance();

  // Fetch token price when selected token changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (!selectedToken) {
        setTokenPrice(0);
        return;
      }
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/prices/${selectedToken.mint}`);
        const data = await res.json();
        setTokenPrice(data.price || data.usdPrice || 0);
      } catch (err) {
        console.error('Failed to fetch token price:', err);
      }
    };
    fetchPrice();
  }, [selectedToken]);

  // Get min/max amounts for selected token
  const getMinAmount = useCallback(() => {
    if (!selectedToken) return 0;
    const tokenSymbol = selectedToken.symbol as ShadowToken;
    const config = TOKEN_CONFIG[tokenSymbol];
    if (!config) return 0;
    return mode === 'shield' ? config.minDeposit : config.minWithdraw;
  }, [selectedToken, mode]);

  const maxAmount = mode === 'shield' 
    ? Math.max(0, walletBalance - (selectedToken?.symbol === 'SOL' ? 0.01 : 0)) // Reserve 0.01 SOL for fees
    : shieldedBalance;

  const minAmount = getMinAmount();

  const handleAmountChange = useCallback((value: string, valid: boolean) => {
    setAmount(value);
    const parsedValue = parseFloat(value) || 0;
    
    // Both shield and unshield have minimums
    const meetsMin = parsedValue >= minAmount;
    const meetsMax = parsedValue <= maxAmount;
    
    setIsValid(valid && parsedValue > 0 && meetsMin && meetsMax && selectedToken !== null);
    
    const symbol = selectedToken?.symbol || 'TOKEN';
    const actionWord = mode === 'shield' ? 'deposit' : 'withdraw';
    if (parsedValue > 0 && parsedValue < minAmount) {
      setError(`Minimum ${actionWord} is ${minAmount} ${symbol} (anti-spam protection)`);
    } else if (parsedValue > maxAmount) {
      setError(`Insufficient balance`);
    } else {
      setError(null);
    }
    setCurrentStep(-1);
  }, [maxAmount, minAmount, mode, selectedToken]);

  const handleMax = useCallback(() => {
    setAmount(formatNumber(maxAmount, 4));
    // Both shield and unshield have minimums
    const meetsMin = maxAmount >= minAmount;
    setIsValid(meetsMin && maxAmount > 0 && selectedToken !== null);
    const symbol = selectedToken?.symbol || 'TOKEN';
    const actionWord = mode === 'shield' ? 'deposit' : 'withdraw';
    if (maxAmount < minAmount) {
      setError(`Minimum ${actionWord} is ${minAmount} ${symbol} (anti-spam protection)`);
    } else {
      setError(null);
    }
  }, [maxAmount, minAmount, mode, selectedToken]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setSelectedToken(null); // Reset token on mode change
    setAmount('');
    setIsValid(false);
    setError(null);
    setCurrentStep(-1);
  };

  const handleTokenChange = (token: SupportedToken) => {
    setSelectedToken(token);
    setAmount('');
    setIsValid(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!address || !walletProvider || !connection || !isValid || !isReady || !selectedToken) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep(0);

    // Scroll to loader on mobile after a short delay for it to render
    setTimeout(() => {
      if (window.innerWidth < 1024 && loaderRef.current) {
        loaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    try {
      const tokenSymbol = selectedToken.symbol as ShadowToken;
      const config = TOKEN_CONFIG[tokenSymbol];
      const amountSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, config.decimals));

      let txData: { transaction: string; recent_blockhash: string; last_valid_block_height: number };
      
      // Step 0: Get transaction from ShadowWire
      try {
        if (mode === 'shield') {
          txData = await deposit(amountSmallestUnit, tokenSymbol);
        } else {
          txData = await withdraw(amountSmallestUnit, tokenSymbol);
        }
      } catch (apiError: any) {
        throw new Error(`Failed to prepare transaction: ${apiError.message}`);
      }

      // Step 1: Sign transaction
      setCurrentStep(1);
      
      let signature: string;
      try {
        const txBuffer = Buffer.from(txData.transaction, 'base64');
        const tx = Transaction.from(txBuffer);
        
        // Set blockhash if provided (transaction may already have one embedded)
        if (txData.recent_blockhash) {
          tx.recentBlockhash = txData.recent_blockhash;
        }
        if (txData.last_valid_block_height) {
          tx.lastValidBlockHeight = txData.last_valid_block_height;
        }
        
        console.log(`[${mode}] Transaction to sign:`, {
          instructions: tx.instructions.length,
          recentBlockhash: tx.recentBlockhash,
        });
        
        const result = await walletProvider.signAndSendTransaction(tx);
        signature = result as string;
        
        console.log(`[${mode}] Transaction sent:`, signature);
      } catch (signError: any) {
        console.error(`[${mode}] Signing error:`, signError);
        throw new Error(`Wallet signing failed: ${signError.message}`);
      }

      // Step 2: Confirm transaction
      setCurrentStep(2);
      
      try {
        const confirmResult = await connection.confirmTransaction({
          signature,
          blockhash: txData.recent_blockhash,
          lastValidBlockHeight: txData.last_valid_block_height,
        }, 'confirmed');
        
        if (confirmResult.value.err) {
          throw new Error(`Transaction failed on-chain: ${JSON.stringify(confirmResult.value.err)}`);
        }
        
        console.log(`[${mode}] Transaction confirmed!`);
      } catch (confirmError: any) {
        // Fallback: check signature status
        await new Promise(r => setTimeout(r, 2000));
        const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
        
        if (status?.value?.confirmationStatus !== 'confirmed' && status?.value?.confirmationStatus !== 'finalized') {
          throw new Error(`Confirmation failed. Signature: ${signature}`);
        }
      }

      // Step 3: Finalize
      setCurrentStep(3);
      
      // Force refresh all balances immediately - this updates cache with fresh data
      await Promise.all([
        refreshBalance(undefined, true), // Force refresh ALL shielded balances
        refreshWalletTokens(), // Refresh wallet tokens
      ]);

      // Success!
      setSuccessAmount(amount);
      setSuccessSymbol(selectedToken.symbol);
      setShowSuccess(true);
      setAmount('');
      setIsValid(false);
      setCurrentStep(-1);

    } catch (err: any) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = mode === 'shield' ? SHIELD_STEPS : UNSHIELD_STEPS;
  const inputAmount = parseFloat(amount) || 0;

  return (
    <div className="max-w-xl mx-auto space-y-4 lg:space-y-6">
      {/* Header - Desktop only */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:flex lg:items-center lg:gap-3 text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-brand/20 flex items-center justify-center">
          <ShieldIcon className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            {mode === 'shield' ? 'Shield Assets' : 'Unshield Assets'}
          </h1>
          <p className="text-gray-400 mt-0.5">
            {mode === 'shield' 
              ? 'Deposit into the zero-knowledge privacy pool'
              : 'Withdraw from the privacy pool to your wallet'
            }
          </p>
        </div>
      </motion.div>

      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex gap-2 p-1 bg-bg-tertiary rounded-xl"
      >
        <button
          onClick={() => handleModeChange('shield')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
            mode === 'shield'
              ? 'bg-brand text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <ArrowDown className="w-4 h-4" />
          Shield
        </button>
        <button
          onClick={() => handleModeChange('unshield')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
            mode === 'unshield'
              ? 'bg-brand text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <ArrowUp className="w-4 h-4" />
          Unshield
        </button>
      </motion.div>

      {/* Balance Display - Mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="lg:hidden flex items-center justify-between px-1"
      >
        <span className="text-sm text-gray-400">
          {mode === 'shield' ? 'Wallet Balance:' : 'Shielded Balance:'}
        </span>
        <span className="text-sm font-medium text-white">
          {formatNumber(mode === 'shield' ? walletBalance : shieldedBalance, 4)} {selectedToken?.symbol || 'TOKEN'}{' '}
          <span className="text-gray-500">({formatUSD((mode === 'shield' ? walletBalance : shieldedBalance) * tokenPrice)})</span>
        </span>
      </motion.div>

      {/* Main Widget Card */}
      <motion.div
        ref={widgetRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card animate={false} className="border-white/5">
          <CardContent className="p-4 lg:p-5 space-y-4">
            {/* Desktop Balance Display */}
            <div className="hidden lg:flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {mode === 'shield' ? 'Wallet Balance' : 'Shielded Balance'}
                </p>
                <p className="text-xl font-bold text-white">
                  {formatNumber(mode === 'shield' ? walletBalance : shieldedBalance, 4)} <span className="text-gray-400">{selectedToken?.symbol || 'TOKEN'}</span>
                  <span className="text-sm text-gray-500 ml-2">({formatUSD((mode === 'shield' ? walletBalance : shieldedBalance) * tokenPrice)})</span>
                </p>
              </div>
            </div>

            {/* Token Selector */}
            <TokenSelector
              selectedToken={selectedToken}
              onSelect={handleTokenChange}
              walletTokens={walletTokens.map((t) => ({
                address: t.address,
                symbol: t.symbol,
                balance: t.balance,
                decimals: t.decimals,
              }))}
              shieldedBalances={Object.entries(balances)
                .filter(([_, bal]) => bal !== null)
                .map(([symbol, bal]) => ({
                  mint: symbol,
                  symbol,
                  balance: bal!.available / Math.pow(10, TOKEN_CONFIG[symbol as ShadowToken]?.decimals || 9),
                }))}
              mode={mode}
            />

            {/* Amount Input */}
            <AmountInput
              label={mode === 'shield' ? 'Amount to shield' : 'Amount to unshield'}
              placeholder="0.00"
              value={amount}
              maxDecimals={selectedToken?.decimals || 9}
              onValueChange={handleAmountChange}
              tokenSymbol={selectedToken?.symbol || 'TOKEN'}
              onMax={handleMax}
              disabled={isLoading || !selectedToken}
            />

            {/* Arrow divider */}
            <div className="flex justify-center py-1">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary border border-white/5 flex items-center justify-center">
                {mode === 'shield' ? (
                  <ArrowDown className="h-4 w-4 text-brand" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-brand" />
                )}
              </div>
            </div>

            {/* Output preview */}
            <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-white/5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {mode === 'shield' ? 'You will receive' : 'You will receive'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  <span>~{formatUSD(SHADOWPAY_FEES.RELAYER_FEE)} fee</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {amount || '0'} <span className="text-gray-400">{selectedToken?.symbol || 'TOKEN'}</span>
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  ≈ {formatUSD(inputAmount * tokenPrice)}
                </span>
                <span className="text-gray-500">
                  {mode === 'shield' ? 'in private balance' : 'to your wallet'}
                </span>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-error/10 border border-error/20"
                >
                  <p className="text-sm text-error">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full h-12 lg:h-14 text-base font-semibold rounded-xl lg:rounded-2xl"
              disabled={!isValid || isLoading || !isReady || !selectedToken}
              isLoading={isLoading}
              onClick={handleSubmit}
            >
              {isLoading 
                ? steps[currentStep]?.label || 'Processing...'
                : mode === 'shield' 
                  ? `Shield ${selectedToken?.symbol || 'Token'}`
                  : `Unshield ${selectedToken?.symbol || 'Token'}`
              }
            </Button>

            {/* Info text */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              {mode === 'shield' ? (
                <p>Minimum deposit: {minAmount} {selectedToken?.symbol || 'TOKEN'} (anti-spam) • 1% relayer fee on transfers</p>
              ) : (
                <>
                  <p>Unshield returns funds to your connected wallet only.</p>
                  <p className="text-brand/70">To send privately to any address, use the <span className="font-medium text-brand">Send</span> tab.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Stepper */}
      <AnimatePresence>
        {isLoading && currentStep >= 0 && (
          <motion.div
            ref={loaderRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card animate={false} className="border-brand/20 bg-brand/5">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  {mode === 'shield' ? 'Shielding in progress' : 'Unshielding in progress'}
                </p>
                <ProgressStepper steps={steps} currentStep={currentStep} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          // Scroll back to widget on mobile
          if (window.innerWidth < 1024 && widgetRef.current) {
            setTimeout(() => {
              widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }}
        title={mode === 'shield' ? 'Successfully Shielded!' : 'Successfully Unshielded!'}
        message={mode === 'shield' 
          ? `Your ${successSymbol} is now private and secured in the ZK pool.`
          : `Your ${successSymbol} has been withdrawn to your wallet.`
        }
        amount={successAmount}
        symbol={successSymbol}
      />
    </div>
  );
}
