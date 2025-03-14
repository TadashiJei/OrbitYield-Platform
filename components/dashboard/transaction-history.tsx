"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Wallet,
  Globe,
  DownloadCloud,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";

// Define types
type ChainType = "ethereum" | "polkadot" | "all";
type TransactionType = "deposit" | "withdrawal" | "claim" | "transfer" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

interface Transaction {
  id: string;
  type: TransactionType;
  chain: ChainType;
  protocol: string;
  asset: string;
  amount: number;
  timestamp: Date;
  status: TransactionStatus;
  txHash: string;
  fee?: string;
  blockNumber?: number;
  counterparty?: string;
  description?: string;
}

// Helper function to get status badge style
const getStatusBadge = (status: TransactionStatus) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
    case "failed":
      return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

// Helper function to get transaction icon
const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case "deposit":
      return <ArrowDown className="h-4 w-4 text-green-500" />;
    case "withdrawal":
      return <ArrowUp className="h-4 w-4 text-amber-500" />;
    case "claim":
      return <TrendingUp className="h-4 w-4 text-purple-500" />;
    case "transfer":
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    case "swap":
      return <RefreshCw className="h-4 w-4 text-indigo-500" />;
    default:
      return <ArrowRightLeft className="h-4 w-4" />;
  }
};

// Helper function to get transaction type label
const getTransactionTypeLabel = (type: TransactionType) => {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    case "claim":
      return "Claim Rewards";
    case "transfer":
      return "Transfer";
    case "swap":
      return "Swap";
    default:
      return "Unknown";
  }
};

// Helper function to get chain icon
const getChainIcon = (chain: ChainType) => {
  switch (chain) {
    case "ethereum":
      return <Wallet className="h-4 w-4 text-[#627EEA]" />;
    case "polkadot":
      return <Globe className="h-4 w-4 text-polkadot-pink" />;
    default:
      return null;
  }
};

// Mock transaction data
const generateMockTransactions = (count: number = 20): Transaction[] => {
  const types: TransactionType[] = ["deposit", "withdrawal", "claim", "transfer", "swap"];
  const chains: ChainType[] = ["ethereum", "polkadot"];
  const statuses: TransactionStatus[] = ["completed", "pending", "failed"];
  const protocols = ["Compound", "Acala", "Aave", "Moonbeam", "Uniswap", "Polkadex"];
  const assets = ["ETH", "DOT", "USDC", "DAI", "GLMR", "ASTR"];
  
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const chain = chains[Math.floor(Math.random() * chains.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const status = Math.random() > 0.8 
      ? (Math.random() > 0.5 ? "pending" : "failed") 
      : "completed";
    
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    
    transactions.push({
      id: `tx-${i}-${Date.now().toString(36)}`,
      type,
      chain,
      protocol,
      asset,
      amount: parseFloat((Math.random() * 1000).toFixed(2)),
      timestamp,
      status,
      txHash: `0x${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      fee: `${(Math.random() * 0.01).toFixed(4)} ${chain === "ethereum" ? "ETH" : "DOT"}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      description: `${getTransactionTypeLabel(type)} ${asset} ${type === "deposit" ? "to" : "from"} ${protocol}`,
    });
  }
  
  // Sort by timestamp, newest first
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className = "" }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Filter states
  const [selectedChain, setSelectedChain] = useState<ChainType>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  useEffect(() => {
    // Simulate API call to get transactions
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch from your API
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        const mockData = generateMockTransactions(30);
        setTransactions(mockData);
        setFilteredTransactions(mockData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, []);

  useEffect(() => {
    // Apply filters when they change
    applyFilters();
  }, [activeTab, selectedChain, selectedType, searchQuery, dateRange, transactions]);

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Filter by tab (status)
    if (activeTab !== "all") {
      filtered = filtered.filter(tx => tx.status === activeTab);
    }
    
    // Filter by chain
    if (selectedChain !== "all") {
      filtered = filtered.filter(tx => tx.chain === selectedChain);
    }
    
    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(tx => tx.type === selectedType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.asset.toLowerCase().includes(query) ||
        tx.protocol.toLowerCase().includes(query) ||
        tx.txHash.toLowerCase().includes(query) ||
        tx.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(tx => tx.timestamp >= dateRange.start!);
    }
    if (dateRange.end) {
      // Add one day to include the end date
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);
      filtered = filtered.filter(tx => tx.timestamp <= endDate);
    }
    
    setFilteredTransactions(filtered);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would fetch from your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      const mockData = generateMockTransactions(30);
      setTransactions(mockData);
      setFilteredTransactions(mockData);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // In a real app, you would generate a CSV or PDF for download
    console.log("Exporting transactions:", filteredTransactions);
    alert("Transaction export started. Your file will be downloaded shortly.");
  };

  const handleChainChange = (value: string) => {
    setSelectedChain(value as ChainType);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    if (!value) {
      const newRange = { ...dateRange };
      delete newRange[field];
      setDateRange(newRange);
    } else {
      setDateRange({
        ...dateRange,
        [field]: new Date(value),
      });
    }
  };

  const handleClearFilters = () => {
    setSelectedChain("all");
    setSelectedType("all");
    setSearchQuery("");
    setDateRange({});
  };

  return (
    <Card className={`shadow-lg border-zinc-800/20 ${className}`}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View and manage your cross-chain transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search asset, protocol..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-9"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedChain}
              onValueChange={handleChainChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter by chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polkadot">Polkadot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedType}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="claim">Claims</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="swap">Swaps</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="From date"
              className="h-9"
              value={dateRange.start?.toISOString().split('T')[0] || ""}
              onChange={(e) => handleDateRangeChange("start", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              placeholder="To date"
              className="h-9"
              value={dateRange.end?.toISOString().split('T')[0] || ""}
              onChange={(e) => handleDateRangeChange("end", e.target.value)}
            />
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-xs text-muted-foreground"
        >
          Clear Filters
        </Button>
        
        {/* Transaction Tab List */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-4">
            <TransactionTable 
              transactions={filteredTransactions} 
              isLoading={isLoading} 
            />
          </TabsContent>
          
          <TabsContent value="completed" className="pt-4">
            <TransactionTable 
              transactions={filteredTransactions} 
              isLoading={isLoading} 
            />
          </TabsContent>
          
          <TabsContent value="pending" className="pt-4">
            <TransactionTable 
              transactions={filteredTransactions} 
              isLoading={isLoading} 
            />
          </TabsContent>
          
          <TabsContent value="failed" className="pt-4">
            <TransactionTable 
              transactions={filteredTransactions} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
        <div>
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardFooter>
    </Card>
  );
}

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }
  
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground mb-2">No transactions found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or make a deposit to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Chain</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Transaction Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTransactionIcon(transaction.type)}
                  <span>{getTransactionTypeLabel(transaction.type)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getChainIcon(transaction.chain)}
                  <span>{transaction.chain.charAt(0).toUpperCase() + transaction.chain.slice(1)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{transaction.asset}</span>
                  <span className="text-xs text-muted-foreground">{transaction.protocol}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {transaction.amount.toFixed(4)} {transaction.asset}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{format(transaction.timestamp, "MMM d, yyyy")}</span>
                  <span className="text-xs text-muted-foreground">{format(transaction.timestamp, "h:mm a")}</span>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction.status)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                <a 
                  href={`https://${transaction.chain === "ethereum" ? "etherscan.io" : "subscan.io"}/tx/${transaction.txHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline text-blue-500"
                >
                  {transaction.txHash}
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
