"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function DepositPage() {
  const [amount, setAmount] = useState("")
  const [selectedChain, setSelectedChain] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")

  const chains = [
    { value: "polkadot", label: "Polkadot" },
    { value: "ethereum", label: "Ethereum" },
    { value: "binance", label: "Binance Smart Chain" },
    { value: "solana", label: "Solana" },
    { value: "avalanche", label: "Avalanche" },
  ]

  const assets = {
    polkadot: [
      { value: "dot", label: "DOT" },
      { value: "glmr", label: "GLMR" },
      { value: "astr", label: "ASTR" },
    ],
    ethereum: [
      { value: "eth", label: "ETH" },
      { value: "usdc", label: "USDC" },
      { value: "dai", label: "DAI" },
    ],
    binance: [
      { value: "bnb", label: "BNB" },
      { value: "cake", label: "CAKE" },
      { value: "busd", label: "BUSD" },
    ],
    solana: [
      { value: "sol", label: "SOL" },
      { value: "ray", label: "RAY" },
    ],
    avalanche: [
      { value: "avax", label: "AVAX" },
      { value: "joe", label: "JOE" },
    ],
  }

  const getAssetOptions = () => {
    if (!selectedChain) return []
    return assets[selectedChain as keyof typeof assets] || []
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Deposit Funds</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Deposit Assets</CardTitle>
            <CardDescription>Deposit your assets to start earning yield across multiple chains</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-full">
                <TabsTrigger value="deposit" className="rounded-full">
                  Deposit
                </TabsTrigger>
                <TabsTrigger value="withdraw" className="rounded-full">
                  Withdraw
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deposit" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="chain">Select Chain</Label>
                  <Select value={selectedChain} onValueChange={setSelectedChain}>
                    <SelectTrigger id="chain" className="rounded-full">
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {chains.map((chain) => (
                        <SelectItem key={chain.value} value={chain.value}>
                          {chain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset">Select Asset</Label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset} disabled={!selectedChain}>
                    <SelectTrigger id="asset" className="rounded-full">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {getAssetOptions().map((asset) => (
                        <SelectItem key={asset.value} value={asset.value}>
                          {asset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="amount">Amount</Label>
                    <span className="text-xs text-muted-foreground">Balance: 0.00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="rounded-full"
                    />
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAmount("0")}>
                      Max
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full rounded-full bg-polkadot-pink hover:bg-polkadot-pink/90"
                    size="lg"
                    disabled={!amount || !selectedAsset}
                  >
                    Deposit
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-asset">Select Asset</Label>
                  <Select>
                    <SelectTrigger id="withdraw-asset" className="rounded-full">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="lp-token">ORBITYIELD LP Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <span className="text-xs text-muted-foreground">Balance: 0.00</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input id="withdraw-amount" type="number" placeholder="0.00" className="rounded-full" />
                    <Button variant="outline" size="sm" className="rounded-full">
                      Max
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full rounded-full bg-polkadot-pink hover:bg-polkadot-pink/90" size="lg">
                    Withdraw
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Deposit Summary</CardTitle>
            <CardDescription>Review your deposit details before confirming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-muted p-4">
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chain</span>
                  <span className="font-medium">
                    {selectedChain ? chains.find((c) => c.value === selectedChain)?.label : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Asset</span>
                  <span className="font-medium">
                    {selectedAsset ? getAssetOptions().find((a) => a.value === selectedAsset)?.label : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">{amount || "0.00"}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Gas Fee</span>
                    <span className="font-medium">~0.002 DOT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Estimated APY</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl">
                        <p>Estimated annual percentage yield based on current rates</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl font-bold text-polkadot-green">12.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-compounding</span>
                <span className="text-sm font-medium">Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <span className="text-sm font-medium text-polkadot-green">85/100</span>
              </div>
            </div>

            <div className="rounded-xl bg-polkadot-pink/10 p-3 text-sm">
              <p>
                By depositing assets, you agree to the terms and conditions of the ORBITYIELD protocol. Your assets will
                be allocated across multiple chains to maximize yield.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

