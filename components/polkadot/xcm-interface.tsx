"use client";

import { useState, useEffect } from "react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface XcmInterfaceProps {
  className?: string;
}

// Supported parachains and their IDs (example values)
const PARACHAINS = [
  { id: 1000, name: "Statemint" },
  { id: 2000, name: "Acala" },
  { id: 2001, name: "Bifrost" },
  { id: 2004, name: "Moonbeam" },
  { id: 2006, name: "Astar" },
  { id: 2012, name: "Parallel" },
];

export function XcmInterface({ className = "" }: XcmInterfaceProps) {
  const { api, selectedAccount, isConnected } = usePolkadot();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transfer");

  // XCM Transfer State
  const [xcmTransfer, setXcmTransfer] = useState({
    destinationParachain: 2000, // Default to Acala
    destinationAddress: "",
    amount: "1",
    asset: "DOT",
  });

  // Remote Execution State
  const [remoteExecution, setRemoteExecution] = useState({
    targetParachain: 2000, // Default to Acala
    callData: "", // Hex encoded call data
    weight: "1000000000", // Default weight
  });

  // Handle XCM transfer form changes
  const handleTransferChange = (field: string, value: string | number) => {
    setXcmTransfer({
      ...xcmTransfer,
      [field]: value,
    });
  };

  // Handle Remote Execution form changes
  const handleExecutionChange = (field: string, value: string | number) => {
    setRemoteExecution({
      ...remoteExecution,
      [field]: value,
    });
  };

  // Send XCM Transfer
  const sendXcmTransfer = async () => {
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
      // Check if the destination address is valid
      if (!xcmTransfer.destinationAddress) {
        throw new Error("Please enter a valid destination address");
      }

      // Create the XCM transfer message
      // This is a simplified example - actual implementation would depend on the specific network
      const dest = {
        V1: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: xcmTransfer.destinationParachain },
              { AccountId32: { network: "Any", id: xcmTransfer.destinationAddress } },
            ],
          },
        },
      };

      const beneficiary = {
        V1: {
          parents: 0,
          interior: {
            X1: { AccountId32: { network: "Any", id: xcmTransfer.destinationAddress } },
          },
        },
      };

      const assets = {
        V1: [{
          id: {
            Concrete: {
              parents: 0,
              interior: "Here",
            },
          },
          fun: {
            Fungible: api.createType("Balance", xcmTransfer.amount),
          },
        }],
      };

      // Create and send the XCM transaction
      const extrinsic = api.tx.xcmPallet.reserveTransferAssets(
        dest,
        beneficiary,
        assets,
        0 // feeAssetItem
      );

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
            setSuccess(`XCM Transfer included in block: ${status.asInBlock.toHex()}`);
            
            // Process events
            const eventData = events
              .filter(({ event }) => 
                api.events.xcmPallet && 
                api.events.xcmPallet.some(e => e.is(event)))
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
            setSuccess(`XCM Transfer finalized in block: ${status.asFinalized.toHex()}`);
            unsub();
          }
        }
      });
    } catch (err) {
      console.error("Error sending XCM transfer:", err);
      setError(`Failed to send XCM transfer: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Send Remote Execution Call
  const sendRemoteExecution = async () => {
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
      // Create the XCM message for remote execution
      // This is a simplified example - actual implementation would vary
      const dest = {
        V1: {
          parents: 1,
          interior: {
            X1: [
              { Parachain: remoteExecution.targetParachain },
            ],
          },
        },
      };

      // The message consists of a Transact instruction to execute the call on the target chain
      const message = {
        V2: [
          {
            Transact: {
              originType: "SovereignAccount",
              requireWeightAtMost: remoteExecution.weight,
              call: {
                encoded: remoteExecution.callData,
              },
            },
          },
        ],
      };

      // Send the XCM message
      const extrinsic = api.tx.xcmPallet.send(dest, message);

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
            setSuccess(`XCM Message included in block: ${status.asInBlock.toHex()}`);
            
            // Process events
            const eventData = events
              .filter(({ event }) => 
                api.events.xcmPallet && 
                api.events.xcmPallet.some(e => e.is(event)))
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
            setSuccess(`XCM Message finalized in block: ${status.asFinalized.toHex()}`);
            unsub();
          }
        }
      });
    } catch (err) {
      console.error("Error sending XCM message:", err);
      setError(`Failed to send XCM message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle>XCM Interface</CardTitle>
        <CardDescription>
          Interact with Cross-Consensus Messaging (XCM) for cross-parachain communication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect to a Polkadot network to interact with XCM
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 gap-4">
              <TabsTrigger value="transfer">XCM Transfer</TabsTrigger>
              <TabsTrigger value="execute">Remote Execution</TabsTrigger>
            </TabsList>

            {/* XCM Transfer Tab */}
            <TabsContent value="transfer" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination-chain">Destination Parachain</Label>
                  <Select
                    value={xcmTransfer.destinationParachain.toString()}
                    onValueChange={(value) => handleTransferChange("destinationParachain", parseInt(value))}
                  >
                    <SelectTrigger id="destination-chain">
                      <SelectValue placeholder="Select destination chain" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARACHAINS.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name} (ID: {chain.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination-address">Destination Address</Label>
                  <Input
                    id="destination-address"
                    placeholder="Enter destination address"
                    value={xcmTransfer.destinationAddress}
                    onChange={(e) => handleTransferChange("destinationAddress", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      placeholder="Enter amount"
                      value={xcmTransfer.amount}
                      onChange={(e) => handleTransferChange("amount", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <Select
                      value={xcmTransfer.asset}
                      onValueChange={(value) => handleTransferChange("asset", value)}
                    >
                      <SelectTrigger id="asset">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOT">DOT</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={sendXcmTransfer}
                  disabled={
                    loading ||
                    !xcmTransfer.destinationAddress ||
                    !xcmTransfer.amount
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send XCM Transfer"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Remote Execution Tab */}
            <TabsContent value="execute" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-parachain">Target Parachain</Label>
                  <Select
                    value={remoteExecution.targetParachain.toString()}
                    onValueChange={(value) => handleExecutionChange("targetParachain", parseInt(value))}
                  >
                    <SelectTrigger id="target-parachain">
                      <SelectValue placeholder="Select target parachain" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARACHAINS.map((chain) => (
                        <SelectItem key={chain.id} value={chain.id.toString()}>
                          {chain.name} (ID: {chain.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="call-data">Call Data (Hex)</Label>
                  <Textarea
                    id="call-data"
                    placeholder="Enter hex-encoded call data"
                    rows={3}
                    value={remoteExecution.callData}
                    onChange={(e) => handleExecutionChange("callData", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hex-encoded call data for the target parachain. This should be a valid call format for the target chain.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    placeholder="Enter weight"
                    value={remoteExecution.weight}
                    onChange={(e) => handleExecutionChange("weight", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum weight for execution. Default: 1,000,000,000 (1 billion) weight units.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={sendRemoteExecution}
                  disabled={
                    loading ||
                    !remoteExecution.callData ||
                    !remoteExecution.weight
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send XCM Message"
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
                  <Label>XCM Events</Label>
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
