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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, AlertCircle, Zap, DollarSign, Lock, Code, Network, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RiskFactor {
  name: string;
  score: number; // 0-100
  description: string;
  icon: React.ReactNode;
}

interface RiskAssessmentProps {
  protocolName: string;
  chain: string;
  totalScore: number; // 0-100
  riskFactors: RiskFactor[];
  className?: string;
}

export function RiskAssessment({
  protocolName,
  chain,
  totalScore,
  riskFactors,
  className = ""
}: RiskAssessmentProps) {
  const [activeTab, setActiveTab] = useState("chart");

  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: "Low Risk", color: "green" };
    if (score < 70) return { level: "Medium Risk", color: "yellow" };
    return { level: "High Risk", color: "red" };
  };

  const riskLevel = getRiskLevel(totalScore);

  return (
    <Card className={`shadow-lg border-zinc-800/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Risk Assessment</CardTitle>
        <CardDescription>
          Comprehensive risk analysis for {protocolName} on {chain}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <Tabs defaultValue="chart" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Visualization</TabsTrigger>
            <TabsTrigger value="details">Risk Factors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="py-4">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-48 h-48">
                {/* Risk Meter */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background Arc */}
                  <path
                    d="M10,50 A40,40 0 1,1 90,50"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Colored Risk Arc */}
                  <path
                    d={`M10,50 A40,40 0 ${totalScore > 50 ? 1 : 0},1 ${
                      10 + 80 * (totalScore / 100)
                    },${totalScore > 50 ? 50 - Math.sqrt(1600 - Math.pow(totalScore - 50, 2)) : 50 + Math.sqrt(1600 - Math.pow(totalScore - 50, 2))}`}
                    fill="none"
                    stroke={
                      riskLevel.color === "green" 
                        ? "#22c55e" 
                        : riskLevel.color === "yellow" 
                          ? "#eab308" 
                          : "#ef4444"
                    }
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  
                  {/* Gauge Needle */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 35 * Math.cos((totalScore / 100 - 0.5) * Math.PI)}
                    y2={50 + 35 * Math.sin((totalScore / 100 - 0.5) * Math.PI)}
                    stroke="#1e293b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  
                  {/* Needle Center */}
                  <circle cx="50" cy="50" r="5" fill="#1e293b" />
                  
                  {/* Score Text */}
                  <text
                    x="50"
                    y="80"
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                    fontWeight="bold"
                  >
                    Score: {totalScore}/100
                  </text>
                </svg>
                
                {/* Risk Labels */}
                <div className="absolute top-2 left-0 text-green-500 text-xs font-medium">
                  Low Risk
                </div>
                <div className="absolute top-2 right-0 text-red-500 text-xs font-medium">
                  High Risk
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 
                  riskLevel.color === "green" 
                    ? "#22c55e" 
                    : riskLevel.color === "yellow" 
                      ? "#eab308" 
                      : "#ef4444" 
                }}>
                  {riskLevel.level}
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {riskLevel.color === "green" 
                    ? "This opportunity has a low risk profile and is suitable for conservative investors."
                    : riskLevel.color === "yellow"
                      ? "This opportunity has a moderate risk profile. Consider your risk tolerance before investing."
                      : "This opportunity has a high risk profile and is only suitable for risk-tolerant investors."
                  }
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="py-4">
            <TooltipProvider>
              <div className="space-y-4">
                {riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-12 flex justify-center">{factor.icon}</div>
                    <div className="flex-1 mx-4">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">{factor.name}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{factor.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${factor.score}%`,
                            backgroundColor:
                              factor.score < 30
                                ? "#22c55e"
                                : factor.score < 70
                                ? "#eab308"
                                : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right font-mono text-sm">
                      {factor.score}/100
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        Risk assessment is based on multiple factors including smart contract security, protocol maturity, 
        and historical performance. Risk profiles are updated regularly.
      </CardFooter>
    </Card>
  );
}

// Example usage component
export function RiskAssessmentExample() {
  const exampleRiskFactors = [
    {
      name: "Smart Contract Risk",
      score: 25,
      description: "Assessment of vulnerabilities in the protocol's smart contracts, audit quality, and code transparency.",
      icon: <Code className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Security & Custody",
      score: 35,
      description: "Evaluation of asset custody arrangements, private key management, and security infrastructure.",
      icon: <Lock className="h-5 w-5 text-indigo-500" />,
    },
    {
      name: "Protocol Maturity",
      score: 45,
      description: "Analysis of protocol age, TVL history, team experience, and community engagement.",
      icon: <Shield className="h-5 w-5 text-green-500" />,
    },
    {
      name: "Market Risk",
      score: 68,
      description: "Sensitivity to market volatility, liquidity depth, and correlation with broader market trends.",
      icon: <DollarSign className="h-5 w-5 text-yellow-500" />,
    },
    {
      name: "Complexity Risk",
      score: 75,
      description: "Assessment of the protocol's complexity, dependencies, and potential points of failure.",
      icon: <Network className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "Counterparty Risk",
      score: 85,
      description: "Evaluation of dependencies on third parties, oracles, and bridged assets.",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
    },
  ];

  return (
    <RiskAssessment
      protocolName="Acala"
      chain="Polkadot"
      totalScore={55}
      riskFactors={exampleRiskFactors}
    />
  );
}
