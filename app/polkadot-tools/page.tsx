"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Info } from "lucide-react";

// Dynamically import components that use browser-specific APIs with ssr: false
const DynamicPalletInterface = dynamic(
  () => import("@/components/polkadot/pallet-interface").then(mod => ({ default: mod.PalletInterface })),
  { ssr: false }
);

const DynamicXcmInterface = dynamic(
  () => import("@/components/polkadot/xcm-interface").then(mod => ({ default: mod.XcmInterface })),
  { ssr: false }
);

const DynamicPalletTestSuite = dynamic(
  () => import("@/components/polkadot/pallet-test-suite").then(mod => ({ default: mod.PalletTestSuite })),
  { ssr: false }
);

// Instead of dynamically importing the hook itself, we'll create a wrapper component
const PolkadotProvider = dynamic(
  () => import("@/hooks/use-polkadot").then(mod => {
    // Create a simple wrapper component that uses the hook and passes values via context
    const ProviderComponent = ({ children }: { children: React.ReactNode }) => {
      const polkadotState = mod.usePolkadot();
      return (
        <div data-polkadot-context={JSON.stringify(polkadotState)}>
          {children}
        </div>
      );
    };
    return ProviderComponent;
  }),
  { ssr: false }
);

export default function PolkadotToolsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Polkadot Tools</h1>
      <div className="w-full">
        {typeof window !== 'undefined' ? (
          <ClientSideContent />
        ) : (
          <div className="py-8 text-center">
            <h2>Loading Polkadot tools...</h2>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate client-side only component
const ClientSideContent = () => {
  const [activeTab, setActiveTab] = useState("pallet");
  
  // We need to use useEffect to access window
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div className="py-4">Loading Polkadot tools...</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Tools for interacting with Polkadot pallets, testing, and XCM integration
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pallet">Pallet Interface</TabsTrigger>
          <TabsTrigger value="xcm">XCM Interface</TabsTrigger>
          <TabsTrigger value="tests">Test Suite</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="pallet">
            <DynamicPalletInterface />
          </TabsContent>
          
          <TabsContent value="xcm">
            <DynamicXcmInterface />
          </TabsContent>
          
          <TabsContent value="tests">
            <DynamicPalletTestSuite />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
