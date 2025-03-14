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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Switch,
  SwitchThumb,
} from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AccountSettings } from "./account-settings";
import { SecuritySettings } from "./security-settings";
import { WalletSettings } from "./wallet-settings";
import { NotificationSettings } from "./notification-settings";
import { AppearanceSettings } from "./appearance-settings";
import {
  User,
  Lock,
  Bell,
  Wallet,
  Paintbrush,
  Sliders,
  HelpCircle,
  ShieldAlert,
  LogOut,
  Check,
  Settings as SettingsIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SettingsPanelProps {
  className?: string;
}

export function SettingsPanel({ className = "" }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset status messages after 5 seconds
  useEffect(() => {
    if (saveSuccess || saveError) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
        setSaveError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, saveError]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would call your API to save settings
      console.log("Saving settings for tab:", activeTab);
      
      setSaveSuccess(true);
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`shadow-lg border-zinc-800/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Settings</CardTitle>
        </div>
        <CardDescription>
          Manage your OrbitYield account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="account"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <TabsList className="flex flex-col space-y-1 h-auto md:min-w-[200px] bg-transparent p-0">
              <TabsTrigger
                value="account"
                className="w-full justify-start text-left px-3 py-2"
              >
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="w-full justify-start text-left px-3 py-2"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="wallets"
                className="w-full justify-start text-left px-3 py-2"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Wallets
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="w-full justify-start text-left px-3 py-2"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="w-full justify-start text-left px-3 py-2"
              >
                <Paintbrush className="h-4 w-4 mr-2" />
                Appearance
              </TabsTrigger>
              
              <Separator className="my-2" />
              
              <TabsTrigger
                value="advanced"
                className="w-full justify-start text-left px-3 py-2"
              >
                <Sliders className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
              <TabsTrigger
                value="help"
                className="w-full justify-start text-left px-3 py-2"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 space-y-4">
              {saveSuccess && (
                <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Check className="h-4 w-4" />
                  <AlertDescription>Settings saved successfully!</AlertDescription>
                </Alert>
              )}
              
              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="account" className="space-y-4">
                <AccountSettings />
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <SecuritySettings />
              </TabsContent>
              
              <TabsContent value="wallets" className="space-y-4">
                <WalletSettings />
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-4">
                <NotificationSettings />
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4">
                <AppearanceSettings />
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Settings</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="developer-mode">Developer Mode</Label>
                      <Switch id="developer-mode">
                        <SwitchThumb />
                      </Switch>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced features and debugging tools
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="api-key">API Key</Label>
                      <Badge variant="outline" className="text-xs ml-2">
                        Pro Feature
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        type="password"
                        value="sk_test_•••••••••••••••••••••"
                        disabled
                      />
                      <Button variant="outline" size="sm">
                        Reveal
                      </Button>
                      <Button variant="outline" size="sm">
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your API key for programmatic access to OrbitYield
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gas-price">Default Gas Price Strategy</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue placeholder="Select gas price strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Slower)</SelectItem>
                        <SelectItem value="medium">Medium (Recommended)</SelectItem>
                        <SelectItem value="high">High (Faster)</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Set the default gas price strategy for Ethereum transactions
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min="5"
                      max="120"
                      defaultValue="30"
                    />
                    <p className="text-sm text-muted-foreground">
                      Set how long until your session expires due to inactivity
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="network-auto-switch">Network Auto-Switch</Label>
                      <Switch id="network-auto-switch" defaultChecked>
                        <SwitchThumb />
                      </Switch>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically switch networks in your wallet when required by a transaction
                    </p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground">
                    Actions in this section can have irreversible consequences
                  </p>
                  
                  <div className="space-y-2 mt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all of your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="help" className="space-y-4">
                <h3 className="text-lg font-medium">Help & Support</h3>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Documentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Visit our <a href="#" className="text-blue-500 hover:underline">documentation portal</a> for
                      guides, tutorials, and API reference.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Contact Support</h4>
                    <div className="space-y-2">
                      <Label htmlFor="support-subject">Subject</Label>
                      <Input id="support-subject" placeholder="How can we help you?" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support-message">Message</Label>
                      <Textarea
                        id="support-message"
                        placeholder="Please describe your issue in detail..."
                        rows={4}
                      />
                    </div>
                    <Button>
                      Submit Support Request
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">FAQs</h4>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">How do I connect my wallet?</div>
                      <p className="text-sm text-muted-foreground">
                        You can connect your MetaMask or Polkadot wallet by clicking the "Connect Wallet" button in the top navigation bar.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">What are the fees for using OrbitYield?</div>
                      <p className="text-sm text-muted-foreground">
                        OrbitYield charges a 0.5% management fee on yield generated through our platform. There are no deposit or withdrawal fees.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">How are yields calculated?</div>
                      <p className="text-sm text-muted-foreground">
                        Yields are calculated based on the APY of the underlying protocols, which is typically an annualized rate based on current conditions.
                      </p>
                    </div>
                    <a href="#" className="text-blue-500 hover:underline text-sm">
                      View all FAQs
                    </a>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to sign out of your OrbitYield account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-polkadot-pink to-polkadot-purple"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
