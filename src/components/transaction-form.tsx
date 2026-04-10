"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react"

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0" }),
  categoryId: z.string().min(1, { message: "Please select a category" }),
  paymentMethodId: z.string().min(1, { message: "Please select a payment method" }),
  date: z.string(),
  description: z.string().optional(),
})

export function TransactionForm({ transactionId, open, onOpenChange }: { transactionId?: number, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [isEditMode, setIsEditMode] = useState(!!transactionId)
  
  const categories = useLiveQuery(() => db.categories.filter(c => !c.deletedAt).toArray())
  const paymentMethods = useLiveQuery(() => db.paymentMethods.filter(pm => !pm.deletedAt).toArray())

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "expense",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      categoryId: "",
      paymentMethodId: "",
    },
  })

  const formType = form.watch("type")
  const filteredCategories = categories?.filter(c => c.type === formType) || []

  useEffect(() => {
    async function loadData() {
      if (transactionId) {
        const tx = await db.transactions.get(transactionId)
        if (tx) {
          form.reset({
            type: tx.type,
            amount: tx.amount,
            categoryId: tx.categoryId,
            paymentMethodId: tx.paymentMethodId,
            date: tx.date,
            description: tx.description || "",
          })
          setIsEditMode(true)
        }
      } else {
        form.reset({
          type: "expense",
          amount: 0,
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
          categoryId: "",
          paymentMethodId: "",
        })
        setIsEditMode(false)
      }
    }
    if (open) {
      loadData()
    }
  }, [transactionId, open, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const now = Date.now()
    try {
      if (isEditMode && transactionId) {
        await db.transactions.update(transactionId, {
          ...values,
          updatedAt: now,
          isSynced: false,
        })
        toast.success("Transaction updated successfully")
      } else {
        await db.transactions.add({
          ...values,
          syncId: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          isSynced: false,
        })
        toast.success("Transaction added successfully")
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("An error occurred while saving the transaction")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[2rem]">
        <DialogHeader className="text-left space-y-1 p-6 pb-4 border-b border-border/30 bg-card/30">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">{isEditMode ? "Edit Transaction" : "New Transaction"}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm font-medium opacity-80 px-1">
            {isEditMode ? "Update your transaction details below." : "Log a new transaction to your account."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 overflow-y-auto max-h-[75vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-80 pl-1">Type</FormLabel>
                    <div className="flex bg-card/60 p-1.5 rounded-2xl gap-1 shadow-inner border border-border/30 backdrop-blur-sm">
                       <Button 
                        type="button"
                        variant="ghost"
                        className={`flex-1 rounded-xl gap-2 transition-all duration-300 font-bold h-12 ${
                          field.value === "expense"
                            ? "bg-expense text-white shadow-md hover:bg-expense/90 scale-100"
                            : "text-muted-foreground hover:text-foreground scale-95 opacity-70 hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          field.onChange("expense")
                          form.setValue("categoryId", "")
                        }}
                       >
                         <ArrowDownRight className="w-5 h-5" />
                         Expense
                       </Button>
                       <Button 
                        type="button"
                        variant="ghost"
                        className={`flex-1 rounded-xl gap-2 transition-all duration-300 font-bold h-12 ${
                          field.value === "income"
                            ? "bg-income text-white shadow-md hover:bg-income/90 scale-100"
                            : "text-muted-foreground hover:text-foreground scale-95 opacity-70 hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          field.onChange("income")
                          form.setValue("categoryId", "")
                        }}
                       >
                         <ArrowUpRight className="w-5 h-5" />
                         Income
                       </Button>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-80 pl-1">Amount</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-black text-2xl transition-colors group-focus-within:text-primary">₹</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="pl-11 text-4xl font-black h-16 rounded-2xl bg-card/40 border-border/40 shadow-inner focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all font-sans" 
                          placeholder="0.00" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl h-14 px-4 bg-card/40 border-border/40 font-semibold shadow-sm focus:ring-primary/30">
                            <SelectValue placeholder="Select one">
                               {field.value ? categories?.find(c => c.syncId === field.value)?.name : "Select one"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
                          {filteredCategories.map((c) => (
                            <SelectItem key={c.syncId} value={c.syncId} className="rounded-xl font-medium cursor-pointer my-0.5">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl h-14 px-4 bg-card/40 border-border/40 font-semibold shadow-sm focus:ring-primary/30">
                            <SelectValue placeholder="Method">
                               {field.value ? paymentMethods?.find(pm => pm.syncId === field.value)?.name : "Method"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
                          {paymentMethods?.map((pm) => (
                            <SelectItem key={pm.syncId} value={pm.syncId} className="rounded-xl font-medium cursor-pointer my-0.5">{pm.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-80 pl-1">Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-2xl h-12 bg-card/40 border-border/40 font-semibold shadow-sm focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-80 pl-1">Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What was this for?" className="rounded-2xl h-12 bg-card/40 border-border/40 font-medium shadow-sm focus-visible:ring-primary/30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full text-lg font-black h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95 text-white"
                >
                  {isEditMode ? "Save Changes" : "Confirm Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
