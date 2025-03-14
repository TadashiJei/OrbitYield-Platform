import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Shuffle } from "lucide-react"

// Mock data for recent transactions
const transactions = [
  {
    id: 1,
    type: "deposit",
    asset: "DOT",
    amount: "100 DOT",
    value: "$1,250.00",
    timestamp: "2023-03-12 14:32",
    status: "completed",
    chain: "Polkadot",
  },
  {
    id: 2,
    type: "withdraw",
    asset: "DOT",
    amount: "25 DOT",
    value: "$312.50",
    timestamp: "2023-03-10 09:15",
    status: "completed",
    chain: "Polkadot",
  },
  {
    id: 3,
    type: "rebalance",
    asset: "USDC",
    amount: "1,000 USDC",
    value: "$1,000.00",
    timestamp: "2023-03-08 16:45",
    status: "completed",
    chain: "Ethereum → Polkadot",
  },
  {
    id: 4,
    type: "harvest",
    asset: "GLMR",
    amount: "100 GLMR",
    value: "$25.00",
    timestamp: "2023-03-05 11:20",
    status: "completed",
    chain: "Polkadot",
  },
  {
    id: 5,
    type: "deposit",
    asset: "ETH",
    amount: "0.5 ETH",
    value: "$937.50",
    timestamp: "2023-03-01 13:10",
    status: "completed",
    chain: "Ethereum",
  },
]

export default function RecentTransactions() {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-polkadot-green" />
      case "withdraw":
        return <ArrowUpRight className="h-4 w-4 text-polkadot-red" />
      case "rebalance":
        return <Shuffle className="h-4 w-4 text-polkadot-cyan" />
      case "harvest":
        return <RefreshCw className="h-4 w-4 text-polkadot-orange" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="rounded-full bg-polkadot-green/10 text-polkadot-green">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="rounded-full bg-polkadot-orange/10 text-polkadot-orange">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="rounded-full bg-polkadot-red/10 text-polkadot-red">
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className="rounded-xl border-border shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Chain</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.type)}
                    <span className="capitalize">{transaction.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{transaction.asset}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>{transaction.value}</TableCell>
                <TableCell>{transaction.chain}</TableCell>
                <TableCell>{transaction.timestamp}</TableCell>
                <TableCell className="text-right">{getStatusBadge(transaction.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

