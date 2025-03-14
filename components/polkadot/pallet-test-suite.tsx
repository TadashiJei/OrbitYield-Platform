"use client";

import { useState } from "react";
import { usePolkadot } from "@/hooks/use-polkadot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface TestCase {
  id: string;
  name: string;
  description: string;
  run: (api: any, account: any) => Promise<{ success: boolean; message: string; details?: any }>;
}

interface PalletTestSuiteProps {
  className?: string;
}

export function PalletTestSuite({ className = "" }: PalletTestSuiteProps) {
  const { api, selectedAccount, isConnected } = usePolkadot();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  // Define test cases
  const testCases: TestCase[] = [
    {
      id: "pallet_exists",
      name: "Pallet Existence",
      description: "Checks if the yield-strategy pallet exists in the runtime",
      run: async (api) => {
        try {
          if (!api.query.yieldStrategy) {
            return {
              success: false,
              message: "The yield-strategy pallet does not exist in this runtime",
            };
          }
          return {
            success: true,
            message: "The yield-strategy pallet exists in the runtime",
          };
        } catch (err) {
          return {
            success: false,
            message: `Error checking pallet existence: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
    {
      id: "pallet_methods",
      name: "Pallet Methods",
      description: "Checks if the pallet has the required methods",
      run: async (api) => {
        try {
          const requiredQueries = ["allStrategies", "strategyCount", "paused"];
          const requiredExtrinsics = ["createStrategy", "updateStrategy", "pausePallet", "unpausePallet"];
          
          const missingQueries = requiredQueries.filter(method => !api.query.yieldStrategy || !api.query.yieldStrategy[method]);
          const missingExtrinsics = requiredExtrinsics.filter(method => !api.tx.yieldStrategy || !api.tx.yieldStrategy[method]);
          
          if (missingQueries.length > 0 || missingExtrinsics.length > 0) {
            return {
              success: false,
              message: "Some required methods are missing",
              details: {
                missingQueries,
                missingExtrinsics,
              },
            };
          }
          
          return {
            success: true,
            message: "All required methods exist in the pallet",
            details: {
              queries: Object.keys(api.query.yieldStrategy || {}),
              extrinsics: Object.keys(api.tx.yieldStrategy || {}),
            },
          };
        } catch (err) {
          return {
            success: false,
            message: `Error checking pallet methods: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
    {
      id: "pallet_metadata",
      name: "Pallet Metadata",
      description: "Checks if the pallet metadata is correctly defined",
      run: async (api) => {
        try {
          // Get the pallet's metadata from the API
          const metadata = api.runtimeMetadata.asLatest.pallets.find(
            (pallet: any) => pallet.name.toString() === "YieldStrategy"
          );
          
          if (!metadata) {
            return {
              success: false,
              message: "Could not find YieldStrategy pallet metadata",
            };
          }
          
          return {
            success: true,
            message: "YieldStrategy pallet metadata is correctly defined",
            details: metadata.toHuman ? metadata.toHuman() : metadata,
          };
        } catch (err) {
          return {
            success: false,
            message: `Error checking pallet metadata: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
    {
      id: "pallet_state",
      name: "Pallet State",
      description: "Checks the current state of the pallet",
      run: async (api) => {
        try {
          // Only proceed if the pallet exists
          if (!api.query.yieldStrategy) {
            return {
              success: false,
              message: "The yield-strategy pallet does not exist in this runtime",
            };
          }
          
          // Check if the pallet is paused
          const isPaused = await api.query.yieldStrategy.paused();
          
          // Get the strategy count
          const strategyCount = await api.query.yieldStrategy.strategyCount();
          
          return {
            success: true,
            message: "Successfully retrieved pallet state",
            details: {
              isPaused: isPaused.toHuman ? isPaused.toHuman() : isPaused.toString(),
              strategyCount: strategyCount.toHuman ? strategyCount.toHuman() : strategyCount.toString(),
            },
          };
        } catch (err) {
          return {
            success: false,
            message: `Error checking pallet state: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
    {
      id: "weight_calculation",
      name: "Weight Calculation",
      description: "Tests the weight calculation for a basic extrinsic",
      run: async (api) => {
        try {
          // Only proceed if the pallet exists
          if (!api.tx.yieldStrategy) {
            return {
              success: false,
              message: "The yield-strategy pallet does not exist in this runtime",
            };
          }
          
          // Create a dummy extrinsic to test weight calculation
          const extrinsic = api.tx.yieldStrategy.pausePallet();
          
          // Get the payment info (which includes the weight)
          const paymentInfo = await extrinsic.paymentInfo(selectedAccount);
          
          return {
            success: true,
            message: "Successfully calculated extrinsic weight",
            details: {
              weight: paymentInfo.weight.toHuman ? paymentInfo.weight.toHuman() : paymentInfo.weight.toString(),
              partialFee: paymentInfo.partialFee.toHuman ? paymentInfo.partialFee.toHuman() : paymentInfo.partialFee.toString(),
            },
          };
        } catch (err) {
          return {
            success: false,
            message: `Error calculating extrinsic weight: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    },
    {
      id: "xcm_capability",
      name: "XCM Capability",
      description: "Checks if the runtime has XCM capability",
      run: async (api) => {
        try {
          // Check if the XCM pallet exists
          const hasXcmPallet = !!api.query.xcmPallet;
          
          // Check if the cumulus pallet exists (for parachain XCM)
          const hasCumulusPallet = !!api.query.parachainSystem;
          
          if (!hasXcmPallet && !hasCumulusPallet) {
            return {
              success: false,
              message: "The runtime does not have XCM capability",
            };
          }
          
          let details: any = {
            hasXcmPallet,
            hasCumulusPallet,
          };
          
          // If XCM pallet exists, check for key methods
          if (hasXcmPallet) {
            details.xcmMethods = {
              send: !!api.tx.xcmPallet?.send,
              reserveTransferAssets: !!api.tx.xcmPallet?.reserveTransferAssets,
            };
          }
          
          return {
            success: true,
            message: "The runtime has XCM capability",
            details,
          };
        } catch (err) {
          return {
            success: false,
            message: `Error checking XCM capability: ${err instanceof Error ? err.message : String(err)}`,
          };
        }
      },
    }
  ];

  // Run a single test
  const runTest = async (test: TestCase) => {
    if (!api || !isConnected) {
      return;
    }

    setRunningTest(test.id);
    setLoading(true);

    try {
      const result = await test.run(api, selectedAccount);
      setTestResults(prev => ({
        ...prev,
        [test.id]: result,
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          success: false,
          message: `Test execution error: ${err instanceof Error ? err.message : String(err)}`,
        },
      }));
    } finally {
      setRunningTest(null);
      setLoading(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    if (!api || !isConnected) {
      return;
    }

    setLoading(true);
    setAllPassed(null);
    
    const newResults: Record<string, { success: boolean; message: string; details?: any }> = {};
    
    for (const test of testCases) {
      setRunningTest(test.id);
      try {
        const result = await test.run(api, selectedAccount);
        newResults[test.id] = result;
      } catch (err) {
        newResults[test.id] = {
          success: false,
          message: `Test execution error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }
    
    setTestResults(newResults);
    setRunningTest(null);
    setLoading(false);
    
    // Check if all tests passed
    const allTestsPassed = Object.values(newResults).every(result => result.success);
    setAllPassed(allTestsPassed);
  };

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle>Yield Strategy Pallet Test Suite</CardTitle>
        <CardDescription>
          Comprehensive test suite for the yield-strategy pallet and XCM integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect to a Polkadot network to run tests
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button 
                onClick={runAllTests} 
                disabled={loading}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  "Run All Tests"
                )}
              </Button>
            </div>
            
            {allPassed !== null && (
              <Alert variant={allPassed ? "default" : "destructive"} className={allPassed ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}>
                {allPassed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  {allPassed 
                    ? "All tests passed! The yield-strategy pallet is functioning correctly." 
                    : "Some tests failed. Check the individual test results below for details."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              {testCases.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{test.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {test.description}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => runTest(test)}
                      disabled={loading}
                    >
                      {runningTest === test.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Run Test"
                      )}
                    </Button>
                  </div>
                  
                  {testResults[test.id] && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`rounded-full h-2 w-2 ${testResults[test.id].success ? "bg-green-500" : "bg-red-500"}`} />
                          <span className={`text-sm font-medium ${testResults[test.id].success ? "text-green-500" : "text-red-500"}`}>
                            {testResults[test.id].success ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <p className="text-xs">{testResults[test.id].message}</p>
                        
                        {testResults[test.id].details && (
                          <div className="mt-2">
                            <Label className="text-xs">Details</Label>
                            <ScrollArea className="h-[100px] rounded-md border mt-1 p-2">
                              <pre className="text-xs font-mono">
                                {JSON.stringify(testResults[test.id].details, null, 2)}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
