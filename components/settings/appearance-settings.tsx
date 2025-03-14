"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Moon,
  Sun,
  Monitor,
  PanelLeft,
  PanelRight,
  Layout,
  Paintbrush,
  Check,
  Palette,
} from "lucide-react";

export function AppearanceSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [accentColor, setAccentColor] = useState<string>("default");
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [sidebarPosition, setSidebarPosition] = useState<"left" | "right">("left");
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<string>("medium");
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of OrbitYield
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`flex flex-col items-center justify-center p-2 rounded-md border-2 cursor-pointer ${
                theme === "light" ? "border-primary bg-primary/10" : "border-muted"
              }`}
              onClick={() => setTheme("light")}
            >
              <Sun className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Light</span>
            </div>
            
            <div
              className={`flex flex-col items-center justify-center p-2 rounded-md border-2 cursor-pointer ${
                theme === "dark" ? "border-primary bg-primary/10" : "border-muted"
              }`}
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Dark</span>
            </div>
            
            <div
              className={`flex flex-col items-center justify-center p-2 rounded-md border-2 cursor-pointer ${
                theme === "system" ? "border-primary bg-primary/10" : "border-muted"
              }`}
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">System</span>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Accent Color</Label>
          <RadioGroup
            value={accentColor}
            onValueChange={(value) => setAccentColor(value)}
            className="grid grid-cols-6 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="default" className="sr-only" />
              <Label
                htmlFor="default"
                className={`w-8 h-8 rounded-full bg-gradient-to-r from-polkadot-pink to-polkadot-purple cursor-pointer flex items-center justify-center ${
                  accentColor === "default" ? "ring-2 ring-offset-2 ring-polkadot-pink" : ""
                }`}
              >
                {accentColor === "default" && <Check className="h-4 w-4 text-white" />}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="purple" id="purple" className="sr-only" />
              <Label
                htmlFor="purple"
                className={`w-8 h-8 rounded-full bg-purple-600 cursor-pointer flex items-center justify-center ${
                  accentColor === "purple" ? "ring-2 ring-offset-2 ring-purple-600" : ""
                }`}
              >
                {accentColor === "purple" && <Check className="h-4 w-4 text-white" />}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="blue" id="blue" className="sr-only" />
              <Label
                htmlFor="blue"
                className={`w-8 h-8 rounded-full bg-blue-600 cursor-pointer flex items-center justify-center ${
                  accentColor === "blue" ? "ring-2 ring-offset-2 ring-blue-600" : ""
                }`}
              >
                {accentColor === "blue" && <Check className="h-4 w-4 text-white" />}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="green" id="green" className="sr-only" />
              <Label
                htmlFor="green"
                className={`w-8 h-8 rounded-full bg-green-600 cursor-pointer flex items-center justify-center ${
                  accentColor === "green" ? "ring-2 ring-offset-2 ring-green-600" : ""
                }`}
              >
                {accentColor === "green" && <Check className="h-4 w-4 text-white" />}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="orange" id="orange" className="sr-only" />
              <Label
                htmlFor="orange"
                className={`w-8 h-8 rounded-full bg-orange-600 cursor-pointer flex items-center justify-center ${
                  accentColor === "orange" ? "ring-2 ring-offset-2 ring-orange-600" : ""
                }`}
              >
                {accentColor === "orange" && <Check className="h-4 w-4 text-white" />}
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" className="sr-only" />
              <Label
                htmlFor="custom"
                className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer ${
                  accentColor === "custom" ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
              >
                <Palette className="h-4 w-4" />
              </Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-muted-foreground">
            Choose the accent color for buttons and interactive elements
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={fontSize}
              onValueChange={setFontSize}
            >
              <SelectTrigger id="font-size">
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Default)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reduce-motion" className="font-medium">Reduce Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations throughout the interface
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reduceMotion}
              onCheckedChange={setReduceMotion}
            >
              <SwitchThumb />
            </Switch>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-mode" className="font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser layout
              </p>
            </div>
            <Switch
              id="compact-mode"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            >
              <SwitchThumb />
            </Switch>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Layout Preferences</Label>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`border-2 rounded-md p-4 cursor-pointer ${
                sidebarPosition === "left" ? "border-primary bg-primary/10" : "border-muted"
              }`}
              onClick={() => setSidebarPosition("left")}
            >
              <div className="flex justify-center mb-4">
                <PanelLeft className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium text-center">Sidebar on Left</p>
            </div>
            
            <div
              className={`border-2 rounded-md p-4 cursor-pointer ${
                sidebarPosition === "right" ? "border-primary bg-primary/10" : "border-muted"
              }`}
              onClick={() => setSidebarPosition("right")}
            >
              <div className="flex justify-center mb-4">
                <PanelRight className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium text-center">Sidebar on Right</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Dashboard Components</Label>
          <p className="text-sm text-muted-foreground">
            Customize which components appear on your dashboard
          </p>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Active Positions</span>
              </div>
              <Switch defaultChecked>
                <SwitchThumb />
              </Switch>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Yield Opportunities</span>
              </div>
              <Switch defaultChecked>
                <SwitchThumb />
              </Switch>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Transaction History</span>
              </div>
              <Switch defaultChecked>
                <SwitchThumb />
              </Switch>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Performance Analytics</span>
              </div>
              <Switch defaultChecked>
                <SwitchThumb />
              </Switch>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">News & Updates</span>
              </div>
              <Switch>
                <SwitchThumb />
              </Switch>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-2">
          <Paintbrush className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Reset to Default Theme</span>
        </div>
        <Button variant="outline" size="sm">Reset</Button>
      </div>
    </div>
  );
}
