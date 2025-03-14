import { Suspense } from "react"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import PortfolioOverview from "@/components/dashboard/portfolio-overview"
import YieldOpportunities from "@/components/dashboard/yield-opportunities"
import RecentTransactions from "@/components/dashboard/recent-transactions"
import ChainSelector from "@/components/dashboard/chain-selector"
import { Skeleton } from "@/components/ui/skeleton"
import RiskAssessment from "@/components/dashboard/risk-assessment"

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
              <PortfolioOverview />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-xl" />}>
              <RiskAssessment />
            </Suspense>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Yield Opportunities</h2>
            <ChainSelector />
          </div>
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
            <YieldOpportunities />
          </Suspense>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-bold">Recent Transactions</h2>
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
            <RecentTransactions />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
