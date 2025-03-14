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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ExternalLink, Shield, AlertTriangle, TrendingUp, ArrowRightLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface YieldOpportunity {
  id: string;
  name: string;
  chain: string;
  protocol: string;
  asset: string;
  apy: number;
  tvl: number; // in USD
  risk: 'low' | 'medium' | 'high';
  isNew: boolean;
  isHot: boolean;
}

// Mock API response for yield opportunities
// In a real app, this would come from an actual API
const fetchYieldOpportunities = async (): Promise<YieldOpportunity[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: "eth-compound-usdc",
      name: "USDC Lending",
      chain: "Ethereum",
      protocol: "Compound",
      asset: "USDC",
      apy: 3.78,
      tvl: 1254000000,
      risk: "low",
      isNew: false,
      isHot: true
    },
    {
      id: "eth-aave-eth",
      name: "ETH Lending",
      chain: "Ethereum",
      protocol: "Aave",
      asset: "ETH",
      apy: 2.45,
      tvl: 890000000,
      risk: "low",
      isNew: false,
      isHot: false
    },
    {
      id: "polkadot-acala-dot",
      name: "DOT Staking",
      chain: "Polkadot",
      protocol: "Acala",
      asset: "DOT",
      apy: 12.8,
      tvl: 235000000,
      risk: "medium",
      isNew: true,
      isHot: true
    },
    {
      id: "polkadot-moonbeam-glmr",
      name: "GLMR Staking",
      chain: "Polkadot",
      protocol: "Moonbeam",
      asset: "GLMR",
      apy: 15.2,
      tvl: 85000000,
      risk: "medium",
      isNew: false,
      isHot: false
    },
    {
      id: "eth-curve-3pool",
      name: "3Pool LP",
      chain: "Ethereum",
      protocol: "Curve",
      asset: "DAI/USDC/USDT",
      apy: 5.21,
      tvl: 456000000,
      risk: "medium",
      isNew: false,
      isHot: true
    },
    {
      id: "polkadot-parallel-para",
      name: "PARA Liquidity",
      chain: "Polkadot",
      protocol: "Parallel",
      asset: "PARA",
      apy: 24.6,
      tvl: 42000000,
      risk: "high",
      isNew: true,
      isHot: true
    },
  ];
};

export function CrossChainOpportunities() {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterChain, setFilterChain] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'risk'>('apy');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadOpportunities = async () => {
      setIsLoading(true);
      try {
        const data = await fetchYieldOpportunities();
        setOpportunities(data);
      } catch (error) {
        console.error("Error fetching yield opportunities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOpportunities();
  }, []);

  const filteredOpportunities = opportunities
    .filter(opp => !filterChain || opp.chain === filterChain)
    .sort((a, b) => {
      if (sortBy === 'apy') {
        return sortDirection === 'desc' ? b.apy - a.apy : a.apy - b.apy;
      } else if (sortBy === 'tvl') {
        return sortDirection === 'desc' ? b.tvl - a.tvl : a.tvl - b.tvl;
      } else {
        // Risk sorting (low -> medium -> high)
        const riskValues = { low: 1, medium: 2, high: 3 };
        return sortDirection === 'desc' 
          ? riskValues[b.risk] - riskValues[a.risk] 
          : riskValues[a.risk] - riskValues[b.risk];
      }
    });

  const handleSort = (column: 'apy' | 'tvl' | 'risk') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000000) {
      return `$${(tvl / 1000000000).toFixed(2)}B`;
    } else if (tvl >= 1000000) {
      return `$${(tvl / 1000000).toFixed(2)}M`;
    } else {
      return `$${(tvl / 1000).toFixed(2)}K`;
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Shield className="mr-1 h-3 w-3" /> Low Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <AlertTriangle className="mr-1 h-3 w-3" /> Medium Risk
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertTriangle className="mr-1 h-3 w-3" /> High Risk
          </Badge>
        );
    }
  };

  const getChainBadge = (chain: string) => {
    switch (chain) {
      case 'Ethereum':
        return (
          <Badge className="bg-[#627EEA]/10 text-[#627EEA] border-[#627EEA]/20">
            Ethereum
          </Badge>
        );
      case 'Polkadot':
        return (
          <Badge className="bg-polkadot-pink/10 text-polkadot-pink border-polkadot-pink/20">
            Polkadot
          </Badge>
        );
      default:
        return <Badge>{chain}</Badge>;
    }
  };

  return (
    <Card className="shadow-lg border-zinc-800/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Cross-Chain Yield Opportunities</CardTitle>
            <CardDescription>
              Explore and compare yield farming opportunities across multiple blockchains
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterChain(null)}
              className={!filterChain ? "bg-muted" : ""}
            >
              All Chains
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterChain("Ethereum")}
              className={filterChain === "Ethereum" ? "bg-[#627EEA]/10 border-[#627EEA]/30" : ""}
            >
              Ethereum
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterChain("Polkadot")}
              className={filterChain === "Polkadot" ? "bg-polkadot-pink/10 border-polkadot-pink/30" : ""}
            >
              Polkadot
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-polkadot-pink"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-polkadot-pink transition-colors"
                  onClick={() => handleSort('apy')}
                >
                  APY {sortBy === 'apy' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-polkadot-pink transition-colors"
                  onClick={() => handleSort('tvl')}
                >
                  TVL {sortBy === 'tvl' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-polkadot-pink transition-colors"
                  onClick={() => handleSort('risk')}
                >
                  Risk {sortBy === 'risk' && (sortDirection === 'desc' ? '↓' : '↑')}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpportunities.map((opportunity) => (
                <TableRow key={opportunity.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="flex items-center">
                        {opportunity.name}
                        {opportunity.isNew && (
                          <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-500 border-blue-500/20">
                            New
                          </Badge>
                        )}
                        {opportunity.isHot && (
                          <Badge variant="outline" className="ml-2 bg-orange-500/10 text-orange-500 border-orange-500/20">
                            <TrendingUp className="mr-1 h-3 w-3" /> Hot
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {opportunity.protocol} · {opportunity.asset}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getChainBadge(opportunity.chain)}</TableCell>
                  <TableCell>
                    <div className="font-bold text-green-500">
                      {opportunity.apy.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{formatTVL(opportunity.tvl)}</div>
                      <Progress 
                        value={opportunity.tvl / 10000000} 
                        className="h-1.5 w-20" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>{getRiskBadge(opportunity.risk)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/yield/${opportunity.id}`}>
                          <ExternalLink className="h-4 w-4 mr-1" /> Detail
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-polkadot-pink to-polkadot-purple text-white"
                        asChild
                      >
                        <a href={`/deposit?opportunity=${opportunity.id}`}>
                          <ArrowRightLeft className="h-4 w-4 mr-1" /> Deposit
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-xs text-muted-foreground">
          Data updated every 15 minutes. APYs are based on historical performance.
        </div>
        <Button variant="link" size="sm" className="text-polkadot-pink">
          View All Opportunities <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}
