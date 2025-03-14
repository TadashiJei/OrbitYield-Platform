"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ExternalLink, TrendingUp } from "lucide-react"

// Mock data for portfolio assets
const assets = [
  {
    id: 1,
    name: "DOT",
    chain: "Polkadot",
    protocol: "Acala",
    balance: "250 DOT",
    value: "$3,125.00",
    apy: 12.5,
    profit: "+$390.63",
    profitPercentage: 14.3,
  },
  {
    id: 2,
    name: "GLMR",
    chain: "Polkadot",
    protocol: "Moonwell",
    balance: "1,000 GLMR",
    value: "$250.00",
    apy: 8.7,
    profit: "+$21.75",
    profitPercentage: 9.5,
  },
  {
    id: 3,
    name: "ETH",
    chain: "Ethereum",
    protocol: "Aave",
    balance: "2.5 ETH",
    value: "$4,687.50",
    apy: 3.2,
    profit: "+$156.25",
    profitPercentage: 3.45,
  },
  {
    id: 4,
    name: "CAKE-BNB LP",
    chain: "Binance",
    protocol: "PancakeSwap",
    balance: "10.5 LP",
    value: "$2,362.50",
    apy: 42.8,
    profit: "+$843.75",
    profitPercentage: 55.6,
  },
  {
    id: 5,
    name: "USDC",
    chain: "Ethereum",
    protocol: "Compound",
    balance: "5,000 USDC",
    value: "$5,000.00",
    apy: 2.8,
    profit: "+$35.00",
    profitPercentage: 0.7,
  },
]

// Data for pie chart
const pieData = [
  { name: "DOT", value: 3125, color: "#E6007A" },
  { name: "GLMR", value: 250, color: "#552BBF" },
  { name: "ETH", value: 4687.5, color: "#627EEA" },
  { name: "CAKE-BNB LP", value: 2362.5, color: "#F3BA2F" },
  { name: "USDC", value: 5000, color: "#2775CA" },
]

// Data for chain allocation
const chainData = [
  { name: "Polkadot", value: 3375, color: "#E6007A" },
  { name: "Ethereum", value: 9687.5, color: "#627EEA" },
  { name: "Binance", value: 2362.5, color: "#F3BA2F" },
]

export default function PortfolioPage() {
  const [sortField, setSortField] = useState("value")
  const [sortDirection, setSortDirection] = useState("desc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedAssets = [...assets].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a]
    const bValue = b[sortField as keyof typeof b]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      // Handle currency strings by removing $ and , characters
      if (aValue.startsWith("$") && bValue.startsWith("$")) {
        const aNum = Number.parseFloat(aValue.replace("$", "").replace(",", ""))
        const bNum = Number.parseFloat(bValue.replace("$", "").replace(",", ""))
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum
      }

      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    return 0
  })

  const totalValue = assets.reduce((sum, asset) => {
    const value = Number.parseFloat(asset.value.replace("$", "").replace(",", ""))
    return sum + value
  }, 0)

  const totalProfit = assets.reduce((sum, asset) => {
    const profit = Number.parseFloat(asset.profit.replace("+$", "").replace(",", ""))
    return sum + profit
  }, 0)

  const averageProfitPercentage = assets.reduce((sum, asset) => sum + asset.profitPercentage, 0) / assets.length

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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Portfolio</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Overview of your assets and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-polkadot-green">+${totalProfit.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg. Profit %</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-polkadot-green">{averageProfitPercentage.toFixed(2)}%</p>
                  <TrendingUp className="ml-2 h-5 w-5 text-polkadot-green" />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 px-0 font-medium"
                    >
                      Asset
                      {sortField === "name" && <ArrowUpDown className="h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("value")}
                      className="flex items-center gap-1 px-0 font-medium"
                    >
                      Value
                      {sortField === "value" && <ArrowUpDown className="h-4 w-4" />}
                    </Button>
                  </TableHead>
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
                      onClick={() => handleSort("profitPercentage")}
                      className="flex items-center gap-1 px-0 font-medium"
                    >
                      Profit
                      {sortField === "profitPercentage" && <ArrowUpDown className="h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">{asset.balance}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`rounded-full ${getChainBadgeColor(asset.chain)}`}>{asset.chain}</Badge>
                    </TableCell>
                    <TableCell>{asset.protocol}</TableCell>
                    <TableCell className="text-right font-medium">{asset.value}</TableCell>
                    <TableCell className="text-right">{asset.apy}%</TableCell>
                    <TableCell className="text-right text-polkadot-green">
                      <div>{asset.profit}</div>
                      <div className="text-xs">{asset.profitPercentage}%</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="rounded-full">
                          Withdraw
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

        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle>Allocation</CardTitle>
            <CardDescription>Distribution of your assets</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="assets">
              <TabsList className="grid w-full grid-cols-2 rounded-full">
                <TabsTrigger value="assets" className="rounded-full">
                  By Asset
                </TabsTrigger>
                <TabsTrigger value="chains" className="rounded-full">
                  By Chain
                </TabsTrigger>
              </TabsList>
              <TabsContent value="assets" className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]} />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="chains" className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chainData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]} />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>

            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Rebalancing Status</h4>
              <div className="rounded-xl bg-polkadot-green/10 p-3 text-sm text-polkadot-green">
                <p>Your portfolio is optimally balanced across chains and assets.</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="rounded-full">
                  Rebalance Manually
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

