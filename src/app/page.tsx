"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { IndianRupee, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import { format } from "date-fns"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export default function DashboardPage() {
  const transactions = useLiveQuery(() => db.transactions.filter(t => !t.deletedAt).toArray())
  const categories = useLiveQuery(() => db.categories.filter(c => !c.deletedAt).toArray())

  if (!transactions || !categories) return null

  const currentMonth = format(new Date(), "yyyy-MM")
  
  // Calculations
  const lifetimeIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const lifetimeExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const totalBalance = lifetimeIncome - lifetimeExpense

  const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth))
  const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const monthlyExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  // Chart Data
  const expensesByCategory = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount
    return acc
  }, {} as Record<string, number>)

  const categoryMap = Object.fromEntries(categories.map(c => [c.syncId, c]))

  const pieData = Object.entries(expensesByCategory).map(([catId, amount]) => {
     const cat = categoryMap[catId]
     return {
       name: cat?.name || 'Unknown',
       value: amount,
       color: cat?.color || '#ccc'
     }
  })

  // Recent transactions (last 5)
  const recentTx = [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return (
    <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
       {/* Page Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
             Overview
           </h1>
           <p className="text-muted-foreground mt-1 text-sm font-medium">
             Your financial summary for <span className="text-foreground">{format(new Date(), "MMMM yyyy")}</span>.
           </p>
         </div>
         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
           <Activity className="w-6 h-6 text-primary" />
         </div>
       </div>

       {/* Balance + Stats Cards */}
       <div className="grid gap-5 sm:grid-cols-3">
         {/* Total Balance - Ultra Modern Hero Card */}
         <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[oklch(0.4_0.2_280)] text-primary-foreground border-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] col-span-1 sm:col-span-1 rounded-[2rem]">
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/20 rounded-full blur-3xl" />
           <CardHeader className="flex flex-row items-center justify-between pb-0 space-y-0 relative z-10 pt-8 px-8">
             <CardTitle className="text-sm font-medium tracking-wide opacity-90 uppercase">Total Balance</CardTitle>
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10">
               <Wallet className="w-5 h-5 text-white" />
             </div>
           </CardHeader>
           <CardContent className="relative z-10 px-8 pb-8 pt-4">
             <div className="text-5xl font-black flex items-center tracking-tighter drop-shadow-md">
               <IndianRupee className="w-8 h-8 mr-1 opacity-80" />
               {totalBalance.toFixed(2)}
             </div>
             <p className="text-sm mt-3 opacity-80 font-medium flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               Live net balance
             </p>
           </CardContent>
         </Card>

         <div className="grid gap-5 grid-cols-2 sm:grid-cols-1 sm:col-span-2 sm:grid-rows-2">
           {/* Monthly Income Container */}
           <div className="relative group perspective-1000">
             <Card className="h-full border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden group-hover:border-income/30 group-hover:bg-income/5">
               <div className="absolute inset-0 bg-gradient-to-br from-income/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10 px-6 pt-6">
                 <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-income transition-colors duration-300">Income</CardTitle>
                 <div className="w-8 h-8 rounded-full bg-income/10 flex items-center justify-center group-hover:bg-income group-hover:text-white transition-all duration-500 text-income shadow-sm">
                   <ArrowUpRight className="w-4 h-4" />
                 </div>
               </CardHeader>
               <CardContent className="relative z-10 px-6 pb-6">
                 <div className="text-2xl sm:text-3xl font-black flex items-center tracking-tight text-foreground">
                   <IndianRupee className="w-5 h-5 mr-0.5 opacity-50" />{monthlyIncome.toFixed(2)}
                 </div>
               </CardContent>
             </Card>
           </div>

           {/* Monthly Expense Container */}
           <div className="relative group perspective-1000">
             <Card className="h-full border-border/40 bg-card/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden group-hover:border-expense/30 group-hover:bg-expense/5">
               <div className="absolute inset-0 bg-gradient-to-br from-expense/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10 px-6 pt-6">
                 <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-expense transition-colors duration-300">Expense</CardTitle>
                 <div className="w-8 h-8 rounded-full bg-expense/10 flex items-center justify-center group-hover:bg-expense group-hover:text-white transition-all duration-500 text-expense shadow-sm">
                   <ArrowDownRight className="w-4 h-4" />
                 </div>
               </CardHeader>
               <CardContent className="relative z-10 px-6 pb-6">
                 <div className="text-2xl sm:text-3xl font-black flex items-center tracking-tight text-foreground">
                   <IndianRupee className="w-5 h-5 mr-0.5 opacity-50" />{monthlyExpense.toFixed(2)}
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>

       {/* Charts + Recent Transactions */}
       <div className="grid gap-6 sm:grid-cols-2">
          {/* Expense Breakdown */}
          <Card className="col-span-1 border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border/20 bg-card/30">
               <CardTitle className="text-lg font-bold">Analytics</CardTitle>
               <CardDescription className="text-sm font-medium">Spending breakdown this month</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {pieData.length === 0 ? (
                 <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-4">
                   <div className="w-20 h-20 rounded-full bg-card/50 flex items-center justify-center shadow-inner border border-border/50">
                     <TrendingDown className="w-8 h-8 opacity-40" />
                   </div>
                   <p className="font-medium opacity-80">No expenses recorded</p>
                 </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={12}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm hover:opacity-80 transition-opacity duration-300 outline-none" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `₹${Number(value || 0).toFixed(2)}`}
                        contentStyle={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={10}
                        formatter={(value: string) => (
                          <span className="text-foreground/80 text-xs font-semibold ml-1">{value}</span>
                        )}
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-1 border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4 border-b border-border/20 bg-card/30 flex flex-row items-center justify-between">
               <div>
                 <CardTitle className="text-lg font-bold">Recent</CardTitle>
                 <CardDescription className="text-sm font-medium">Latest transactions</CardDescription>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentTx.length === 0 ? (
                 <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-4">
                   <div className="w-20 h-20 rounded-full bg-card/50 flex items-center justify-center shadow-inner border border-border/50">
                     <Wallet className="w-8 h-8 opacity-40" />
                   </div>
                   <p className="font-medium opacity-80">No activity yet</p>
                 </div>
              ) : (
                <div className="divide-y divide-border/20 px-4">
                  {recentTx.map((tx) => {
                    const cat = categoryMap[tx.categoryId]
                    return (
                      <div key={tx.id} className="flex items-center gap-4 py-4 px-4 hover:bg-accent/40 transition-colors duration-200 rounded-2xl my-1 group">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-300"
                          style={{ backgroundColor: cat?.color || '#aaa' }}
                        >
                          {cat?.name.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold truncate tracking-tight">{cat?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground font-medium mt-0.5">{format(new Date(tx.date), "MMMM d")}</p>
                        </div>
                        <span className={`text-base font-black tabular-nums tracking-tight ${tx.type === 'income' ? 'text-income' : 'text-foreground'}`}>
                          {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
       </div>
    </div>
  )
}
