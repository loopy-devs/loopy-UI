import { useAppKitAccount } from '@reown/appkit/react';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { truncateAddress } from '@/lib/format';
import { cn } from '@/lib/cn';

export default function Header() {
  const { address } = useAppKitAccount();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-bg-secondary border-b border-white/5">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Loopy" className="h-8 w-8" />
          <span className="text-lg font-bold text-white tracking-tight">Loopy</span>
        </div>

        {/* Address pill */}
        {address && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyAddress}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl',
              'bg-bg-secondary border border-white/5',
              'text-sm transition-all duration-200',
              'hover:border-brand/30',
              copied && 'border-success/30 bg-success/5'
            )}
          >
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="font-mono text-gray-300">{truncateAddress(address, 4)}</span>
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-500" />
            )}
          </motion.button>
        )}
      </div>
    </header>
  );
}
