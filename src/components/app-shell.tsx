"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, ReceiptText, Settings, Sparkles, Plus, PieChart, LogOut, User, CloudOff, CloudUpload, Check, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { TransactionForm } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { startBackgroundSync, onSyncStatus } from "@/lib/sync-engine"

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

function SyncIndicator({ status }: { status: SyncStatus }) {
  if (status === 'idle') return null
  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all duration-300 ${
      status === 'syncing' ? 'bg-primary/10 text-primary' :
      status === 'synced'  ? 'bg-income/10 text-income' :
      status === 'offline' ? 'bg-muted text-muted-foreground' :
                             'bg-expense/10 text-expense'
    }`}>
      {status === 'syncing' && <CloudUpload className="w-3.5 h-3.5 animate-pulse" />}
      {status === 'synced'  && <Check className="w-3.5 h-3.5" />}
      {status === 'offline' && <CloudOff className="w-3.5 h-3.5" />}
      {status === 'error'   && <AlertCircle className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">
        {status === 'syncing' ? 'Syncing...' :
         status === 'synced'  ? 'Synced' :
         status === 'offline' ? 'Offline' : 'Sync error'}
      </span>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')

  useEffect(() => {
    if (session) {
      startBackgroundSync()
      const unsub = onSyncStatus(setSyncStatus)
      return unsub
    }
  }, [session])

  const tabs = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: ReceiptText },
    { name: "Reports", href: "/reports", icon: PieChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  // Don't show nav on login page
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background selection:bg-primary/20">
      {/* Desktop/Tablet Navigation */}
      <nav className="flex fixed top-0 left-0 right-0 h-14 lg:h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl z-50 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="font-bold text-lg sm:text-xl tracking-tight text-foreground flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-1 sm:p-1.5 rounded-xl shadow-sm border border-primary/10 group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
            <img src="/logo.png" alt="FinTrack Logo" className="h-6 sm:h-7 w-6 sm:w-7 object-contain" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">FinTrack</span>
        </Link>
        <div className="flex items-center gap-1 overflow-hidden">
          <div className="hidden lg:flex items-center gap-1 mr-2 bg-muted/30 p-1 rounded-xl">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Link>
            )
          })}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {session && <SyncIndicator status={syncStatus} />}
            <Button 
              onClick={() => setIsAddOpen(true)}
              className="hidden lg:flex gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Add
            </Button>
            <ThemeToggle />
            {authStatus === 'loading' ? null : session ? (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title={`Signed in as ${session.user?.email}`}
                className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="w-9 h-9 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-24 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 relative">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile/Tablet) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-2 border-t border-border/60 bg-background/80 backdrop-blur-xl pb-safe lg:hidden h-[72px] shadow-[0_-2px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_24px_rgba(0,0,0,0.3)]">
        {/* Left tabs */}
        <div className="flex flex-1 justify-around items-center h-full">
          {tabs.slice(0, 2).map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-200 ${
                  isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 rounded-b-full shadow-[0_2px_8px_var(--color-primary)]"></div>
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200`} />
                <span className={`text-[10px] font-semibold tracking-wide`}>{tab.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Center FAB */}
        <div className="flex-shrink-0 flex items-center justify-center -mt-6 z-50 px-2">
           <button
             onClick={() => setIsAddOpen(true)}
             className="w-14 h-14 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-all duration-200 border-4 border-background/80 ring-2 ring-primary/20"
           >
             <Plus className="w-6 h-6" />
           </button>
        </div>

        {/* Right tabs */}
        <div className="flex flex-1 justify-around items-center h-full">
          {tabs.slice(2).map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-200 ${
                  isActive ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-primary/70 via-primary to-primary/70 rounded-b-full shadow-[0_2px_8px_var(--color-primary)]"></div>
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200`} />
                <span className={`text-[10px] font-semibold tracking-wide`}>{tab.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Global Add Form */}
      <TransactionForm open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  )
}
