import { motion } from 'framer-motion';
import { ArrowLeftRight, Lock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function Swap() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-success/10 mb-4"
        >
          <ArrowLeftRight className="h-8 w-8 text-success" />
        </motion.div>
        <h1 className="text-h1 text-white font-bold">Private Swap</h1>
        <p className="text-caption text-gray-400 mt-1">
          Swap tokens without revealing your wallet
        </p>
      </div>

      {/* Privacy Badge */}
      <div className="flex justify-center">
        <Badge variant="brand" className="px-3 py-1.5">
          <Lock className="h-3.5 w-3.5 mr-1.5" />
          ZK-Protected Swap
        </Badge>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-warning/10 mx-auto">
              <AlertTriangle className="h-10 w-10 text-warning" />
            </div>
            <h2 className="text-h2 text-white font-semibold">Coming Soon</h2>
            <p className="text-body text-gray-400 max-w-sm mx-auto">
              Private swaps are under development. This feature will allow you to swap tokens 
              through an ephemeral wallet, keeping your main wallet address completely private.
            </p>
            <div className="pt-4">
              <Button variant="outline" disabled>
                Notify Me
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card animate={false}>
        <CardContent className="space-y-4">
          <h3 className="text-body font-semibold text-white">How Private Swaps Work</h3>
          <div className="space-y-3">
            {[
              'Withdraw SOL from privacy pool to ephemeral wallet',
              'Ephemeral wallet executes swap via Jupiter',
              'Swapped tokens sent back to your shielded balance',
              'Ephemeral wallet is discarded - no trace to you',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-micro text-brand font-bold">{i + 1}</span>
                </div>
                <p className="text-caption text-gray-400">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
