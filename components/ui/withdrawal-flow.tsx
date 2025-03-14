"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMetaMask } from "@/hooks/use-metamask";
import { usePolkadot } from "@/hooks/use-polkadot";
import { 
  ArrowRight, 
  Wallet, 
  Globe, 
  AlertCircle, 
  Check, 
  ArrowRightLeft,
  Coins
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletConnect } from "@/components/ui/wallet-connect";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface WithdrawalFlowProps {
  positionId?: string;
  className?: string;
}

// Define types for our data structures
type AssetSymbol = 'eth' | 'usdc' | 'dai' | 'usdt' | 'dot' | 'glmr' | 'astr' | 'para';
type ChainType = 'ethereum' | 'polkadot';
type PositionId = 'eth-compound-usdc-1' | 'polkadot-acala-dot-1';

interface Position {
  id: PositionId;
  name: string;
  chain: ChainType;
  protocol: string;
  asset: AssetSymbol;
  balance: number;
  apy: number;
  depositDate: string;
  earningsToDate: number;
  lockPeriod?: string;
  earlyWithdrawalFee?: number;
}

type Positions = Record<PositionId, Position>;

// Mock positions data - would come from API in real app
const mockPositions: Positions = {
  "eth-compound-usdc-1": {
    id: "eth-compound-usdc-1",
    name: "USDC Lending",
    chain: "ethereum",
    protocol: "Compound",
    asset: "usdc",
    balance: 1500,
    apy: 3.78,
    depositDate: "2025-01-15",
    earningsToDate: 9.45,
    earlyWithdrawalFee: 0
  },
  "polkadot-acala-dot-1": {
    id: "polkadot-acala-dot-1",
    name: "DOT Staking",
    chain: "polkadot",
    protocol: "Acala",
    asset: "dot",
    balance: 50,
    apy: 12.8,
    depositDate: "2025-02-20",
    earningsToDate: 0.85,
    lockPeriod: "30 days",
    earlyWithdrawalFee: 1.5
  }
};

export function WithdrawalFlow({ positionId, className = "" }: WithdrawalFlowProps) {
  // Default to first position if none specified
  const defaultPosition = positionId && positionId in mockPositions
    ? positionId as PositionId
    : Object.keys(mockPositions)[0] as PositionId;

  const [selectedPosition, setSelectedPosition] = useState<PositionId>(defaultPosition);
  const [amount, setAmount] = useState<string>("");
  const [withdrawPercentage, setWithdrawPercentage] = useState<number>(100);
  const [includeEarnings, setIncludeEarnings] = useState<boolean>(true);
  const [step, setStep] = useState<"select" | "review" | "confirm" | "success">("select");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected: isMetaMaskConnected } = useMetaMask();
  const { isConnected: isPolkadotConnected } = usePolkadot();

  const position = mockPositions[selectedPosition];
  const isConnectedToChain = position.chain === "ethereum" 
    ? isMetaMaskConnected 
    : isPolkadotConnected;
  
  const maxWithdrawAmount = position.balance;
  const earningsAmount = includeEarnings ? position.earningsToDate : 0;
  const totalWithdrawAmount = (maxWithdrawAmount * withdrawPercentage / 100) + earningsAmount;
  
  // Check if withdrawal has any penalties
  const hasEarlyWithdrawalFee = position.earlyWithdrawalFee && position.earlyWithdrawalFee > 0;
  const withdrawalFeeAmount = hasEarlyWithdrawalFee 
    ? totalWithdrawAmount * (position.earlyWithdrawalFee as number) / 100 
    : 0;
  const finalWithdrawAmount = totalWithdrawAmount - withdrawalFeeAmount;

  const handlePositionChange = (posId: string) => {
    if (posId in mockPositions) {
      setSelectedPosition(posId as PositionId);
      setWithdrawPercentage(100);
      setIncludeEarnings(true);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    
    if (value && !isNaN(parseFloat(value))) {
      const amountValue = parseFloat(value);
      const percentage = Math.min(100, Math.max(0, (amountValue / maxWithdrawAmount) * 100));
      setWithdrawPercentage(percentage);
    } else {
      setWithdrawPercentage(0);
    }
  };

  const handlePercentageChange = (value: number[]) => {
    const percentage = value[0];
    setWithdrawPercentage(percentage);
    setAmount((maxWithdrawAmount * percentage / 100).toString());
  };

  const handleIncludeEarningsChange = (checked: boolean) => {
    setIncludeEarnings(checked);
  };

  const handleMaxClick = () => {
    setAmount(maxWithdrawAmount.toString());
    setWithdrawPercentage(100);
  };

  const handleReview = () => {
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (parseFloat(amount) > maxWithdrawAmount) {
      setError(`Maximum withdrawal amount is ${maxWithdrawAmount} ${position.asset.toUpperCase()}`);
      return;
    }
    
    setError(null);
    setStep("review");
  };

  const handleConfirmWithdrawal = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // In a real app, this would call the blockchain to perform the withdrawal
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction delay
      
      // Check for random failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Transaction failed. Please try again.");
      }
      
      // Success
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setAmount("");
    setWithdrawPercentage(100);
    setIncludeEarnings(true);
    setError(null);
  };

  // If not connected to any wallet, show wallet connection UI
  if (!isMetaMaskConnected && !isPolkadotConnected) {
    return (
      <div className={className}>
        <Alert className="mb-4 border-yellow-500/20 bg-yellow-500/10 text-yellow-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet to withdraw your assets.
          </AlertDescription>
        </Alert>
        
        <WalletConnect />
      </div>
    );
  }

  // If connected but not to the selected chain's wallet
  if (!isConnectedToChain) {
    return (
      <div className={className}>
        <Alert className="mb-4 border-yellow-500/20 bg-yellow-500/10 text-yellow-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Wallet Connected</AlertTitle>
          <AlertDescription>
            Please connect your {position.chain === "ethereum" ? "MetaMask" : "Polkadot.js"} wallet to withdraw from this position.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect {position.chain === "ethereum" ? "MetaMask" : "Polkadot"} Wallet</CardTitle>
            <CardDescription>
              You need to connect your {position.chain === "ethereum" ? "MetaMask" : "Polkadot.js"} wallet to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {position.chain === "ethereum" ? (
              <Button 
                className="w-full web3-button bg-gradient-to-r from-[#627EEA]/20 to-[#627EEA]/40 border-[#627EEA]/30"
                onClick={() => window.location.reload()}
              >
                <Wallet className="mr-2 h-4 w-4" /> Connect MetaMask
              </Button>
            ) : (
              <Button 
                className="w-full web3-button bg-gradient-to-r from-polkadot-pink/20 to-polkadot-purple/20 border-polkadot-pink/30"
                onClick={() => window.location.reload()}
              >
                <Globe className="mr-2 h-4 w-4" /> Connect Polkadot Wallet
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {step === "select" && (
        <Card className="shadow-lg border-zinc-800/20">
          <CardHeader>
            <CardTitle>Withdraw Assets</CardTitle>
            <CardDescription>
              Withdraw your assets from active positions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={selectedPosition}
                onValueChange={handlePositionChange}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(mockPositions).map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      <div className="flex items-center">
                        {pos.chain === "ethereum" ? (
                          <Wallet className="mr-2 h-4 w-4 text-[#627EEA]" />
                        ) : (
                          <Globe className="mr-2 h-4 w-4 text-polkadot-pink" />
                        )}
                        {pos.protocol} - {pos.asset.toUpperCase()} ({pos.balance} {pos.asset.toUpperCase()})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="mb-2 font-medium">Position Details</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Protocol</span>
                  <span className="text-sm font-medium">{position.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Strategy</span>
                  <span className="text-sm font-medium">{position.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Balance</span>
                  <span className="text-sm font-medium">{position.balance} {position.asset.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">APY</span>
                  <span className="text-sm font-medium text-green-500">{position.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Earnings to Date</span>
                  <span className="text-sm font-medium text-green-500">+{position.earningsToDate} {position.asset.toUpperCase()}</span>
                </div>
                {position.lockPeriod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lock Period</span>
                    <span className="text-sm font-medium">{position.lockPeriod}</span>
                  </div>
                )}
                {hasEarlyWithdrawalFee && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Early Withdrawal Fee</span>
                    <span className="text-sm font-medium text-amber-500">{position.earlyWithdrawalFee}%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="withdrawal-amount">Withdrawal Amount</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleMaxClick}>
                        MAX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Withdraw entire position</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex space-x-2">
                <Input
                  id="withdrawal-amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <div className="w-16 text-center py-2 bg-muted rounded-md">
                  {position.asset.toUpperCase()}
                </div>
              </div>
              
              <div className="mt-4 mb-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <Slider
                  value={[withdrawPercentage]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handlePercentageChange}
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Switch 
                  id="include-earnings"
                  checked={includeEarnings}
                  onCheckedChange={handleIncludeEarningsChange}
                />
                <Label htmlFor="include-earnings">Include earnings ({position.earningsToDate} {position.asset.toUpperCase()})</Label>
              </div>
            </div>
            
            {hasEarlyWithdrawalFee && (
              <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Early Withdrawal Fee</AlertTitle>
                <AlertDescription>
                  Withdrawing before the lock period ends will incur a {position.earlyWithdrawalFee}% fee.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Total to Withdraw</span>
                <span className="text-lg font-bold">
                  {totalWithdrawAmount.toFixed(2)} {position.asset.toUpperCase()}
                </span>
              </div>
              {hasEarlyWithdrawalFee && (
                <>
                  <div className="flex justify-between items-center text-sm text-amber-500">
                    <span>Early Withdrawal Fee ({position.earlyWithdrawalFee}%)</span>
                    <span>-{withdrawalFeeAmount.toFixed(2)} {position.asset.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium mt-1 pt-1 border-t">
                    <span>Final Amount</span>
                    <span>{finalWithdrawAmount.toFixed(2)} {position.asset.toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full web3-button bg-gradient-to-r from-polkadot-pink to-polkadot-purple text-white"
              onClick={handleReview}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {step === "review" && (
        <Card className="shadow-lg border-zinc-800/20">
          <CardHeader>
            <CardTitle>Review Withdrawal</CardTitle>
            <CardDescription>
              Confirm the details of your withdrawal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium">{position.protocol} - {position.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Asset</span>
                <span className="text-sm font-medium">{position.asset.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Withdraw Amount</span>
                <span className="text-sm font-medium">{(maxWithdrawAmount * withdrawPercentage / 100).toFixed(2)} {position.asset.toUpperCase()}</span>
              </div>
              {includeEarnings && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Earnings</span>
                  <span className="text-sm font-medium text-green-500">+{position.earningsToDate} {position.asset.toUpperCase()}</span>
                </div>
              )}
              {hasEarlyWithdrawalFee && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Early Withdrawal Fee</span>
                  <span className="text-sm font-medium text-amber-500">-{withdrawalFeeAmount.toFixed(2)} {position.asset.toUpperCase()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Total to Receive</span>
                <span className="text-sm font-bold">{finalWithdrawAmount.toFixed(2)} {position.asset.toUpperCase()}</span>
              </div>
            </div>
            
            {hasEarlyWithdrawalFee && (
              <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-500">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Early Withdrawal Warning</AlertTitle>
                <AlertDescription>
                  You are withdrawing before the lock period ends. A {position.earlyWithdrawalFee}% fee will be applied to your withdrawal.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="mb-2 font-medium">Withdrawal Details</div>
              <div className="text-sm text-muted-foreground">
                <p>Funds will be sent to your connected wallet. The transaction typically takes 1-2 minutes to complete, but may take longer during periods of network congestion.</p>
                <p className="mt-2">By confirming this transaction, you acknowledge that you understand the terms of the withdrawal.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full web3-button bg-gradient-to-r from-polkadot-pink to-polkadot-purple text-white"
              onClick={handleConfirmWithdrawal}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Processing...
                </>
              ) : (
                <>
                  Confirm Withdrawal <ArrowRightLeft className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={handleReset}
              disabled={isProcessing}
            >
              Back to Edit
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {step === "success" && (
        <Card className="shadow-lg border-zinc-800/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Withdrawal Successful!</CardTitle>
            <CardDescription>
              Your assets have been successfully withdrawn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Transaction</span>
                <span className="text-sm font-medium font-mono">
                  {position.chain === "ethereum"
                    ? `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`
                    : `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Withdrawn</span>
                <span className="text-sm font-medium">{finalWithdrawAmount.toFixed(2)} {position.asset.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm font-medium">{position.protocol} - {position.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
              </div>
            </div>
            
            <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Funds Received</span>
                <span className="text-lg font-bold text-green-500">
                  {finalWithdrawAmount.toFixed(2)} {position.asset.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                The funds have been sent to your wallet and should be available immediately.
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full"
              onClick={() => window.location.href = "/portfolio"}
            >
              View Portfolio
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={handleReset}
            >
              Make Another Withdrawal
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
