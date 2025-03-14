"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  History,
  Settings,
  HelpCircle,
  Layers,
  ArrowRightLeft,
  Shield,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Portfolio",
    icon: PieChart,
    href: "/portfolio",
  },
  {
    label: "Deposit",
    icon: Wallet,
    href: "/deposit",
  },
  {
    label: "Yield Farms",
    icon: Layers,
    href: "/farms",
  },
  {
    label: "Swap",
    icon: ArrowRightLeft,
    href: "/swap",
  },
  {
    label: "Risk Analysis",
    icon: Shield,
    href: "/risk",
  },
  {
    label: "History",
    icon: History,
    href: "/history",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    label: "Help",
    icon: HelpCircle,
    href: "/help",
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-polkadot-pink">
            <span className="text-lg font-bold text-white">OY</span>
          </div>
          <span className="text-xl font-bold">ORBITYIELD</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.href ? "bg-polkadot-pink text-white" : "hover:bg-polkadot-pink/10",
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button className="w-full rounded-full bg-polkadot-pink hover:bg-polkadot-pink/90">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </div>
    </div>
  )
}

