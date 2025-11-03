"use client";

import { useMockRole } from "@/contexts/MockRoleContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, UserCircle, Building2, LogOut } from "lucide-react";
import { truncateAddress } from "@/lib/web3-utils";
import { useRouter } from "next/navigation";

export function RoleSelector() {
  const router = useRouter();
  const { role, setRole, mockAccount, mockBalance, isClient } = useMockRole();

  const handleLogout = () => {
    setRole(null);
    router.push("/");
  };

  // Prevent hydration mismatch by only rendering on client
  if (!isClient) {
    return (
      <div className="flex items-center gap-3" suppressHydrationWarning>
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" suppressHydrationWarning />
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" suppressHydrationWarning />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex items-center gap-3" suppressHydrationWarning>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Setting role to investor");
            setRole("investor");
          }}
        >
          <UserCircle className="w-4 h-4 mr-2" />
          Login as Investor
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Setting role to founder");
            setRole("founder");
          }}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Login as Founder
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" suppressHydrationWarning />
          <span className="font-mono">{truncateAddress(mockAccount!)}</span>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {mockBalance} ETH
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">Wallet Address</p>
          <p className="text-xs font-mono text-foreground mb-2">{mockAccount}</p>
          <p className="text-xs text-muted-foreground">Role</p>
          <p className="text-sm font-medium capitalize flex items-center gap-2">
            {role === "investor" ? (
              <UserCircle className="w-4 h-4" />
            ) : (
              <Building2 className="w-4 h-4" />
            )}
            {role}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This wallet is registered as a {role}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileRoleSelector() {
  const router = useRouter();
  const { role, setRole, mockAccount, mockBalance, isClient } = useMockRole();

  const handleLogout = () => {
    setRole(null);
    router.push("/");
  };

  // Prevent hydration mismatch by only rendering on client
  if (!isClient) {
    return (
      <>
        <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
        <div className="h-9 w-full bg-muted animate-pulse rounded-md" />
      </>
    );
  }

  if (!role) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            console.log("Mobile: Setting role to investor");
            setRole("investor");
          }}
        >
          <UserCircle className="w-4 h-4 mr-2" />
          Login as Investor
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            console.log("Mobile: Setting role to founder");
            setRole("founder");
          }}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Login as Founder
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="px-3 py-2 bg-muted rounded-md">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          {role === "investor" ? (
            <UserCircle className="w-3 h-3" />
          ) : (
            <Building2 className="w-3 h-3" />
          )}
          <span className="capitalize font-medium">{role}</span>
        </p>
        <p className="text-sm font-mono">{truncateAddress(mockAccount!)}</p>
        <p className="text-xs text-muted-foreground mt-1">{mockBalance} ETH</p>
        <p className="text-xs text-muted-foreground mt-2 italic">
          This wallet is registered as a {role}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="w-full text-red-500"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </>
  );
}

