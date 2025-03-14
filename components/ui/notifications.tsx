"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  DollarSign,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatDistanceToNow } from "date-fns";

type NotificationType = "success" | "info" | "warning" | "error";
type NotificationCategory = "security" | "transaction" | "system" | "market";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  timestamp: Date;
  actionLink?: string;
  actionText?: string;
}

// Generate a mock notification
const generateMockNotification = (
  type: NotificationType,
  category: NotificationCategory,
  title: string,
  description: string,
  minutesAgo: number = Math.floor(Math.random() * 60),
  read: boolean = Math.random() > 0.5,
  actionLink?: string,
  actionText?: string
): Notification => {
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
  
  return {
    id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    type,
    category,
    read,
    timestamp,
    actionLink,
    actionText,
  };
};

// Generate mock notifications
const generateMockNotifications = (): Notification[] => {
  return [
    generateMockNotification(
      "success",
      "transaction",
      "Deposit Successful",
      "Your deposit of 5 ETH has been confirmed and is now earning yield.",
      15,
      false,
      "/dashboard",
      "View Position"
    ),
    generateMockNotification(
      "info",
      "system",
      "Welcome to OrbitYield",
      "Thank you for joining OrbitYield! Start exploring cross-chain yield opportunities.",
      120,
      true,
      "/dashboard",
      "Explore Opportunities"
    ),
    generateMockNotification(
      "warning",
      "security",
      "New Wallet Connection",
      "A new wallet has been connected to your account. If this wasn't you, please secure your account immediately.",
      30,
      false,
      "/settings/security",
      "Review Connection"
    ),
    generateMockNotification(
      "error",
      "transaction",
      "Withdrawal Failed",
      "Your withdrawal of 2 DOT could not be processed due to network congestion. Please try again later.",
      45,
      false,
      "/dashboard/transactions",
      "Retry Withdrawal"
    ),
    generateMockNotification(
      "info",
      "market",
      "New Yield Opportunity",
      "A new high-yield opportunity is available on Acala with 12.5% APY for USDC deposits.",
      60,
      true,
      "/opportunities",
      "View Details"
    ),
    generateMockNotification(
      "success",
      "transaction",
      "Yield Payout Received",
      "You have received a yield payout of 0.05 ETH from your Compound position.",
      90,
      true,
      "/dashboard/transactions",
      "View Transaction"
    ),
    generateMockNotification(
      "warning",
      "security",
      "Password Changed",
      "Your account password was recently changed. If this wasn't you, please contact support immediately.",
      180,
      true,
      "/settings/security",
      "Review Activity"
    ),
    generateMockNotification(
      "info",
      "system",
      "New Feature Available",
      "We've added a new transaction history view to help you track your investments.",
      240,
      true,
      "/dashboard/transactions",
      "Try It Now"
    ),
  ];
};

const getNotificationIcon = (type: NotificationType, category: NotificationCategory) => {
  if (category === "security") return <Shield className="h-5 w-5" />;
  if (category === "transaction") return <DollarSign className="h-5 w-5" />;
  if (category === "market") return <TrendingUp className="h-5 w-5" />;
  
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "info":
      return <Info className="h-5 w-5 text-blue-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationBgColor = (type: NotificationType, read: boolean) => {
  if (read) return "bg-transparent hover:bg-muted/50";
  
  switch (type) {
    case "success":
      return "bg-green-500/5 hover:bg-green-500/10";
    case "info":
      return "bg-blue-500/5 hover:bg-blue-500/10";
    case "warning":
      return "bg-amber-500/5 hover:bg-amber-500/10";
    case "error":
      return "bg-red-500/5 hover:bg-red-500/10";
    default:
      return "bg-transparent hover:bg-muted/50";
  }
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedNotification, setExpandedNotification] = useState<string | null>(null);
  
  useEffect(() => {
    // In a real app, you would fetch notifications from your API
    const mockData = generateMockNotifications();
    setNotifications(mockData);
  }, []);
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter(notification => notification.category === activeTab);
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  const toggleExpand = (id: string) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };
  
  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500" 
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 md:w-96 p-0"
          sideOffset={8}
        >
          <div className="flex items-center justify-between p-4">
            <h4 className="font-medium">Notifications</h4>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-8 px-2"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Mark all as read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs h-8 px-2"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-t">
              <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
                <TabsTrigger 
                  value="all" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger 
                  value="transaction" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                >
                  Transactions
                </TabsTrigger>
                <TabsTrigger 
                  value="system" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2"
                >
                  System
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-96">
              <TabsContent value="all" className="m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  expandedNotification={expandedNotification}
                  toggleExpand={toggleExpand}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              </TabsContent>
              
              <TabsContent value="security" className="m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  expandedNotification={expandedNotification}
                  toggleExpand={toggleExpand}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              </TabsContent>
              
              <TabsContent value="transaction" className="m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  expandedNotification={expandedNotification}
                  toggleExpand={toggleExpand}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              </TabsContent>
              
              <TabsContent value="system" className="m-0">
                <NotificationList 
                  notifications={filteredNotifications}
                  expandedNotification={expandedNotification}
                  toggleExpand={toggleExpand}
                  markAsRead={markAsRead}
                  deleteNotification={deleteNotification}
                />
              </TabsContent>
            </ScrollArea>
            
            {filteredNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="text-sm font-medium mb-1">No notifications</h4>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "all" 
                    ? "You're all caught up! No new notifications."
                    : `You don't have any ${activeTab} notifications.`
                  }
                </p>
              </div>
            )}
            
            <div className="p-2 border-t text-center">
              <Button variant="link" size="sm" className="text-xs">
                View All Notifications
              </Button>
            </div>
          </Tabs>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  expandedNotification: string | null;
  toggleExpand: (id: string) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

function NotificationList({
  notifications,
  expandedNotification,
  toggleExpand,
  markAsRead,
  deleteNotification,
}: NotificationListProps) {
  return (
    <div className="py-1">
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          isExpanded={expandedNotification === notification.id}
          onToggleExpand={() => toggleExpand(notification.id)}
          onMarkAsRead={() => markAsRead(notification.id)}
          onDelete={() => deleteNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

function NotificationItem({
  notification,
  isExpanded,
  onToggleExpand,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  useEffect(() => {
    if (isExpanded && !notification.read) {
      onMarkAsRead();
    }
  }, [isExpanded, notification.read, onMarkAsRead]);
  
  return (
    <div className={`border-b last:border-b-0 ${getNotificationBgColor(notification.type, notification.read)}`}>
      <div 
        className="flex items-start p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="mr-3 mt-0.5">
          {getNotificationIcon(notification.type, notification.category)}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h5 className={`text-sm font-medium ${!notification.read ? "font-bold" : ""}`}>
              {notification.title}
            </h5>
            <div className="flex items-center">
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-1.5"></div>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {notification.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <Separator className="my-2" />
              <p className="text-sm mb-4">
                {notification.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {format(notification.timestamp, "MMM d, yyyy 'at' h:mm a")}
                </div>
                <div className="flex items-center space-x-2">
                  {notification.actionText && notification.actionLink && (
                    <Button size="sm" variant="default" className="h-7 text-xs px-2">
                      {notification.actionText}
                    </Button>
                  )}
                  {notification.read ? (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead();
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Toast Notification Component
type ToastProps = {
  id: string;
  title: string;
  description?: string;
  type?: NotificationType;
  onClose: (id: string) => void;
  actionText?: string;
  actionFn?: () => void;
  autoClose?: boolean;
  duration?: number;
};

export function NotificationToast({
  id,
  title,
  description,
  type = "info",
  onClose,
  actionText,
  actionFn,
  autoClose = true,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, onClose, autoClose, duration]);
  
  let icon;
  let bgColor;
  
  switch (type) {
    case "success":
      icon = <CheckCircle className="h-5 w-5 text-green-500" />;
      bgColor = "border-green-500/50 bg-green-500/10";
      break;
    case "info":
      icon = <Info className="h-5 w-5 text-blue-500" />;
      bgColor = "border-blue-500/50 bg-blue-500/10";
      break;
    case "warning":
      icon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
      bgColor = "border-amber-500/50 bg-amber-500/10";
      break;
    case "error":
      icon = <AlertCircle className="h-5 w-5 text-red-500" />;
      bgColor = "border-red-500/50 bg-red-500/10";
      break;
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`w-full max-w-sm rounded-lg border shadow-lg ${bgColor} p-4 mb-3`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          <h5 className="font-medium text-sm mb-1">{title}</h5>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {actionText && actionFn && (
            <Button
              variant="link"
              size="sm"
              className="px-0 py-0 h-auto text-xs mt-1"
              onClick={actionFn}
            >
              {actionText}
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 -mt-1 -mr-1 rounded-full"
          onClick={() => onClose(id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// Notifications Provider with Toast Management
interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      type: NotificationType;
      actionText?: string;
      actionFn?: () => void;
      autoClose?: boolean;
      duration?: number;
    }>
  >([]);
  
  const removeToast = (id: string) => {
    setToasts((toasts) => toasts.filter((t) => t.id !== id));
  };
  
  // Example function to add a new toast notification
  const addToast = (
    title: string,
    description?: string,
    type: NotificationType = "info",
    actionText?: string,
    actionFn?: () => void,
    autoClose: boolean = true,
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((toasts) => [
      ...toasts,
      {
        id,
        title,
        description,
        type,
        actionText,
        actionFn,
        autoClose,
        duration,
      },
    ]);
    return id;
  };
  
  // Expose the methods through context
  useEffect(() => {
    // Example: Add a welcome toast on first render
    // This would typically be triggered by events in your application
    const timeout = setTimeout(() => {
      addToast(
        "Welcome to OrbitYield",
        "Your cross-chain yield optimization platform",
        "info",
        "Explore Opportunities",
        () => console.log("Action clicked")
      );
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50 max-h-screen overflow-hidden pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <NotificationToast
                id={toast.id}
                title={toast.title}
                description={toast.description}
                type={toast.type}
                onClose={removeToast}
                actionText={toast.actionText}
                actionFn={toast.actionFn}
                autoClose={toast.autoClose}
                duration={toast.duration}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
