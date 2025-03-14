"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { PolkadotConnectButton } from "@/components/ui/polkadot-connect-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Globe, Shield } from "lucide-react";

export function WalletConnect() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-polkadot-pink" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your wallet to access cross-chain yield opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metamask" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metamask" className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              MetaMask
            </TabsTrigger>
            <TabsTrigger value="polkadot" className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Polkadot
            </TabsTrigger>
          </TabsList>
          <TabsContent value="metamask" className="py-4">
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                Connect with MetaMask to access Ethereum-based yield opportunities.
              </div>
              <WalletConnectButton 
                variant="default" 
                className="w-full web3-button bg-gradient-to-r from-polkadot-pink/20 to-polkadot-purple/20 border-polkadot-pink/30 hover:border-polkadot-pink" 
              />
            </div>
          </TabsContent>
          <TabsContent value="polkadot" className="py-4">
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                Connect with Polkadot.js extension to access Polkadot-based yield opportunities.
              </div>
              <PolkadotConnectButton 
                variant="default" 
                className="w-full web3-button bg-gradient-to-r from-polkadot-cyan/20 to-polkadot-blue/20 border-polkadot-cyan/30 hover:border-polkadot-cyan" 
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-xs text-muted-foreground">
          Your wallet connection is secure and required for interacting with the OrbitYield platform.
        </div>
      </CardFooter>
    </Card>
  );
}
