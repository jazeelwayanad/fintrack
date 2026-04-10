"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, Transaction, Category, PaymentMethod } from "@/lib/db"
import { TransactionForm } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MoreVertical, Pencil, Trash2, Filter, IndianRupee, ArrowUpRight, ArrowDownRight, ReceiptText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, parseISO } from "date-fns"
import { Input } from "@/components/ui/input"

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>(undefined)
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"))
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().filter(t => !t.deletedAt).toArray())
  const categories = useLiveQuery(() => db.categories.filter(c => !c.deletedAt).toArray())
  const paymentMethods = useLiveQuery(() => db.paymentMethods.filter(pm => !pm.deletedAt).toArray())

  if (!transactions || !categories || !paymentMethods) return null

  // Fast lookups
  const categoryMap = Object.fromEntries(categories.map((c: Category) => [c.syncId, c]))
  const pmMap = Object.fromEntries(paymentMethods.map((pm: PaymentMethod) => [pm.syncId, pm]))

  const filteredTx = transactions.filter((t: Transaction) => {
    let match = t.date.startsWith(filterMonth)
    if (filterType !== "all") {
       match = match && t.type === filterType
    }
    return match
  })

  const handleEdit = (id: number) => {
    setEditingId(id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await db.transactions.update(id, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        isSynced: false
      })
    }
  }

  const filterOptions = [
    { label: "All", value: "all" as const },
    { label: "Expense", value: "expense" as const },
    { label: "Income", value: "income" as const },
  ]

  return (
    <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
            History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Review your income and expenses.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
           <ReceiptText className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Filters - Glassmorphic Container */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-background/50 backdrop-blur-xl p-4 rounded-[2rem] border border-border/40 shadow-sm">
         <Input
           type="month"
           value={filterMonth}
           onChange={(e) => setFilterMonth(e.target.value)}
           className="w-[160px] rounded-2xl text-sm font-bold bg-card/60 h-12 border-none shadow-inner"
         />
         <div className="flex bg-card/60 p-1.5 rounded-2xl gap-1 shadow-inner border border-border/20">
           {filterOptions.map(opt => (
             <Button
               key={opt.value}
               variant="ghost"
               size="sm"
               onClick={() => setFilterType(opt.value)}
               className={`rounded-xl text-xs font-bold h-9 px-4 transition-all duration-300 ${
                 filterType === opt.value
                   ? "bg-primary text-primary-foreground shadow-md scale-100"
                   : "text-muted-foreground hover:text-foreground scale-95 opacity-80"
               }`}
             >
               {opt.label}
             </Button>
           ))}
         </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTx.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4 bg-background/30 rounded-[2rem] border border-border/20 backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-card/50 flex items-center justify-center shadow-inner border border-border/50">
              <Filter className="w-8 h-8 opacity-40" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground/80">No transactions found</p>
              <p className="text-sm mt-1 font-medium opacity-80">Change the filter or add a new transaction.</p>
            </div>
          </div>
        ) : (
          filteredTx.map((tx: Transaction) => {
             const cat = categoryMap[tx.categoryId] as Category | undefined
             const pm = pmMap[tx.paymentMethodId] as PaymentMethod | undefined

             return (
               <Card key={tx.id} className="group p-5 flex items-center justify-between border-border/40 bg-card/50 backdrop-blur-xl shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem] hover:scale-[1.01] hover:bg-card">
                 <div className="flex items-center gap-5 w-full">
                    {/* Category icon with colored background */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.15)] group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-shadow duration-300 relative overflow-hidden"
                      style={{ backgroundColor: cat?.color || '#aaa' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <span className="text-xl font-black relative z-10 drop-shadow-md">{cat?.name.charAt(0) || '?'}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-lg truncate tracking-tight text-foreground/90">{cat?.name || 'Unknown'}</p>
                      <div className="flex items-center text-xs font-semibold text-muted-foreground/80 mt-1 gap-2">
                         <span>{format(parseISO(tx.date), "MMM d, yyyy")}</span>
                         <span className="w-1 h-1 rounded-full bg-border"></span>
                         <span>{pm?.name || 'Unknown'}</span>
                      </div>
                      {tx.description && <p className="text-sm font-medium text-muted-foreground truncate mt-1.5 opacity-80">{tx.description}</p>}
                    </div>

                    {/* Amount + Actions */}
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={`font-black tracking-tighter text-xl tabular-nums flex items-center drop-shadow-sm ${tx.type === 'income' ? 'text-income' : 'text-foreground/90'}`}>
                           {tx.type === 'income' ? (
                             <ArrowUpRight className="w-4 h-4 mr-0.5" />
                           ) : (
                             <ArrowDownRight className="w-4 h-4 mr-0.5 opacity-50 text-expense" />
                           )}
                           <IndianRupee className="inline w-4 h-4 mr-0.5 opacity-70" />{tx.amount.toFixed(2)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 outline-none shadow-inner border border-border/50">
                            <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl p-2 shadow-xl border-border/40 bg-background/95 backdrop-blur-xl">
                          <DropdownMenuItem onClick={() => handleEdit(tx.id!)} className="rounded-xl py-3 font-semibold cursor-pointer">
                            <Pencil className="w-4 h-4 mr-3" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 rounded-xl py-3 font-semibold cursor-pointer mt-1" onClick={() => handleDelete(tx.id!)}>
                            <Trash2 className="w-4 h-4 mr-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                 </div>
               </Card>
             )
          })
        )}
      </div>

      <TransactionForm open={isFormOpen} onOpenChange={setIsFormOpen} transactionId={editingId} />
    </div>
  )
}
