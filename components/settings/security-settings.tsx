"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Switch,
  SwitchThumb,
} from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Key,
  Shield,
  Smartphone,
  AlertCircle,
  Globe,
  Clock,
  ArrowRight,
} from "lucide-react";

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    
    // Simple password strength evaluation for demo
    if (!password) {
      setPasswordStrength(0);
      setPasswordFeedback("");
      return;
    }
    
    let strength = 0;
    let feedback = "";
    
    // Length check
    if (password.length < 8) {
      feedback = "Password is too short";
    } else {
      strength += 20;
      
      // Uppercase check
      if (/[A-Z]/.test(password)) {
        strength += 20;
      }
      
      // Lowercase check
      if (/[a-z]/.test(password)) {
        strength += 20;
      }
      
      // Number check
      if (/[0-9]/.test(password)) {
        strength += 20;
      }
      
      // Special character check
      if (/[^A-Za-z0-9]/.test(password)) {
        strength += 20;
      }
      
      // Set feedback based on strength
      if (strength < 40) {
        feedback = "Weak password";
      } else if (strength < 80) {
        feedback = "Moderate password";
      } else {
        feedback = "Strong password";
      }
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };
  
  const recentLoginData = [
    {
      date: "Today, 10:15 AM",
      device: "Mac OS, Chrome 98",
      location: "New York, USA",
      ip: "192.168.1.1",
      status: "success",
    },
    {
      date: "Yesterday, 8:32 PM",
      device: "iOS, Safari",
      location: "New York, USA",
      ip: "192.168.1.1",
      status: "success",
    },
    {
      date: "Jul 15, 2023, 3:45 PM",
      device: "Windows 10, Firefox",
      location: "Boston, USA",
      ip: "192.168.2.3",
      status: "failed",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Password Management</h3>
        <p className="text-sm text-muted-foreground">
          Update your password and view security settings
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showCurrentPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              onChange={handlePasswordChange}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showNewPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
          
          {passwordStrength > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs">Password Strength</span>
                <span className="text-xs font-medium">
                  {passwordFeedback}
                </span>
              </div>
              <Progress value={passwordStrength} className="h-1" />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
        
        <Button className="mt-2 bg-gradient-to-r from-polkadot-pink to-polkadot-purple">
          Update Password
        </Button>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Authenticator App</p>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app to generate verification codes
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-500 hover:bg-yellow-600">Not Set Up</Badge>
            <Button size="sm">
              <Key className="h-4 w-4 mr-2" />
              Setup
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Backup Codes</p>
              <p className="text-sm text-muted-foreground">
                Use backup codes to access your account if you lose your device
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">Available</Badge>
            <Button size="sm" variant="outline">
              View Codes
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Security Options</h3>
        <p className="text-sm text-muted-foreground">
          Manage additional security settings
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications for New Logins</p>
            <p className="text-sm text-muted-foreground">
              Get notified when a new device logs into your account
            </p>
          </div>
          <Switch defaultChecked>
            <SwitchThumb />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Login Approval</p>
            <p className="text-sm text-muted-foreground">
              Approve login attempts from new browsers or devices
            </p>
          </div>
          <Switch defaultChecked>
            <SwitchThumb />
          </Switch>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Withdrawal Confirmation</p>
            <p className="text-sm text-muted-foreground">
              Require email confirmation for all withdrawals
            </p>
          </div>
          <Switch defaultChecked>
            <SwitchThumb />
          </Switch>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Recent Login Activity</h3>
        <p className="text-sm text-muted-foreground">
          Monitor recent login attempts to your account
        </p>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentLoginData.map((login, index) => (
              <TableRow key={index}>
                <TableCell className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{login.date}</span>
                </TableCell>
                <TableCell>{login.device}</TableCell>
                <TableCell className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{login.location}</span>
                </TableCell>
                <TableCell>{login.ip}</TableCell>
                <TableCell>
                  {login.status === "success" ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Successful
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500 hover:bg-red-600">
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowRight className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Login Details</AlertDialogTitle>
                        <AlertDialogDescription>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="font-medium">Date/Time:</span>
                              <span>{login.date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Device:</span>
                              <span>{login.device}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Location:</span>
                              <span>{login.location}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">IP Address:</span>
                              <span>{login.ip}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Status:</span>
                              <span>{login.status === "success" ? "Successful" : "Failed"}</span>
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        {login.status === "success" && (
                          <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Report Suspicious Activity
                          </AlertDialogAction>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-center">
        <Button variant="link" size="sm">
          View All Login Activity
        </Button>
      </div>
    </div>
  );
}
