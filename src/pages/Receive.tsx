import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownLeft, Copy, Check, Shield, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppKitAccount } from '@reown/appkit/react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type ReceiveMode = 'wallet' | 'shielded';

export default function Receive() {
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const [mode, setMode] = useState<ReceiveMode>('wallet');
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center lg:text-left"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Receive</h1>
        <p className="text-gray-400 mt-1">Share your address to receive SOL or tokens</p>
      </motion.div>

      {/* Mode tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1.5 bg-bg-secondary rounded-2xl"
      >
        {(['wallet', 'shielded'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200',
              mode === m
                ? 'bg-brand text-white shadow-glow'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            {m === 'wallet' ? <Wallet className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            {m === 'wallet' ? 'To Wallet' : 'To Shielded'}
          </button>
        ))}
      </motion.div>

      {mode === 'wallet' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card animate={false} className="border-white/5">
            <CardContent className="p-6 space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-56 w-56 rounded-3xl bg-white p-4 flex items-center justify-center shadow-lg">
                    {address ? (
                      <QRCodeSVG
                        value={address}
                        size={192}
                        level="H"
                        includeMargin={false}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center">
                        <Wallet className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-brand rounded-xl flex items-center justify-center shadow-glow">
                    <ArrowDownLeft className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Your Wallet Address</p>
                <div className="bg-bg-tertiary rounded-2xl p-4 border border-white/5">
                  <p className="font-mono text-sm text-white break-all text-center leading-relaxed">
                    {address || 'Not connected'}
                  </p>
                </div>
              </div>

              {/* Copy button */}
              <Button
                size="lg"
                variant={copied ? 'secondary' : 'primary'}
                className="w-full h-14 text-base font-semibold rounded-2xl"
                onClick={copyAddress}
              >
                {copied ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5 mr-2" />
                    Copy Address
                  </>
                )}
              </Button>

              {/* Tip */}
              <div className="p-4 rounded-xl bg-brand/5 border border-brand/10">
                <p className="text-sm text-gray-400">
                  <span className="text-brand font-semibold">Tip:</span> For private receiving, 
                  use "To Shielded" mode. Funds will be deposited directly into your shielded balance.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card animate={false} className="border-white/5">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-brand/10 border border-brand/20 mx-auto mb-6">
                <Shield className="h-10 w-10 text-brand" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Shielded Deposits</h3>
              <p className="text-gray-400 max-w-sm mx-auto mb-6">
                To receive funds privately, first receive to your public wallet, 
                then shield them on the Shield page.
              </p>
              <Button onClick={() => navigate('/shield')}>
                Go to Shield
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
