import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send as SendIcon, ArrowRight, Info, ExternalLink } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AmountInput, Input } from '@/components/ui/Input';
import { TokenSelector, type SupportedToken } from '@/components/ui/TokenSelector';
import { ProgressStepper, SuccessModal, type ProgressStep } from '@/components/ui/ProgressStepper';
import { useShadowWire, TOKEN_CONFIG, type SupportedToken as ShadowToken } from '@/hooks/useShadowWire';
import { useCacheStore } from '@/stores/cache';
import { formatNumber, formatUSD } from '@/lib/format';

// Progress steps for sending (5 steps with 2 signatures clearly shown)
const SEND_STEPS: ProgressStep[] = [
  { id: 'proof', label: 'Generating ZK proof', description: 'Creating zero-knowledge proof for privacy...' },
  { id: 'sign-proof', label: 'Sign proof upload', description: '1st signature: Authorize ZK proof upload' },
  { id: 'sign-transfer', label: 'Sign transfer', description: '2nd signature: Authorize private transfer' },
  { id: 'processing', label: 'Processing transfer', description: 'Relayer executing your private transfer...' },
  { id: 'confirming', label: 'Confirming on-chain', description: 'Waiting for blockchain confirmation...' },
];

export default function Send() {
  const [selectedToken, setSelectedToken] = useState<SupportedToken | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isRecipientValid, setIsRecipientValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState('');
  const [successSymbol, setSuccessSymbol] = useState('');
  const [successTx, setSuccessTx] = useState('');
  const [tokenPrice, setTokenPrice] = useState(0);

  // Refs for scroll behavior
  const widgetRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  
  const { 
    isReady, 
    balances,
    transfer,
    refreshBalance 
  } = useShadowWire();

  // Get shielded balance for selected token
  const getShieldedBalance = useCallback(() => {
    if (!selectedToken) return 0;
    const tokenSymbol = selectedToken.symbol as ShadowToken;
    const balance = balances[tokenSymbol];
    if (!balance) return 0;
    const config = TOKEN_CONFIG[tokenSymbol];
    return balance.available / Math.pow(10, config.decimals);
  }, [selectedToken, balances]);

  const shieldedBalance = getShieldedBalance();
  const maxAmount = shieldedBalance;

  // Get min transfer amount for selected token
  const getMinTransfer = useCallback(() => {
    if (!selectedToken) return 0;
    const tokenSymbol = selectedToken.symbol as ShadowToken;
    const config = TOKEN_CONFIG[tokenSymbol];
    return config?.minTransfer || 0;
  }, [selectedToken]);

  const minTransfer = getMinTransfer();

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

  // Validate recipient address
  const handleRecipientChange = useCallback((value: string) => {
    setRecipient(value);
    
    try {
      new PublicKey(value);
      if (value === address) {
        setIsRecipientValid(false);
        setError('Cannot send to yourself. Use Unshield on the Shield page instead.');
      } else {
        setIsRecipientValid(true);
        setError(null);
      }
    } catch {
      setIsRecipientValid(value.length === 0); // Empty is ok, invalid is not
      if (value.length > 0) {
        setError('Invalid Solana address');
      } else {
        setError(null);
      }
    }
  }, [address]);

  const handleTokenChange = (token: SupportedToken) => {
    setSelectedToken(token);
    setAmount('');
    setIsValid(false);
    setError(null);
  };

  const handleAmountChange = useCallback((value: string, valid: boolean) => {
    setAmount(value);
    const parsedValue = parseFloat(value) || 0;
    
    const symbol = selectedToken?.symbol || 'TOKEN';
    const meetsMin = parsedValue >= minTransfer;
    const meetsMax = parsedValue <= maxAmount;
    
    setIsValid(valid && parsedValue > 0 && meetsMin && meetsMax && isRecipientValid && selectedToken !== null);
    
    if (parsedValue > 0 && parsedValue < minTransfer) {
      setError(`Minimum transfer is ${minTransfer} ${symbol} (anti-spam protection)`);
    } else if (parsedValue > maxAmount) {
      setError('Insufficient shielded balance');
    } else if (isRecipientValid || recipient.length === 0) {
      setError(null);
    }
    setCurrentStep(-1);
  }, [maxAmount, minTransfer, isRecipientValid, recipient, selectedToken]);

  const handleMax = useCallback(() => {
    // Max is available balance minus 1% fee buffer
    const max = Math.max(0, maxAmount * 0.99);
    const symbol = selectedToken?.symbol || 'TOKEN';
    setAmount(formatNumber(max, 4));
    setIsValid(max >= minTransfer && max > 0 && isRecipientValid && selectedToken !== null);
    if (max < minTransfer) {
      setError(`Minimum transfer is ${minTransfer} ${symbol} (anti-spam protection)`);
    } else {
      setError(null);
    }
  }, [maxAmount, minTransfer, isRecipientValid, selectedToken]);

  const handleSubmit = async () => {
    if (!address || !walletProvider || !isValid || !isRecipientValid || !isReady || !selectedToken) return;

    setIsLoading(true);
    setError(null);
    setCurrentStep(0); // Step 0: Generating ZK proof

    // Scroll to loader on mobile after a short delay for it to render
    setTimeout(() => {
      if (window.innerWidth < 1024 && loaderRef.current) {
        loaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    try {
      const amountValue = parseFloat(amount);
      const tokenSymbol = selectedToken.symbol as ShadowToken;

      // Get signMessage from Phantom directly for compatibility
      const phantom = (window as any).phantom?.solana || (window as any).solana;
      
      // Track which signature we're on
      let signatureCount = 0;
      
      const signMessageFn = async (message: Uint8Array): Promise<Uint8Array> => {
        signatureCount++;
        
        if (signatureCount === 1) {
          setCurrentStep(1); // Step 1: Sign proof upload (1st signature)
        } else if (signatureCount === 2) {
          setCurrentStep(2); // Step 2: Sign transfer (2nd signature)
        }
        
        if (phantom && phantom.signMessage) {
          const { signature } = await phantom.signMessage(message, 'utf8');
          return signature;
        } else {
          const sig = await walletProvider.signMessage(message);
          return sig instanceof Uint8Array ? sig : new Uint8Array(sig);
        }
      };

      // Execute transfer - this will call signMessageFn twice:
      // 1st for proof upload, 2nd for transfer authorization
      const result = await transfer(
        recipient,
        amountValue,
        'external', // External transfer - sender anonymous
        signMessageFn,
        tokenSymbol // Pass selected token
      );

      // Step 3: Processing transfer (relayer executing)
      setCurrentStep(3);
      
      // Small delay to show processing step
      await new Promise(r => setTimeout(r, 500));

      // Step 4: Confirming on-chain
      setCurrentStep(4);

      console.log('[Send] Transfer result:', result);

      // IMPORTANT: Invalidate ALL cache to force fresh data
      const { invalidateShielded, invalidateShadowWireBalances } = useCacheStore.getState();
      invalidateShielded();
      invalidateShadowWireBalances();

      // Force refresh ALL shielded balances immediately
      await refreshBalance(undefined, true);

      // Success!
      setSuccessAmount(amount);
      setSuccessSymbol(selectedToken.symbol);
      setSuccessTx(result.tx_signature);
      setShowSuccess(true);
      setAmount('');
      setRecipient('');
      setIsValid(false);
      setIsRecipientValid(false);
      setCurrentStep(-1);

    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inputAmount = parseFloat(amount) || 0;
  const feeAmount = inputAmount * 0.01; // 1% relayer fee
  const receiveAmount = inputAmount - feeAmount;

  return (
    <div className="max-w-xl mx-auto space-y-4 lg:space-y-6">
      {/* Header - Desktop only */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:flex lg:items-center lg:gap-3 text-left"
      >
        <div className="h-12 w-12 rounded-xl bg-brand/20 flex items-center justify-center">
          <SendIcon className="h-6 w-6 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Private Send</h1>
          <p className="text-gray-400 mt-0.5">
            Send privately to any Solana address
          </p>
        </div>
      </motion.div>

      {/* Balance Display - Mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="lg:hidden flex items-center justify-between px-1"
      >
        <span className="text-sm text-gray-400">Shielded Balance:</span>
        <span className="text-sm font-medium text-white">
          {formatNumber(shieldedBalance, 4)} {selectedToken?.symbol || 'TOKEN'}{' '}
          <span className="text-gray-500">({formatUSD(shieldedBalance * tokenPrice)})</span>
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
                  Shielded Balance
                </p>
                <p className="text-xl font-bold text-white">
                  {formatNumber(shieldedBalance, 4)} <span className="text-gray-400">{selectedToken?.symbol || 'TOKEN'}</span>
                  <span className="text-sm text-gray-500 ml-2">({formatUSD(shieldedBalance * tokenPrice)})</span>
                </p>
              </div>
            </div>

            {/* Token Selector */}
            <TokenSelector
              selectedToken={selectedToken}
              onSelect={handleTokenChange}
              walletTokens={[]} // Not needed for send (shielded only)
              shieldedBalances={Object.entries(balances)
                .filter(([_, bal]) => bal !== null)
                .map(([symbol, bal]) => ({
                  mint: symbol,
                  symbol,
                  balance: bal!.available / Math.pow(10, TOKEN_CONFIG[symbol as ShadowToken]?.decimals || 9),
                }))}
              mode="unshield" // Use unshield mode to show shielded balances
            />

            {/* Recipient Input */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                Recipient Address
              </label>
              <Input
                placeholder="Enter Solana wallet address"
                value={recipient}
                onChange={handleRecipientChange}
                disabled={isLoading}
                className="font-mono text-base" 
              />
            </div>

            {/* Amount Input */}
            <AmountInput
              label="Amount to send"
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
                <ArrowRight className="h-4 w-4 text-brand" />
              </div>
            </div>

            {/* Output preview */}
            <div className="p-4 rounded-xl bg-bg-tertiary/50 border border-white/5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">Recipient receives</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  <span>1% fee</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(receiveAmount, 4)} <span className="text-gray-400">{selectedToken?.symbol || 'TOKEN'}</span>
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  ≈ {formatUSD(receiveAmount * tokenPrice)}
                </span>
                <span className="text-green-400 text-xs">
                  🔒 Your identity hidden
                </span>
              </div>
              
              {/* Recipient preview */}
              {isRecipientValid && recipient && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Sending to:</p>
                  <p className="text-sm font-mono text-gray-300 truncate">
                    {recipient}
                  </p>
                </div>
              )}
            </div>

            {/* Privacy info */}
            <div className="p-3 rounded-xl bg-brand/5 border border-brand/20">
              <p className="text-xs text-brand/80 flex items-start gap-2">
                <span className="text-lg leading-none">🛡️</span>
                <span>
                  External transfer: Your wallet address stays anonymous. The recipient sees the amount but not who sent it.
                </span>
              </p>
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
              disabled={!isValid || !isRecipientValid || isLoading || !isReady || !selectedToken || shieldedBalance < minTransfer}
              isLoading={isLoading}
              onClick={handleSubmit}
            >
              {isLoading 
                ? SEND_STEPS[currentStep]?.label || 'Processing...'
                : shieldedBalance < minTransfer
                  ? `Need ${minTransfer} ${selectedToken?.symbol || 'TOKEN'} minimum`
                  : `Send ${selectedToken?.symbol || 'Token'} Privately`
              }
            </Button>

            {/* Info text */}
            <p className="text-xs text-gray-500 text-center">
              Minimum: {minTransfer} {selectedToken?.symbol || 'TOKEN'} (anti-spam) • 1% relayer fee • Sender anonymous
            </p>
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
                  Private transfer in progress
                </p>
                <ProgressStepper steps={SEND_STEPS} currentStep={currentStep} />
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
        title="Transfer Complete!"
        message={`Your ${successSymbol} has been sent privately. The recipient won't know your wallet address.`}
        amount={successAmount}
        symbol={successSymbol}
      />

      {/* View on Explorer after success */}
      {successTx && showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <a
            href={`https://solscan.io/tx/${successTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand hover:text-brand/80 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View on Solscan
          </a>
        </motion.div>
      )}
    </div>
  );
}
