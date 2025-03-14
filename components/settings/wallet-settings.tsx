"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMetaMask } from "@/hooks/use-metamask";
import { usePolkadot } from "@/hooks/use-polkadot";
import { WalletConnect } from "@/components/ui/wallet-connect";
import {
  Check,
  Wallet,
  Globe,
  UnlinkIcon,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export function WalletSettings() {
  const { isConnected: isMetaMaskConnected, account: metaMaskAccount, disconnect: disconnectMetaMask } = useMetaMask();
  const { isConnected: isPolkadotConnected, selectedAccount: polkadotAccount, disconnect: disconnectPolkadot } = usePolkadot();
  
  const [pendingRequest, setPendingRequest] = useState(false);
  const [removalEmail, setRemovalEmail] = useState("");
  const [removalReason, setRemovalReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const formatAddress = (address: string | null | undefined) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const handleMetaMaskRemovalRequest = async () => {
    setIsSubmitting(true);
    try {
      // In a real app, you would call your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the removal request API
      const response = await fetch('/api/metamask/removal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: metaMaskAccount,
          email: removalEmail,
          reason: removalReason,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit removal request');
      }
      
      setPendingRequest(true);
      setShowSuccess(true);
      
      // Reset form
      setRemovalEmail("");
      setRemovalReason("");
    } catch (error) {
      console.error('Error submitting removal request:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Connected Wallets</h3>
        <p className="text-sm text-muted-foreground">
          Manage your connected blockchain wallets
        </p>
      </div>
      
      <div className="space-y-4">
        {(!isMetaMaskConnected && !isPolkadotConnected) && (
          <div className="text-center p-6 border border-dashed rounded-lg">
            <Wallet className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h4 className="font-medium mb-1">No wallets connected</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Connect a wallet to access cross-chain yield opportunities
            </p>
            <WalletConnect />
          </div>
        )}
        
        {isMetaMaskConnected && (
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <img 
                      src="/metamask-fox.svg" 
                      alt="MetaMask" 
                      className="h-6 w-6" 
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center">
                      MetaMask
                      {pendingRequest && (
                        <Badge variant="outline" className="ml-2 text-yellow-500 border-yellow-500">
                          <Clock className="mr-1 h-3 w-3" />
                          Removal Pending
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Ethereum Wallet
                    </CardDescription>
                  </div>
                </div>
                <a 
                  href={`https://etherscan.io/address/${metaMaskAccount}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-xs flex items-center"
                >
                  View on Etherscan
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <code className="text-xs bg-muted p-1 rounded">
                    {metaMaskAccount}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connection Status:</span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connected Since:</span>
                  <span className="text-sm">July 15, 2023</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnectMetaMask}
                disabled={pendingRequest}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              {pendingRequest ? (
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  Admin review in progress
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <UnlinkIcon className="mr-2 h-4 w-4" />
                      Request Removal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request MetaMask Wallet Removal</DialogTitle>
                      <DialogDescription>
                        For security purposes, wallet disconnection requires admin approval.
                        This helps prevent unauthorized removal of your connected wallets.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {showSuccess ? (
                      <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                        <Check className="h-4 w-4" />
                        <AlertTitle>Removal Request Submitted</AlertTitle>
                        <AlertDescription>
                          Your wallet removal request has been submitted and is pending admin approval.
                          You will receive an email notification once it has been processed.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email for Notification</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="your@email.com"
                              value={removalEmail}
                              onChange={(e) => setRemovalEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              We'll notify you once your request is processed
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Removal</Label>
                            <Textarea
                              id="reason"
                              placeholder="Please explain why you want to remove this wallet..."
                              value={removalReason}
                              onChange={(e) => setRemovalReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important Notice</AlertTitle>
                            <AlertDescription>
                              Removing this wallet will require you to reconnect it if you want to
                              access your positions associated with this address in the future.
                            </AlertDescription>
                          </Alert>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={handleMetaMaskRemovalRequest}
                            disabled={!removalEmail || !removalReason || isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Submit Removal Request
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        )}
        
        {isPolkadotConnected && polkadotAccount && (
          <Card className="border-polkadot-pink/20">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-polkadot-pink/10 flex items-center justify-center">
                    <img 
                      src="/polkadot-logo.svg" 
                      alt="Polkadot" 
                      className="h-6 w-6" 
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">Polkadot</CardTitle>
                    <CardDescription className="text-xs">
                      Substrate Wallet
                    </CardDescription>
                  </div>
                </div>
                <a 
                  href={`https://polkadot.subscan.io/account/${polkadotAccount.address}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-xs flex items-center"
                >
                  View on Subscan
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Address:</span>
                  <code className="text-xs bg-muted p-1 rounded">
                    {formatAddress(polkadotAccount.address)}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Account:</span>
                  <span className="text-sm">{polkadotAccount.meta.name || "Default Account"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connection Status:</span>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={disconnectPolkadot}
              >
                <UnlinkIcon className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Add New Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Connect additional wallets to OrbitYield
        </p>
      </div>
      
      <WalletConnect />
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Wallet Security</h3>
        <p className="text-sm text-muted-foreground">
          Best practices for keeping your wallets secure
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="rounded-md bg-amber-500/10 p-4 border border-amber-500/20">
          <div className="flex">
            <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="ml-3">
              <h5 className="text-sm font-medium text-amber-800 dark:text-amber-300">Security Tips</h5>
              <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Never share your seed phrase or private keys with anyone
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Always double-check transaction details before signing
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Consider using a hardware wallet for large holdings
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Keep your wallet software and browser extensions updated
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
