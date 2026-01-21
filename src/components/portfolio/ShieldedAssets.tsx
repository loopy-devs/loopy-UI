import { motion } from 'framer-motion';
import { Shield, Lock, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber, formatUSD } from '@/lib/format';

interface ShieldedBalance {
  sol: number;
  solLamports?: number;
  tokens: Array<{
    mint: string;
    balance: number;
    balanceFormatted?: number;
    symbol: string;
    decimals?: number;
  }>;
  totalUsd?: number;
}

interface ShieldedAssetsProps {
  shieldedBalance: ShieldedBalance | null;
  isLoading: boolean;
  solPrice?: number;
}

export default function ShieldedAssets({ shieldedBalance, isLoading, solPrice = 0 }: ShieldedAssetsProps) {
  const navigate = useNavigate();
  const hasShieldedAssets = shieldedBalance && (shieldedBalance.sol > 0 || shieldedBalance.tokens.length > 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand/10 bg-gradient-to-br from-bg-secondary to-brand/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Shielded</h3>
              <p className="text-xs text-gray-500">Private balance</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-brand">
            <Lock className="h-3 w-3" />
            <span>ZK Protected</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasShieldedAssets ? (
          <>
            {/* SOL Balance */}
            {shieldedBalance.sol > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                    alt="SOL"
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-white">SOL</p>
                    <p className="text-xs text-gray-500">Solana</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatNumber(shieldedBalance.sol, 4)}</p>
                  <p className="text-xs text-gray-500">{formatUSD(shieldedBalance.sol * solPrice)}</p>
                </div>
              </motion.div>
            )}

            {/* Token Balances */}
            {shieldedBalance.tokens.map((token, i) => (
              <motion.div
                key={token.mint}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-bg-tertiary/50 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-brand">{token.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{token.symbol}</p>
                    <p className="text-xs text-gray-500">Shielded</p>
                  </div>
                </div>
                <p className="font-semibold text-white">{formatNumber(token.balanceFormatted ?? token.balance, 2)}</p>
              </motion.div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => navigate('/shield?tab=unshield')}
              >
                Unshield
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate('/send')}
              >
                Send
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand/5 border border-brand/10 mb-4">
              <Shield className="h-8 w-8 text-brand/50" />
            </div>
            <p className="text-gray-400 mb-4">No shielded assets yet</p>
            <Button onClick={() => navigate('/shield')}>
              Shield Assets
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
