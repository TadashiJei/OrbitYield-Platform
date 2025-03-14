"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Switch,
  SwitchThumb,
} from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Smartphone,
  AlertTriangle,
  TrendingUp,
  Shield,
  DollarSign,
  Wallet,
  BarChart3,
  Check,
  Calculator,
} from "lucide-react";

interface NotificationOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  push: boolean;
  category: "security" | "transactions" | "market" | "account";
}

export function NotificationSettings() {
  const [notificationOptions, setNotificationOptions] = useState<NotificationOption[]>([
    {
      id: "login-alerts",
      title: "Login Alerts",
      description: "Get notified when someone logs into your account",
      icon: <Shield className="h-5 w-5 text-blue-500" />,
      email: true,
      push: true,
      category: "security",
    },
    {
      id: "wallet-connection",
      title: "Wallet Connection",
      description: "Get notified when a new wallet is connected or disconnected",
      icon: <Wallet className="h-5 w-5 text-purple-500" />,
      email: true,
      push: true,
      category: "security",
    },
    {
      id: "security-updates",
      title: "Security Updates",
      description: "Important updates about the security of your account",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      email: true,
      push: true,
      category: "security",
    },
    {
      id: "deposits",
      title: "Deposits",
      description: "Get notified when a deposit is completed",
      icon: <DollarSign className="h-5 w-5 text-green-500" />,
      email: true,
      push: true,
      category: "transactions",
    },
    {
      id: "withdrawals",
      title: "Withdrawals",
      description: "Get notified when a withdrawal is processed",
      icon: <DollarSign className="h-5 w-5 text-amber-500" />,
      email: true,
      push: true,
      category: "transactions",
    },
    {
      id: "yield-payouts",
      title: "Yield Payouts",
      description: "Get notified when yield is paid out on your positions",
      icon: <Check className="h-5 w-5 text-green-500" />,
      email: true,
      push: false,
      category: "transactions",
    },
    {
      id: "protocol-changes",
      title: "Protocol Changes",
      description: "Updates about protocol changes that affect your positions",
      icon: <Calculator className="h-5 w-5 text-indigo-500" />,
      email: true,
      push: true,
      category: "market",
    },
    {
      id: "yield-opportunities",
      title: "New Yield Opportunities",
      description: "Get notified about new high-yield opportunities",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      email: false,
      push: true,
      category: "market",
    },
    {
      id: "market-alerts",
      title: "Market Alerts",
      description: "Important market events like high volatility",
      icon: <BarChart3 className="h-5 w-5 text-amber-500" />,
      email: false,
      push: true,
      category: "market",
    },
    {
      id: "account-updates",
      title: "Account Updates",
      description: "Updates about your account status and features",
      icon: <Mail className="h-5 w-5 text-green-500" />,
      email: true,
      push: false,
      category: "account",
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [notificationDigest, setNotificationDigest] = useState<string>("realtime");

  const toggleEmailNotification = (id: string) => {
    setNotificationOptions(
      notificationOptions.map((option) =>
        option.id === id
          ? { ...option, email: !option.email }
          : option
      )
    );
  };

  const togglePushNotification = (id: string) => {
    setNotificationOptions(
      notificationOptions.map((option) =>
        option.id === id
          ? { ...option, push: !option.push }
          : option
      )
    );
  };

  const filteredOptions = activeCategory === "all"
    ? notificationOptions
    : notificationOptions.filter(option => option.category === activeCategory);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Manage how and when you receive notifications
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("all")}
          >
            All
          </Button>
          <Button
            variant={activeCategory === "security" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("security")}
          >
            Security
          </Button>
          <Button
            variant={activeCategory === "transactions" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("transactions")}
          >
            Transactions
          </Button>
          <Button
            variant={activeCategory === "market" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("market")}
          >
            Market
          </Button>
          <Button
            variant={activeCategory === "account" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory("account")}
          >
            Account
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="digest-mode" className="text-sm">Digest Mode:</Label>
          <Select
            value={notificationDigest}
            onValueChange={setNotificationDigest}
          >
            <SelectTrigger id="digest-mode" className="w-[180px]">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Real-time</SelectItem>
              <SelectItem value="hourly">Hourly Digest</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
          <div className="col-span-6 md:col-span-7">Notification</div>
          <div className="col-span-3 md:col-span-2 text-center">Email</div>
          <div className="col-span-3 md:col-span-3 text-center">Push</div>
        </div>
        
        <Separator />
        
        {filteredOptions.map((option) => (
          <div key={option.id} className="grid grid-cols-12 gap-4 items-center py-3">
            <div className="col-span-6 md:col-span-7 flex items-start space-x-3">
              <div className="mt-0.5">{option.icon}</div>
              <div>
                <p className="font-medium text-sm">{option.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </div>
            </div>
            <div className="col-span-3 md:col-span-2 flex justify-center">
              <Switch
                checked={option.email}
                onCheckedChange={() => toggleEmailNotification(option.id)}
              >
                <SwitchThumb />
              </Switch>
            </div>
            <div className="col-span-3 md:col-span-3 flex justify-center">
              <Switch
                checked={option.push}
                onCheckedChange={() => togglePushNotification(option.id)}
              >
                <SwitchThumb />
              </Switch>
            </div>
          </div>
        ))}
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Notification Channels</h3>
        <p className="text-sm text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
          </div>
          <Switch defaultChecked>
            <SwitchThumb />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications in your browser
              </p>
            </div>
          </div>
          <Switch defaultChecked>
            <SwitchThumb />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Mobile Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your mobile device
              </p>
            </div>
          </div>
          <Switch>
            <SwitchThumb />
          </Switch>
        </div>
      </div>
      
      <div className="bg-muted rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium">Important Notice</p>
            <p className="text-sm text-muted-foreground mt-1">
              Security notifications cannot be disabled as they are critical to protecting your account.
              You will always receive security alerts regardless of your notification preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
