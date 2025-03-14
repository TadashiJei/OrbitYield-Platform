"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Shield, AlertTriangle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function RiskAssessment() {
  const riskFactors = [
    { name: "Smart Contract Risk", score: 85, color: "bg-polkadot-green" },
    { name: "Liquidity Risk", score: 72, color: "bg-polkadot-orange" },
    { name: "Volatility Risk", score: 65, color: "bg-polkadot-orange" },
    { name: "Protocol Risk", score: 90, color: "bg-polkadot-green" },
  ]

  const overallScore = Math.round(riskFactors.reduce((acc, factor) => acc + factor.score, 0) / riskFactors.length)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-polkadot-green"
    if (score >= 70) return "text-polkadot-orange"
    if (score >= 60) return "text-polkadot-orange"
    return "text-polkadot-red"
  }

  return (
    <Card className="rounded-xl border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Assessment
        </CardTitle>
        <CardDescription>AI-powered risk analysis of your portfolio</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Overall Risk Score</span>
          <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</span>
        </div>

        <div className="space-y-3">
          {riskFactors.map((factor) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm">{factor.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl">
                        <p>Risk assessment for {factor.name.toLowerCase()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className={`text-sm font-medium ${getScoreColor(factor.score)}`}>{factor.score}</span>
              </div>
              <Progress
                value={factor.score}
                className="h-2 rounded-full"
                indicatorClassName={`rounded-full ${factor.color}`}
              />
            </div>
          ))}
        </div>

        {overallScore < 70 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-polkadot-orange/10 p-2 text-polkadot-orange">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-xs">
              Your portfolio has some higher risk positions. Consider rebalancing to reduce exposure.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

