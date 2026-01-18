import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, ArrowDown, ArrowUp, Send, Eye, EyeOff } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import { Transaction } from '@solana/web3.js';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useShadowWire } from '@/hooks/useShadowWire';

export default function TestSDK() {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>('solana');
  const { connection } = useAppKitConnection();
  
  const { isReady, isLoading, error, balance, deposit, withdraw, transfer, manualTransfer, refreshBalance } = useShadowWire();
  
  const [log, setLog] = useState<string[]>(['Waiting for SDK...']);
  const [txLoading, setTxLoading] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('0.01');
  const [transferType, setTransferType] = useState<'internal' | 'external'>('external');

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleDeposit = async () => {
    if (!address || !walletProvider || !connection) {
      addLog('❌ Wallet not connected');
      return;
    }

    setTxLoading(true);
    try {
      addLog('📤 Calling SDK deposit...');
      const result = await deposit(110000000); // 0.11 SOL (0.1 min + buffer for fees)
      
      addLog(`✅ Got transaction with blockhash: ${result.recent_blockhash?.slice(0, 10)}...`);
      
      // Decode
      const txBuffer = Buffer.from(result.transaction, 'base64');
      const tx = Transaction.from(txBuffer);
      
      addLog(`📝 TX has ${tx.instructions.length} instructions`);
      
      // Set blockhash
      if (result.recent_blockhash) {
        tx.recentBlockhash = result.recent_blockhash;
      }
      if (result.last_valid_block_height) {
        tx.lastValidBlockHeight = result.last_valid_block_height;
      }
      
      addLog('🔐 Signing with wallet...');
      const signedResult = await walletProvider.signAndSendTransaction(tx);
      const signature = signedResult as string;
      
      addLog(`✅ Sent! Signature: ${signature.slice(0, 20)}...`);
      addLog(`🔗 https://solscan.io/tx/${signature}`);
      
      // Refresh balance
      setTimeout(() => {
        refreshBalance();
        addLog('🔄 Balance refreshed');
      }, 3000);
      
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !walletProvider || !connection) {
      addLog('❌ Wallet not connected');
      return;
    }

    if (!balance?.available || balance.available <= 0) {
      addLog('❌ No available balance to withdraw');
      return;
    }

    setTxLoading(true);
    try {
      const withdrawAmount = balance.available;
      addLog(`📥 Calling SDK withdraw for ${(withdrawAmount / 1e9).toFixed(4)} SOL...`);
      const result = await withdraw(withdrawAmount); // Withdraw ALL available
      
      addLog(`✅ Got transaction with blockhash: ${result.recent_blockhash?.slice(0, 10)}...`);
      
      // Decode
      const txBuffer = Buffer.from(result.transaction, 'base64');
      const tx = Transaction.from(txBuffer);
      
      addLog(`📝 TX has ${tx.instructions.length} instructions`);
      
      // Set blockhash
      if (result.recent_blockhash) {
        tx.recentBlockhash = result.recent_blockhash;
      }
      if (result.last_valid_block_height) {
        tx.lastValidBlockHeight = result.last_valid_block_height;
      }
      
      addLog('🔐 Signing with wallet...');
      const signedResult = await walletProvider.signAndSendTransaction(tx);
      const signature = signedResult as string;
      
      addLog(`✅ Sent! Signature: ${signature.slice(0, 20)}...`);
      addLog(`🔗 https://solscan.io/tx/${signature}`);
      
      // Refresh balance
      setTimeout(() => {
        refreshBalance();
        addLog('🔄 Balance refreshed');
      }, 3000);
      
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
      console.error(err);
    } finally {
      setTxLoading(false);
    }
  };

  // 🚀 PRIVATE TRANSFER - The main privacy feature!
  const handleTransfer = async () => {
    console.log('[Transfer] Button clicked!');
    addLog('🔘 Transfer button clicked...');

    if (!address || !walletProvider) {
      addLog('❌ Wallet not connected');
      return;
    }

    if (!recipient || recipient.length < 32) {
      addLog('❌ Enter a valid recipient address (min 32 chars)');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      addLog('❌ Enter a valid amount');
      return;
    }

    if (!balance?.available || balance.available < amount * 1e9) {
      addLog(`❌ Insufficient shielded balance. Have: ${(balance?.available || 0) / 1e9} SOL, Need: ${amount} SOL`);
      return;
    }

    // Check if signMessage is available
    if (typeof walletProvider.signMessage !== 'function') {
      addLog('❌ Wallet does not support signMessage. Make sure Phantom is connected.');
      console.error('[Transfer] walletProvider:', walletProvider);
      return;
    }

    setTxLoading(true);
    try {
      addLog(`🔒 Initiating ${transferType} transfer of ${amount} SOL to ${recipient.slice(0, 8)}...`);
      addLog(`   Type: ${transferType === 'internal' ? '🔐 Internal (amount hidden)' : '👤 External (sender anonymous)'}`);
      
      // Try to get Phantom's signMessage directly (the format the SDK expects)
      // The SDK was designed for @solana/wallet-adapter-react which uses Phantom
      let signMessageFn: (message: Uint8Array) => Promise<Uint8Array>;
      
      // Check if Phantom is available directly
      const phantom = (window as any).phantom?.solana || (window as any).solana;
      if (phantom && phantom.signMessage) {
        addLog('📱 Using Phantom signMessage directly');
        signMessageFn = async (message: Uint8Array) => {
          addLog(`🔐 Signing: "${new TextDecoder().decode(message).slice(0, 50)}..."`);
          const { signature } = await phantom.signMessage(message, 'utf8');
          addLog(`✅ Got signature (${signature.length} bytes)`);
          return signature;
        };
      } else {
        addLog('📱 Using Reown walletProvider.signMessage');
        signMessageFn = async (message: Uint8Array) => {
          addLog(`🔐 Signing: "${new TextDecoder().decode(message).slice(0, 50)}..."`);
          const signature = await walletProvider.signMessage(message);
          const result = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
          addLog(`✅ Got signature (${result.length} bytes)`);
          return result;
        };
      }
      
      addLog('📡 Calling SDK transfer...');
      
      // The SDK handles everything including ZK proof generation!
      const result = await transfer(
        recipient,
        amount,
        transferType,
        signMessageFn
      );
      
      addLog(`✅ Transfer complete!`);
      addLog(`   TX: ${result.tx_signature.slice(0, 20)}...`);
      addLog(`   Amount hidden: ${result.amount_hidden ? 'Yes ✓' : 'No'}`);
      addLog(`🔗 https://solscan.io/tx/${result.tx_signature}`);
      
      // Refresh balance
      setTimeout(() => {
        refreshBalance();
        addLog('🔄 Balance refreshed');
      }, 3000);
      
    } catch (err: any) {
      addLog(`❌ Transfer error: ${err.message}`);
      console.error('[Transfer] Error:', err);
      
      // Check for specific errors
      if (err.message?.includes('RecipientNotFound')) {
        addLog('💡 Tip: Recipient has not used ShadowWire. Try "external" transfer instead.');
      }
      if (err.message?.includes('Insufficient')) {
        addLog('💡 Tip: Make sure you have enough shielded balance. Deposit first!');
      }
      if (err.message?.includes('0x1780') || err.message?.includes('6016')) {
        addLog('💡 Error 0x1780: This is a program validation error. Try:');
        addLog('   - Different recipient address');
        addLog('   - Different amount (try 0.05 SOL)');
        addLog('   - Internal transfer instead of External');
      }
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">🧪 ShadowWire SDK Test</h1>
        <p className="text-gray-400 text-sm">Testing the official @radr/shadowwire SDK</p>
      </motion.div>

      {/* Status */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">SDK Status:</span>
            <span className={isReady ? 'text-green-400' : 'text-yellow-400'}>
              {isReady ? '✅ Ready' : '⏳ Loading...'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Wallet:</span>
            <span className="text-white font-mono text-sm">
              {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'Not connected'}
            </span>
          </div>
          {error && (
            <div className="text-red-400 text-sm">Error: {error}</div>
          )}
        </CardContent>
      </Card>

      {/* Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">ShadowWire Balance</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshBalance()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {balance ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Available:</span>
                <span className="text-white">{(balance.available / 1e9).toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Deposited:</span>
                <span className="text-white">{(balance.deposited / 1e9).toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pool:</span>
                <span className="text-gray-500 font-mono text-xs">{balance.pool_address?.slice(0, 12)}...</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No balance data</p>
          )}
        </CardContent>
      </Card>

      {/* Deposit/Withdraw Actions */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={handleDeposit}
          disabled={!isReady || txLoading}
        >
          <ArrowDown className="w-5 h-5 mr-2" />
          Deposit 0.11 SOL
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={handleWithdraw}
          disabled={!isReady || txLoading || !balance?.available}
        >
          <ArrowUp className="w-5 h-5 mr-2" />
          Withdraw All ({balance?.available ? (balance.available / 1e9).toFixed(4) : '0'} SOL)
        </Button>
      </div>

      {/* 🚀 PRIVATE TRANSFER - The main feature! */}
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Send className="w-4 h-4 text-brand" />
            Private Transfer (ZK-Powered)
          </h3>
          
          {/* Recipient */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter Solana address..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Amount (SOL)</label>
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="0.01"
              step="0.01"
              min="0.001"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Transfer Type Toggle */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Transfer Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTransferType('internal')}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  transferType === 'internal'
                    ? 'border-brand bg-brand/20 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <EyeOff className="w-4 h-4" />
                  <span className="font-medium">Internal</span>
                </div>
                <p className="text-xs opacity-70">Amount hidden (ZK)</p>
                <p className="text-xs opacity-50">Both must use ShadowWire</p>
              </button>
              <button
                onClick={() => setTransferType('external')}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  transferType === 'external'
                    ? 'border-brand bg-brand/20 text-white'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium">External</span>
                </div>
                <p className="text-xs opacity-70">Sender anonymous</p>
                <p className="text-xs opacity-50">Works with any wallet</p>
              </button>
            </div>
          </div>

          {/* Debug info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>SDK Ready: {isReady ? '✅' : '❌'} | Recipient: {recipient ? '✅' : '❌'} | Amount: {sendAmount ? '✅' : '❌'}</p>
            <p>Available: {balance?.available ? (balance.available / 1e9).toFixed(4) : '0'} SOL | Need: {sendAmount} SOL</p>
          </div>

          {/* Send Buttons */}
          <div className="space-y-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleTransfer}
              disabled={!isReady || txLoading || !recipient || !sendAmount}
            >
              <Send className="w-5 h-5 mr-2" />
              {txLoading ? 'Processing...' : `Send ${sendAmount} SOL (${transferType})`}
            </Button>
            
            {/* Alternative: Manual 2-step transfer */}
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={async () => {
                if (!address || !recipient || !sendAmount) return;
                setTxLoading(true);
                try {
                  addLog('🔧 Trying manual 2-step transfer (proof generated server-side)...');
                  const amount = parseFloat(sendAmount);
                  const result = await manualTransfer(recipient, amount);
                  addLog(`✅ Manual transfer complete! TX: ${result.tx_signature}`);
                  addLog(`🔗 https://solscan.io/tx/${result.tx_signature}`);
                  setTimeout(refreshBalance, 3000);
                } catch (err: any) {
                  addLog(`❌ Manual transfer error: ${err.message}`);
                  console.error(err);
                } finally {
                  setTxLoading(false);
                }
              }}
              disabled={!isReady || txLoading || !recipient || !sendAmount}
            >
              <Zap className="w-5 h-5 mr-2" />
              Try Manual 2-Step Transfer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand" />
            Activity Log
          </h3>
          <div className="bg-black/30 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs space-y-1">
            {log.map((line, i) => (
              <div key={i} className="text-gray-300">{line}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
