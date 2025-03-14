"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", value: 1000 },
  { name: "Feb", value: 1200 },
  { name: "Mar", value: 1100 },
  { name: "Apr", value: 1400 },
  { name: "May", value: 1800 },
  { name: "Jun", value: 2000 },
  { name: "Jul", value: 2400 },
]

const chainAllocation = [
  { chain: "Polkadot", percentage: 45, color: "#E6007A" },
  { chain: "Ethereum", percentage: 25, color: "#552BBF" },
  { chain: "Binance", percentage: 15, color: "#F3BA2F" },
  { chain: "Solana", percentage: 10, color: "#00FFA3" },
  { chain: "Avalanche", percentage: 5, color: "#E84142" },
]

export default function PortfolioOverview() {
  const [timeframe, setTimeframe] = useState("1m")

  return (
    <Card className="rounded-xl border-border shadow-sm">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your total assets and performance across all chains</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h3 className="text-3xl font-bold">$24,680.45</h3>
            <div className="flex items-center text-sm">
              <span className="flex items-center text-polkadot-green">
                <ArrowUp className="mr-1 h-4 w-4" />
                8.34%
              </span>
              <span className="ml-2 text-muted-foreground">Past {timeframe}</span>
            </div>
          </div>
          <Tabs defaultValue="1m" onValueChange={setTimeframe}>
            <TabsList className="rounded-full">
              <TabsTrigger value="1d" className="rounded-full">
                1D
              </TabsTrigger>
              <TabsTrigger value="1w" className="rounded-full">
                1W
              </TabsTrigger>
              <TabsTrigger value="1m" className="rounded-full">
                1M
              </TabsTrigger>
              <TabsTrigger value="1y" className="rounded-full">
                1Y
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E6007A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#E6007A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#E6007A" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6">
          <h4 className="mb-2 font-medium">Chain Allocation</h4>
          <div className="mb-2 flex h-4 w-full overflow-hidden rounded-full">
            {chainAllocation.map((chain, index) => (
              <div
                key={chain.chain}
                className="h-full"
                style={{
                  width: `${chain.percentage}%`,
                  backgroundColor: chain.color,
                }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {chainAllocation.map((chain) => (
              <div key={chain.chain} className="flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: chain.color }} />
                <span className="text-xs">
                  {chain.chain} {chain.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

