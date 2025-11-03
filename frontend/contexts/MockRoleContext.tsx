"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "investor" | "founder" | null;

interface MockRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  mockAccount: string | null;
  mockBalance: string;
  isInMockMode: boolean;
  isClient: boolean;
  canChangeRole: boolean; // New: indicates if user can still choose/change role
}

const MockRoleContext = createContext<MockRoleContextType | undefined>(undefined);

// Mock wallet addresses - different for each role
const MOCK_WALLETS = {
  investor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  founder: "0x89abcdef0123456789abcdef0123456789abcdef",
};

const MOCK_BALANCES = {
  investor: "15.8432",
  founder: "8.2156",
};

export function MockRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);
  const [isClient, setIsClient] = useState(false);

  // Mock wallet data - different address for each role
  const mockAccount = role ? MOCK_WALLETS[role] : null;
  const mockBalance = role ? MOCK_BALANCES[role] : "0";
  
  // Once a role is set, user cannot change it (must logout first)
  const canChangeRole = role === null;

  useEffect(() => {
    // Mark as client-side
    setIsClient(true);
    
    // Load saved role from localStorage
    const savedRole = localStorage.getItem("mockRole") as UserRole;
    if (savedRole && (savedRole === "investor" || savedRole === "founder")) {
      setRole(savedRole);
    }
  }, []);

  const handleSetRole = (newRole: UserRole) => {
    // Only allow setting role if no role is currently set, or if logging out
    if (role === null || newRole === null) {
      setRole(newRole);
      if (newRole) {
        localStorage.setItem("mockRole", newRole);
      } else {
        localStorage.removeItem("mockRole");
      }
    }
    // Silently ignore role switch attempts when already logged in
  };

  return (
    <MockRoleContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        mockAccount,
        mockBalance,
        isInMockMode: false, // Disabled to read from real blockchain
        isClient,
        canChangeRole,
      }}
    >
      {children}
    </MockRoleContext.Provider>
  );
}

export function useMockRole() {
  const context = useContext(MockRoleContext);
  if (context === undefined) {
    throw new Error("useMockRole must be used within a MockRoleProvider");
  }
  return context;
}

