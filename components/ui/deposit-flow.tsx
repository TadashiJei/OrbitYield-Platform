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
import { ArrowRight, Wallet, Globe, AlertCircle, Check, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletConnect } from "@/components/ui/wallet-connect";
import { RiskAssessment } from "@/components/ui/risk-assessment";

interface DepositFlowProps {
  opportunityId?: string;
  className?: string;
}

// Define types for our data structures
type AssetSymbol = 'eth' | 'usdc' | 'dai' | 'usdt' | 'dot' | 'glmr' | 'astr' | 'para';
type ChainType = 'ethereum' | 'polkadot';
type OpportunityId = 'eth-compound-usdc' | 'polkadot-acala-dot';

interface RiskFactorItem {
  name: string;
  score: number;
  description: string;
  icon: React.ReactNode;
}

interface YieldOpportunity {
  id: OpportunityId;
  name: string;
  chain: ChainType;
  protocol: string;
  asset: AssetSymbol;
  apy: number;
  tvl: number;
  riskScore: number;
  minAmount: number;
  riskFactors: RiskFactorItem[];
}

interface TokenBalances {
  [key: string]: number;
}

interface ChainBalances {
  ethereum: TokenBalances;
  polkadot: TokenBalances;
}

// Define the opportunities interface as a Record type instead of a mapped type
type Opportunities = Record<OpportunityId, YieldOpportunity>;

// Mock token balances - would come from wallet/chain data in real app
const mockTokenBalances: ChainBalances = {
  ethereum: {
    "eth": 1.25,
    "usdc": 2500,
    "dai": 2200,
    "usdt": 1800,
  },
  polkadot: {
    "dot": 150,
    "glmr": 2500,
    "astr": 5000,
    "para": 7500,
  }
};

// Mock opportunities data - would come from API in real app
const mockOpportunities: Opportunities = {
  "eth-compound-usdc": {
    id: "eth-compound-usdc",
    name: "USDC Lending",
    chain: "ethereum",
    protocol: "Compound",
    asset: "usdc",
    apy: 3.78,
    tvl: 1254000000,
    riskScore: 25,
    minAmount: 100,
    riskFactors: [
      {
        name: "Smart Contract Risk",
        score: 15,
        description: "Compound has been audited multiple times and has a strong security track record.",
        icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
      },
      {
        name: "Market Risk",
        score: 35,
        description: "USDC is a stable asset with low volatility.",
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      },
    ]
  },
  "polkadot-acala-dot": {
    id: "polkadot-acala-dot",
    name: "DOT Staking",
    chain: "polkadot",
    protocol: "Acala",
    asset: "dot",
    apy: 12.8,
    tvl: 235000000,
    riskScore: 55,
    minAmount: 10,
    riskFactors: [
      {
        name: "Smart Contract Risk",
        score: 45,
        description: "Acala has been audited but is still relatively new compared to established Ethereum protocols.",
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      },
      {
        name: "Market Risk",
        score: 65,
        description: "DOT has moderate volatility as a layer 1 token.",
        icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
      },
    ]
  }
};

export function DepositFlow({ opportunityId, className = "" }: DepositFlowProps) {
  // Default to first opportunity if none specified
  const defaultOpportunity = opportunityId && opportunityId in mockOpportunities
    ? opportunityId as OpportunityId
    : Object.keys(mockOpportunities)[0] as OpportunityId;

  const [selectedChain, setSelectedChain] = useState<ChainType>(
    mockOpportunities[defaultOpportunity].chain
  );
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>(
    mockOpportunities[defaultOpportunity].asset
  );
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityId>(defaultOpportunity);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"select" | "review" | "confirm" | "success">("select");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConnected: isMetaMaskConnected, account: metaMaskAccount } = useMetaMask();
  const { isConnected: isPolkadotConnected, selectedAccount: polkadotAccount } = usePolkadot();

  const opportunity = mockOpportunities[selectedOpportunity];
  const isConnectedToChain = selectedChain === "ethereum" 
    ? isMetaMaskConnected 
    : isPolkadotConnected;
  const walletBalance = selectedChain === "ethereum"
    ? mockTokenBalances.ethereum[selectedAsset as keyof typeof mockTokenBalances.ethereum] || 0
    : mockTokenBalances.polkadot[selectedAsset as keyof typeof mockTokenBalances.polkadot] || 0;
  
  const handleChainChange = (chain: string) => {
    setSelectedChain(chain as ChainType);
    
    // Reset asset and opportunity based on chain
    const chainOpportunities = Object.values(mockOpportunities)
      .filter(opp => opp.chain === chain);
    
    if (chainOpportunities.length > 0) {
      setSelectedAsset(chainOpportunities[0].asset);
      setSelectedOpportunity(chainOpportunities[0].id);
    }
  };

  const handleAssetChange = (asset: string) => {
    setSelectedAsset(asset as AssetSymbol);
    
    // Find matching opportunity for this asset on the selected chain
    const matchingOpportunity = Object.values(mockOpportunities)
      .find(opp => opp.chain === selectedChain && opp.asset === asset);
    
    if (matchingOpportunity) {
      setSelectedOpportunity(matchingOpportunity.id);
    }
  };

  const handleOpportunityChange = (opportunityId: string) => {
    setSelectedOpportunity(opportunityId as OpportunityId);
    
    // Update chain and asset to match the selected opportunity
    if (opportunityId in mockOpportunities) {
      const opp = mockOpportunities[opportunityId as OpportunityId];
      setSelectedChain(opp.chain);
      setSelectedAsset(opp.asset);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleMaxClick = () => {
    setAmount(walletBalance.toString());
  };

  const handleConfirmDeposit = async () => {
    // Reset error state
    setError(null);
    
    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (numAmount > walletBalance) {
      setError("Insufficient balance");
      return;
    }
    
    if (numAmount < opportunity.minAmount) {
      setError(`Minimum deposit amount is ${opportunity.minAmount} ${selectedAsset.toUpperCase()}`);
      return;
    }
    
    // Move to review step
    setStep("review");
  };

  const handleSubmitDeposit = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // In a real app, this would call the blockchain to perform the deposit
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
            Please connect your wallet to deposit assets into yield opportunities.
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
            Please connect your {selectedChain === "ethereum" ? "MetaMask" : "Polkadot.js"} wallet to deposit into this opportunity.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect {selectedChain === "ethereum" ? "MetaMask" : "Polkadot"} Wallet</CardTitle>
            <CardDescription>
              You need to connect your {selectedChain === "ethereum" ? "MetaMask" : "Polkadot.js"} wallet to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChain === "ethereum" ? (
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
            <CardTitle>Deposit Assets</CardTitle>
            <CardDescription>
              Select an asset and amount to deposit into a yield opportunity
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
              <Label htmlFor="chain">Blockchain</Label>
              <Select
                value={selectedChain}
                onValueChange={handleChainChange}
              >
                <SelectTrigger id="chain">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">
                    <div className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4 text-[#627EEA]" />
                      Ethereum
                    </div>
                  </SelectItem>
                  <SelectItem value="polkadot">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-polkadot-pink" />
                      Polkadot
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select
                value={selectedAsset}
                onValueChange={handleAssetChange}
              >
                <SelectTrigger id="asset">
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  {selectedChain === "ethereum" ? (
                    <>
                      <SelectItem value="eth">ETH</SelectItem>
                      <SelectItem value="usdc">USDC</SelectItem>
                      <SelectItem value="dai">DAI</SelectItem>
                      <SelectItem value="usdt">USDT</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="dot">DOT</SelectItem>
                      <SelectItem value="glmr">GLMR</SelectItem>
                      <SelectItem value="astr">ASTR</SelectItem>
                      <SelectItem value="para">PARA</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount</Label>
                <span className="text-xs text-muted-foreground">
                  Balance: {walletBalance} {selectedAsset.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={handleAmountChange}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={handleMaxClick}>
                        MAX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use maximum available balance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="mb-2 font-medium">Yield Opportunity</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Protocol</span>
                    <span className="text-sm font-medium">{opportunity.protocol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Strategy</span>
                    <span className="text-sm font-medium">{opportunity.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">APY</span>
                    <span className="text-sm font-medium text-green-500">{opportunity.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Risk Level</span>
                    <span className={`text-sm font-medium ${
                      opportunity.riskScore < 30 
                        ? "text-green-500" 
                        : opportunity.riskScore < 70 
                          ? "text-yellow-500" 
                          : "text-red-500"
                    }`}>
                      {opportunity.riskScore < 30 
                        ? "Low" 
                        : opportunity.riskScore < 70 
                          ? "Medium" 
                          : "High"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full web3-button bg-gradient-to-r from-polkadot-pink to-polkadot-purple text-white"
              onClick={handleConfirmDeposit}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {step === "review" && (
        <div className="space-y-6">
          <Card className="shadow-lg border-zinc-800/20">
            <CardHeader>
              <CardTitle>Review Deposit</CardTitle>
              <CardDescription>
                Confirm the details of your deposit
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
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm font-medium font-mono">
                    {selectedChain === "ethereum" 
                      ? `${metaMaskAccount?.slice(0, 6)}...${metaMaskAccount?.slice(-4)}`
                      : `${polkadotAccount?.address.slice(0, 6)}...${polkadotAccount?.address.slice(-4)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Asset</span>
                  <span className="text-sm font-medium">{selectedAsset.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">{amount} {selectedAsset.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Destination</span>
                  <span className="text-sm font-medium">{opportunity.protocol} - {opportunity.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expected APY</span>
                  <span className="text-sm font-medium text-green-500">{opportunity.apy}%</span>
                </div>
              </div>
              
              <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Estimated Annual Yield</span>
                  <span className="text-lg font-bold text-green-500">
                    {(parseFloat(amount) * opportunity.apy / 100).toFixed(2)} {selectedAsset.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on current APY of {opportunity.apy}%. Actual yield may vary.
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full web3-button bg-gradient-to-r from-polkadot-pink to-polkadot-purple text-white"
                onClick={handleSubmitDeposit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Processing...
                  </>
                ) : (
                  <>
                    Confirm Deposit <ArrowRightLeft className="ml-2 h-4 w-4" />
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
          
          <RiskAssessment
            protocolName={opportunity.protocol}
            chain={selectedChain === "ethereum" ? "Ethereum" : "Polkadot"}
            totalScore={opportunity.riskScore}
            riskFactors={opportunity.riskFactors}
          />
        </div>
      )}
      
      {step === "success" && (
        <Card className="shadow-lg border-zinc-800/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Deposit Successful!</CardTitle>
            <CardDescription>
              Your assets have been successfully deposited
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Transaction</span>
                <span className="text-sm font-medium font-mono">
                  {selectedChain === "ethereum"
                    ? `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`
                    : `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium">{amount} {selectedAsset.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Destination</span>
                <span className="text-sm font-medium">{opportunity.protocol} - {opportunity.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected APY</span>
                <span className="text-sm font-medium text-green-500">{opportunity.apy}%</span>
              </div>
            </div>
            
            <div className="rounded-lg border p-4 bg-green-500/5 border-green-500/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Estimated Annual Yield</span>
                <span className="text-lg font-bold text-green-500">
                  {(parseFloat(amount) * opportunity.apy / 100).toFixed(2)} {selectedAsset.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Track your deposits and yields in the Portfolio section.
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full"
              onClick={() => window.location.href = "/portfolio"}
            >
              View in Portfolio
            </Button>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={handleReset}
            >
              Make Another Deposit
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
