import type React from "react"
import "@/app/globals.css"
import { Unbounded } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const unbounded = Unbounded({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-unbounded",
})

export const metadata = {
  title: "ORBITYIELD - Cross-Chain Yield Aggregator",
  description: "Maximize your DeFi returns across multiple blockchains",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={unbounded.variable}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}