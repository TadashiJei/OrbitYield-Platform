"use client";

import { Fragment } from "react";
import { NotificationsProvider, NotificationCenter } from "@/components/ui/notifications";

interface NotificationsWrapperProps {
  children: React.ReactNode;
}

export function NotificationsWrapper({ children }: NotificationsWrapperProps) {
  return (
    <NotificationsProvider>
      <div className="relative">
        {children}
      </div>
    </NotificationsProvider>
  );
}

export function NotificationsButton() {
  return <NotificationCenter />;
}
