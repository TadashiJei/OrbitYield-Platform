"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useMetaMask } from "@/hooks/use-metamask";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function WalletConnectButton({ variant = "default", size = "default", className }) {
  const { 
    isConnected, 
    account, 
    connect, 
    disconnect, 
    error, 
    isLoading, 
    isMetaMaskInstalled 
  } = useMetaMask();
  
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleRequestDisconnect = async (e) => {
    e.preventDefault();
    
    if (!account || !email) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/metamask/removal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account,
          email,
          reason
        }),
      });
      
      if (response.ok) {
        setRequestStatus('success');
        // Reset form
        setEmail("");
        setReason("");
      } else {
        setRequestStatus('error');
      }
    } catch (error) {
      console.error("Error requesting wallet disconnection:", error);
      setRequestStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isConnected && account) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowDisconnectDialog(true)}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {account.slice(0, 6)}...{account.slice(-4)}
        </Button>
        
        <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Wallet Disconnection</DialogTitle>
              <DialogDescription>
                As per security protocols, MetaMask connections can only be removed with admin approval.
                Please provide your email and reason for disconnection.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleRequestDisconnect}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="wallet" className="text-right">
                    Wallet
                  </Label>
                  <div className="col-span-3 font-mono text-sm">
                    {account.slice(0, 10)}...{account.slice(-8)}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="reason" className="text-right">
                    Reason
                  </Label>
                  <Textarea
                    id="reason"
                    className="col-span-3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
              
              {requestStatus === 'success' && (
                <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded-md text-sm">
                  Disconnection request submitted. An admin will review your request.
                </div>
              )}
              
              {requestStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-md text-sm">
                  Failed to submit request. Please try again later.
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowDisconnectDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !email}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
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
      disabled={isLoading}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
