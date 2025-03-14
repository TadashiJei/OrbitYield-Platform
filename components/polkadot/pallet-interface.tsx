"use client";

import { useState, useEffect } from "react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StrategyConfig {
  name: string;
  description: string;
  risk: string;
  targetApy: number;
  protocol: string;
  assets: string[];
}

interface PalletInterfaceProps {
  className?: string;
}

export function PalletInterface({ className = "" }: PalletInterfaceProps) {
  const { api, selectedAccount, isConnected } = usePolkadot();
  const [activeTab, setActiveTab] = useState("query");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [palletMethods, setPalletMethods] = useState<{
    queries: string[];
    extrinsics: string[];
  }>({
    queries: [],
    extrinsics: [],
  });

  // Strategy form state
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    name: "",
    description: "",
    risk: "medium",
    targetApy: 5.0,
    protocol: "acala",
    assets: ["DOT"],
  });

  // Get pallet methods
  useEffect(() => {
    if (api && isConnected) {
      try {
        const queries = Object.keys(api.query.yieldStrategy || {});
        const extrinsics = Object.keys(api.tx.yieldStrategy || {});
        
        setPalletMethods({
          queries,
          extrinsics,
        });
      } catch (err) {
        console.error("Error getting pallet methods:", err);
        setError("Failed to retrieve pallet methods. The yield-strategy pallet might not be available in this chain.");
      }
    }
  }, [api, isConnected]);

  // Function to query pallet storage
  const queryPallet = async (method: string) => {
    if (!api || !isConnected) {
      setError("Please connect to Polkadot network first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults(null);

    try {
      if (!api.query.yieldStrategy) {
        throw new Error("Yield Strategy pallet not found in connected chain");
      }

      // @ts-ignore - Dynamic access to API methods
      const result = await api.query.yieldStrategy[method]();
      setResults(result.toHuman ? result.toHuman() : result.toString());
      setSuccess(`Successfully queried ${method}`);
    } catch (err) {
      console.error("Error querying pallet:", err);
      setError(`Failed to query pallet: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to send pallet extrinsic
  const sendExtrinsic = async (method: string, ...params: any[]) => {
    if (!api || !isConnected || !selectedAccount) {
      setError("Please connect to Polkadot network and select an account first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults(null);
    setTxHash(null);

    try {
      if (!api.tx.yieldStrategy) {
        throw new Error("Yield Strategy pallet not found in connected chain");
      }

      // @ts-ignore - Dynamic access to API methods
      const extrinsic: SubmittableExtrinsic<"promise", ISubmittableResult> = api.tx.yieldStrategy[method](...params);
      
      const unsub = await extrinsic.signAndSend(selectedAccount, { nonce: -1 }, (result) => {
        const { status, events, dispatchError } = result;

        if (status.isInBlock || status.isFinalized) {
          setTxHash(status.asInBlock.toHex());

          // Check if there was an error
          if (dispatchError) {
            let errorMessage;
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              errorMessage = `${decoded.section}.${decoded.method}: ${decoded.docs.join(" ")}`;
            } else {
              errorMessage = dispatchError.toString();
            }
            setError(`Transaction failed: ${errorMessage}`);
          } else {
            // Transaction succeeded
            setSuccess(`Transaction included in block: ${status.asInBlock.toHex()}`);
            
            // Process events
            const eventData = events
              .filter(({ event }) => api.events.yieldStrategy.some(e => e.is(event)))
              .map(({ event }) => ({
                method: event.method,
                section: event.section,
                data: event.data.toHuman(),
              }));
            
            if (eventData.length > 0) {
              setResults(eventData);
            }
          }

          if (status.isFinalized) {
            setSuccess(`Transaction finalized in block: ${status.asFinalized.toHex()}`);
            unsub();
          }
        }
      });
    } catch (err) {
      console.error("Error sending extrinsic:", err);
      setError(`Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  // Create a new yield strategy
  const createStrategy = async () => {
    if (!api || !isConnected) {
      setError("Please connect to Polkadot network first");
      return;
    }

    const params = [
      strategyConfig.name,
      strategyConfig.description,
      strategyConfig.risk,
      strategyConfig.targetApy * 100, // Convert to basis points
      strategyConfig.protocol,
      strategyConfig.assets,
    ];

    await sendExtrinsic("createStrategy", ...params);
  };

  // Handle input changes for strategy form
  const handleInputChange = (field: keyof StrategyConfig, value: string | number | string[]) => {
    setStrategyConfig({
      ...strategyConfig,
      [field]: value,
    });
  };

  // Fetch all strategies
  const fetchAllStrategies = async () => {
    await queryPallet("allStrategies");
  };

  // Fetch strategy by ID
  const [strategyId, setStrategyId] = useState("");
  const fetchStrategy = async () => {
    if (!strategyId) {
      setError("Please enter a strategy ID");
      return;
    }
    await queryPallet("strategies");
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle>Yield Strategy Pallet Interface</CardTitle>
        <CardDescription>
          Interact with the yield-strategy pallet on Polkadot
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect to a Polkadot network to interact with the pallet
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-4">
              <TabsTrigger value="query">Query Pallet</TabsTrigger>
              <TabsTrigger value="extrinsic">Send Extrinsic</TabsTrigger>
              <TabsTrigger value="strategy">Manage Strategies</TabsTrigger>
            </TabsList>

            {/* Query Pallet Tab */}
            <TabsContent value="query" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="query-method">Select Query Method</Label>
                  <Select onValueChange={(value) => queryPallet(value)}>
                    <SelectTrigger id="query-method">
                      <SelectValue placeholder="Select a query method" />
                    </SelectTrigger>
                    <SelectContent>
                      {palletMethods.queries.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Common Queries</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => queryPallet("allStrategies")}
                      disabled={loading || !palletMethods.queries.includes("allStrategies")}
                    >
                      All Strategies
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => queryPallet("strategyCount")}
                      disabled={loading || !palletMethods.queries.includes("strategyCount")}
                    >
                      Strategy Count
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => queryPallet("paused")}
                      disabled={loading || !palletMethods.queries.includes("paused")}
                    >
                      Pallet Paused
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy-id">Query Strategy by ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="strategy-id"
                      placeholder="Enter strategy ID"
                      value={strategyId}
                      onChange={(e) => setStrategyId(e.target.value)}
                    />
                    <Button 
                      onClick={fetchStrategy}
                      disabled={loading || !strategyId || !palletMethods.queries.includes("strategies")}
                    >
                      Query
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Send Extrinsic Tab */}
            <TabsContent value="extrinsic" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extrinsic-method">Select Extrinsic Method</Label>
                  <Select>
                    <SelectTrigger id="extrinsic-method">
                      <SelectValue placeholder="Select an extrinsic method" />
                    </SelectTrigger>
                    <SelectContent>
                      {palletMethods.extrinsics.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Common Actions</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendExtrinsic("pausePallet")}
                      disabled={loading || !palletMethods.extrinsics.includes("pausePallet")}
                    >
                      Pause Pallet
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sendExtrinsic("unpausePallet")}
                      disabled={loading || !palletMethods.extrinsics.includes("unpausePallet")}
                    >
                      Unpause Pallet
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Manage Strategies Tab */}
            <TabsContent value="strategy" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="strategy-name">Strategy Name</Label>
                  <Input
                    id="strategy-name"
                    placeholder="Enter strategy name"
                    value={strategyConfig.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strategy-description">Description</Label>
                  <Textarea
                    id="strategy-description"
                    placeholder="Enter strategy description"
                    rows={3}
                    value={strategyConfig.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="risk-level">Risk Level</Label>
                    <Select
                      value={strategyConfig.risk}
                      onValueChange={(value) => handleInputChange("risk", value)}
                    >
                      <SelectTrigger id="risk-level">
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-apy">Target APY (%)</Label>
                    <Input
                      id="target-apy"
                      type="number"
                      min="0"
                      step="0.1"
                      value={strategyConfig.targetApy}
                      onChange={(e) => handleInputChange("targetApy", parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <Select
                    value={strategyConfig.protocol}
                    onValueChange={(value) => handleInputChange("protocol", value)}
                  >
                    <SelectTrigger id="protocol">
                      <SelectValue placeholder="Select protocol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acala">Acala</SelectItem>
                      <SelectItem value="moonbeam">Moonbeam</SelectItem>
                      <SelectItem value="astar">Astar</SelectItem>
                      <SelectItem value="parallel">Parallel</SelectItem>
                      <SelectItem value="bifrost">Bifrost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Asset Selection</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                    {["DOT", "USDC", "USDT", "aUSD", "GLMR", "ASTR"].map((asset) => (
                      <Badge
                        key={asset}
                        variant={strategyConfig.assets.includes(asset) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (strategyConfig.assets.includes(asset)) {
                            handleInputChange(
                              "assets",
                              strategyConfig.assets.filter((a) => a !== asset)
                            );
                          } else {
                            handleInputChange("assets", [...strategyConfig.assets, asset]);
                          }
                        }}
                      >
                        {asset}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={createStrategy}
                  disabled={
                    loading ||
                    !strategyConfig.name ||
                    !strategyConfig.description ||
                    strategyConfig.assets.length === 0 ||
                    !palletMethods.extrinsics.includes("createStrategy")
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Strategy"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Results Section */}
        {(results || error || success || loading) && (
          <>
            <Separator className="my-4" />
            
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {txHash && (
              <div className="mb-4 text-sm">
                <Label>Transaction Hash</Label>
                <div className="p-2 bg-muted rounded-md font-mono text-xs overflow-auto">
                  {txHash}
                </div>
              </div>
            )}
            
            {results && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Results</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setResults(null)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <pre className="text-xs font-mono">
                    {typeof results === "string" 
                      ? results 
                      : JSON.stringify(results, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
