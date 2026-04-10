"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart as PieChartIcon, Activity } from "lucide-react"
import { format, parseISO } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from "recharts"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  const [view, setView] = useState<"income" | "expense">("expense")
  
  const transactions = useLiveQuery(() => db.transactions.filter(t => !t.deletedAt).toArray())
  const categories = useLiveQuery(() => db.categories.filter(c => !c.deletedAt).toArray())

  if (!transactions || !categories) return null

  // Process data for charts
  const categoryMap = Object.fromEntries(categories.map(c => [c.syncId, c]))

  // 1. Time-based Bar Chart (last 6 months or similar if we group by month)
  // Let's just group by month simply
  const monthlyDataMap: Record<string, { name: string, income: number, expense: number }> = {}
  
  transactions.forEach(tx => {
    const month = tx.date.substring(0, 7) // yyyy-MM
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { name: format(parseISO(tx.date), "MMM yyyy"), income: 0, expense: 0 }
    }
    if (tx.type === "income") {
      monthlyDataMap[month].income += tx.amount
    } else {
      monthlyDataMap[month].expense += tx.amount
    }
  })

  const barData = Object.keys(monthlyDataMap).sort().map(key => monthlyDataMap[key])

  // 2. Category Breakdown
  const categoryBreakdown = transactions
    .filter(t => t.type === view)
    .reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const pieData = Object.entries(categoryBreakdown).map(([catId, amount]) => {
     const cat = categoryMap[catId]
     return {
       name: cat?.name || 'Unknown',
       value: amount,
       color: cat?.color || '#ccc'
     }
  }).sort((a, b) => b.value - a.value) // Sort by highest amount

  return (
    <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
             Reports
           </h1>
           <p className="text-muted-foreground mt-1 text-sm font-medium">Deep dive into your finances.</p>
         </div>
         <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
           <PieChartIcon className="w-6 h-6 text-primary" />
         </div>
       </div>

       {/* Flow Chart (Income vs Expense) */}
       <Card className="border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
         <CardHeader className="px-8 pt-8 pb-4 border-b border-border/20 bg-card/30">
            <CardTitle className="text-lg font-bold">Cash Flow</CardTitle>
            <CardDescription className="text-sm font-medium">Monthly income vs expenses</CardDescription>
         </CardHeader>
         <CardContent className="p-6">
           {barData.length === 0 ? (
             <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-4">
               <Activity className="w-8 h-8 opacity-40 text-muted-foreground" />
               <p className="font-medium opacity-80">Not enough data to display</p>
             </div>
           ) : (
             <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                   <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                   <Tooltip
                     cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
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
                   <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, opacity: 0.8 }} />
                   <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           )}
         </CardContent>
       </Card>

       {/* Category Breakdown */}
       <Card className="border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
         <CardHeader className="px-8 pt-8 pb-4 border-b border-border/20 bg-card/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Breakdown</CardTitle>
              <CardDescription className="text-sm font-medium">Spending & earning by category</CardDescription>
            </div>
         </CardHeader>
         <CardContent className="p-6 space-y-6">
           <div className="flex bg-card/60 p-1.5 rounded-2xl gap-1 shadow-inner border border-border/20 w-fit mx-auto">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setView("expense")}
               className={`rounded-xl text-xs font-bold h-9 px-6 transition-all duration-300 ${
                 view === "expense"
                   ? "bg-expense text-white shadow-md scale-100"
                   : "text-muted-foreground hover:text-foreground scale-95 opacity-80"
               }`}
             >
               Expenses
             </Button>
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setView("income")}
               className={`rounded-xl text-xs font-bold h-9 px-6 transition-all duration-300 ${
                 view === "income"
                   ? "bg-income text-white shadow-md scale-100"
                   : "text-muted-foreground hover:text-foreground scale-95 opacity-80"
               }`}
             >
               Incomes
             </Button>
           </div>

           {pieData.length === 0 ? (
             <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-4">
               <PieChartIcon className="w-8 h-8 opacity-40" />
               <p className="font-medium opacity-80">No {view} data to display</p>
             </div>
           ) : (
             <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={110}
                     paddingAngle={6}
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
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           )}

           {/* Category List */}
           {pieData.length > 0 && (
             <div className="pt-4 grid grid-cols-2 gap-4 max-w-sm mx-auto">
               {pieData.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                   <span className="text-sm font-semibold truncate text-foreground/90">{item.name}</span>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
    </div>
  )
}
