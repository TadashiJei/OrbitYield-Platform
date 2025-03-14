"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { usePolkadot } from "@/hooks/use-polkadot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';

export function PolkadotConnectButton({ variant = "default", size = "default", className = "" }) {
  const { 
    isConnected, 
    accounts, 
    selectedAccount, 
    connect, 
    selectAccount, 
    identity,
    isLoadingIdentity
  } = usePolkadot();
  
  const [showAccountsDialog, setShowAccountsDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect Polkadot wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectAccount = (account: InjectedAccountWithMeta) => {
    selectAccount(account);
  };

  if (isConnected && selectedAccount) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
            >
              <Globe className="mr-2 h-4 w-4" />
              {identity?.display || 
               `${selectedAccount.address.slice(0, 6)}...${selectedAccount.address.slice(-4)}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Polkadot Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="px-2 py-1.5">
              <p className="text-xs font-mono mb-1 overflow-hidden text-ellipsis">
                {selectedAccount.address}
              </p>
              {isLoadingIdentity ? (
                <p className="text-xs text-muted-foreground">Loading identity...</p>
              ) : identity ? (
                <div className="text-xs">
                  {identity.display && <p className="font-semibold">{identity.display}</p>}
                  {identity.email && <p className="text-muted-foreground">{identity.email}</p>}
                  {identity.twitter && <p className="text-muted-foreground">@{identity.twitter}</p>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No on-chain identity</p>
              )}
            </div>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowAccountsDialog(true)}>
              Switch Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Dialog open={showAccountsDialog} onOpenChange={setShowAccountsDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Polkadot Account</DialogTitle>
              <DialogDescription>
                Choose an account from your Polkadot.js extension.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {accounts.map((account) => (
                <div
                  key={account.address}
                  className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer hover:bg-muted ${
                    selectedAccount.address === account.address ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    handleSelectAccount(account);
                    setShowAccountsDialog(false);
                  }}
                >
                  <div className="flex items-center">
                    <div className="ml-2">
                      <div className="font-medium text-sm">
                        {account.meta.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[240px]">
                        {account.address}
                      </div>
                    </div>
                  </div>
                  
                  {selectedAccount.address === account.address && (
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleConnect}
      disabled={isConnecting}
    >
      <Globe className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Polkadot Wallet"}
    </Button>
  );
}
