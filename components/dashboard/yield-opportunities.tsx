"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ExternalLink, Shield } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Mock data for yield opportunities
const opportunities = [
  {
    id: 1,
    protocol: "Acala",
    chain: "Polkadot",
    asset: "DOT-USDT LP",
    apy: 24.5,
    tvl: "$12.4M",
    riskScore: 85,
    isAutoCompounding: true,
  },
  {
    id: 2,
    protocol: "Aave",
    chain: "Ethereum",
    asset: "ETH",
    apy: 3.2,
    tvl: "$980M",
    riskScore: 95,
    isAutoCompounding: false,
  },
  {
    id: 3,
    protocol: "PancakeSwap",
    chain: "Binance",
    asset: "CAKE-BNB LP",
    apy: 42.8,
    tvl: "$56.7M",
    riskScore: 75,
    isAutoCompounding: true,
  },
  {
    id: 4,
    protocol: "Moonwell",
    chain: "Polkadot",
    asset: "GLMR",
    apy: 8.7,
    tvl: "$34.2M",
    riskScore: 88,
    isAutoCompounding: true,
  },
  {
    id: 5,
    protocol: "Compound",
    chain: "Ethereum",
    asset: "USDC",
    apy: 2.8,
    tvl: "$1.2B",
    riskScore: 92,
    isAutoCompounding: false,
  },
]

export default function YieldOpportunities() {
  const [sortField, setSortField] = useState("apy")
  const [sortDirection, setSortDirection] = useState("desc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a]
    const bValue = b[sortField as keyof typeof b]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  const getChainBadgeColor = (chain: string) => {
    switch (chain) {
      case "Polkadot":
        return "bg-polkadot-pink hover:bg-polkadot-pink/80"
      case "Ethereum":
        return "bg-polkadot-purple hover:bg-polkadot-purple/80"
      case "Binance":
        return "bg-[#F3BA2F] hover:bg-[#F3BA2F]/80"
      case "Solana":
        return "bg-[#00FFA3] hover:bg-[#00FFA3]/80 text-black"
      case "Avalanche":
        return "bg-[#E84142] hover:bg-[#E84142]/80"
      default:
        return "bg-polkadot-pink hover:bg-polkadot-pink/80"
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 90) return "text-polkadot-green"
    if (score >= 80) return "text-polkadot-green"
    if (score >= 70) return "text-polkadot-orange"
    if (score >= 60) return "text-polkadot-orange"
    return "text-polkadot-red"
  }

  return (
    <Card className="rounded-xl border-border shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("protocol")}
                  className="flex items-center gap-1 px-0 font-medium"
                >
                  Protocol / Asset
                  {sortField === "protocol" && <ArrowUpDown className="h-4 w-4" />}
                </Button>
              </TableHead>
              <TableHead>Chain</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("apy")}
                  className="flex items-center gap-1 px-0 font-medium"
                >
                  APY
                  {sortField === "apy" && <ArrowUpDown className="h-4 w-4" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tvl")}
                  className="flex items-center gap-1 px-0 font-medium"
                >
                  TVL
                  {sortField === "tvl" && <ArrowUpDown className="h-4 w-4" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("riskScore")}
                  className="flex items-center gap-1 px-0 font-medium"
                >
                  Risk Score
                  {sortField === "riskScore" && <ArrowUpDown className="h-4 w-4" />}
                </Button>
              </TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOpportunities.map((opportunity) => (
              <TableRow key={opportunity.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{opportunity.protocol}</div>
                    <div className="text-sm text-muted-foreground">{opportunity.asset}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`rounded-full ${getChainBadgeColor(opportunity.chain)}`}>{opportunity.chain}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {opportunity.apy}%
                  {opportunity.isAutoCompounding && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="ml-2 rounded-full">
                            Auto
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl">
                          <p>Auto-compounding enabled</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TableCell>
                <TableCell className="text-right">{opportunity.tvl}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Shield className={`h-4 w-4 ${getRiskColor(opportunity.riskScore)}`} />
                    <span className={getRiskColor(opportunity.riskScore)}>{opportunity.riskScore}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" className="rounded-full bg-polkadot-pink hover:bg-polkadot-pink/90">
                      Deposit
                    </Button>
                    <Button size="icon" variant="outline" className="rounded-full">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

