l"use client";

import { useMockRole } from "@/contexts/MockRoleContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface WrongNetworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetChainId?: number;
  targetNetworkName?: string;
}

export function WrongNetworkModal({ 
  open, 
  onOpenChange,
  targetChainId = 84532,
  targetNetworkName = "Base Sepolia"
}: WrongNetworkModalProps) {
  const { role, isInMockMode } = useMockRole();
  const chainId = 84532; // Base Sepolia for mock mode

  const handleSwitchNetwork = async () => {
    // In mock mode, network switching is not needed
    console.log("Network switching not available in mock mode");
  };

  const getCurrentNetworkName = () => {
    switch (chainId) {
      case 84532: return "Base Sepolia";
      case 8453: return "Base";
      case 31337: return "Localhost";
      default: return `Unknown (${chainId})`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-500">
            <AlertTriangle className="w-5 h-5" />
            Wrong Network
          </DialogTitle>
          <DialogDescription>
            You're connected to the wrong network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Current network: <strong>{getCurrentNetworkName()}</strong></p>
                <p>Required network: <strong>{targetNetworkName}</strong></p>
              </div>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleSwitchNetwork}
            className="w-full"
          >
            Switch to {targetNetworkName}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            If the network is not available in your wallet, it will be added automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

