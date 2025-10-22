"use client";

import { useMockRole } from "@/contexts/MockRoleContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { role, setRole, isInMockMode } = useMockRole();
  const isConnecting = false; // No connection needed in mock mode
  const error = null; // No errors in mock mode

  const handleConnect = async () => {
    // In mock mode, this modal should not be used
    // Users should use the role selector instead
    console.log("Wallet connection not needed in mock mode");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your wallet to interact with campaigns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Wallet Options */}
          <div className="space-y-3">
            {/* MetaMask */}
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full justify-start gap-3 h-auto p-4"
              variant="outline"
            >
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                M
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">MetaMask</div>
                <div className="text-sm text-muted-foreground">
                  Connect using MetaMask
                </div>
              </div>
            </Button>

            {/* Other Wallets (Placeholder) */}
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full justify-start gap-3 h-auto p-4"
              variant="outline"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                W
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">WalletConnect</div>
                <div className="text-sm text-muted-foreground">
                  Scan with WalletConnect
                </div>
              </div>
            </Button>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full justify-start gap-3 h-auto p-4"
              variant="outline"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                C
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold">Coinbase Wallet</div>
                <div className="text-sm text-muted-foreground">
                  Connect to Coinbase Wallet
                </div>
              </div>
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground text-center">
            By connecting your wallet, you agree to our Terms of Service
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

