"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import { useWeb3 } from "@/contexts/Web3Context"; // Temporarily disabled
import { useMockRole } from "@/contexts/MockRoleContext";
import { truncateAddress, copyToClipboard } from "@/lib/web3-utils";
import { 
  Wallet, 
  Copy, 
  LogOut
} from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const { role, mockAccount, mockBalance, setRole } = useMockRole();
  const account = mockAccount;
  const balance = mockBalance;
  const isConnected = !!role;

  const handleCopyAddress = () => {
    if (account) {
      copyToClipboard(account);
      toast.success("Address copied to clipboard!");
    }
  };

  const handleLogout = () => {
    setRole(null);
    toast.success("Logged out successfully");
  };

  if (!isConnected || !account) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Not Connected</CardTitle>
              <CardDescription>
                Connect your wallet to view your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please connect your wallet using the button in the header
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/20 to-indigo-700/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Account</h1>
            <p className="text-muted-foreground">
              Manage your wallet and view account information
            </p>
          </div>

          <div className="space-y-6">
            {/* Wallet Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Address */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Mock Wallet Address</p>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 font-mono text-sm bg-muted px-4 py-3 rounded-md">
                      {account}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyAddress}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Balance */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mock Balance</p>
                    <p className="text-3xl font-bold">{balance} ETH</p>
                  </div>
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <Separator />

                {/* Role */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Role</p>
                    <p className="text-xl font-semibold capitalize">{role}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/20 text-green-500 border-green-500/30"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">As Investor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Investments</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Invested</span>
                    <span className="font-medium">- ETH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending Votes</span>
                    <span className="font-medium">-</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/my-investments">View Investments</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">As Founder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Campaigns Created</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Raised</span>
                    <span className="font-medium">- ETH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed Campaigns</span>
                    <span className="font-medium">-</span>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/my-campaigns">View Campaigns</a>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

