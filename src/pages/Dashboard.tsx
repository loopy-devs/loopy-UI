import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import BalanceCard from '@/components/portfolio/BalanceCard';
import ActionButtons from '@/components/portfolio/ActionButtons';
import TokenList from '@/components/portfolio/TokenList';
import ShieldedAssets from '@/components/portfolio/ShieldedAssets';
import { useWalletTokens } from '@/hooks/useWalletTokens';
import { useShieldedBalance } from '@/hooks/useShieldedBalance';
import { useCacheStore } from '@/stores/cache';
import { API_BASE_URL } from '@/config/constants';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export default function Dashboard() {
  const { address } = useAppKitAccount();
  const { tokens, totalUsdValue, isLoading: tokensLoading } = useWalletTokens();
  const { balance: shieldedBalance, isLoading: shieldedLoading } = useShieldedBalance();
  const [solPrice, setSolPrice] = useState(0);
  const { tokenPrices, setTokenPrices } = useCacheStore();
  const hasFetchedPrice = useRef(false);

  // Fetch SOL price once on mount using backend API (like Send page)
  useEffect(() => {
    if (hasFetchedPrice.current) return;
    
    // Check cache first
    const cachedPrice = tokenPrices?.data?.[SOL_MINT];
    if (cachedPrice) {
      setSolPrice(cachedPrice);
      hasFetchedPrice.current = true;
      return;
    }

    hasFetchedPrice.current = true;
    
    // Fetch from backend API (same as Send page)
    fetch(`${API_BASE_URL}/prices/${SOL_MINT}`)
      .then(res => res.json())
      .then(data => {
        const price = data.price || data.usdPrice || 0;
        setSolPrice(price);
        setTokenPrices({ [SOL_MINT]: price });
      })
      .catch(() => setSolPrice(0));
  }, []);

  const shieldedUsdValue = (shieldedBalance?.sol || 0) * solPrice;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden lg:block"
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Portfolio</h1>
        <p className="text-gray-400 mt-1">Manage your assets and privacy</p>
      </motion.div>

      {/* Main grid - 2/3 + 1/3 on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <BalanceCard
            totalBalance={totalUsdValue + shieldedUsdValue}
            change24h={0}
            shieldedBalance={shieldedUsdValue}
            isLoading={tokensLoading && shieldedLoading}
          />

          {/* Action Buttons */}
          <ActionButtons />

          {/* Wallet Assets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Wallet Assets</h2>
            </div>
            <TokenList
              tokens={tokens}
              walletAddress={address}
              isLoading={tokensLoading}
              emptyMessage="No tokens in your wallet"
            />
          </div>
        </div>

        {/* Sidebar - Shielded Assets */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-10">
            <ShieldedAssets
              shieldedBalance={shieldedBalance}
              isLoading={shieldedLoading}
              solPrice={solPrice}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
