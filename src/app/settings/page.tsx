"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { ThemeToggle } from "@/components/theme-toggle"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Palette, CreditCard, Tag, Sun, Moon, Monitor, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const categories = useLiveQuery(() => db.categories.toArray())
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray())
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Modals state
  const [catOpen, setCatOpen] = useState(false)
  const [pmOpen, setPmOpen] = useState(false)

  // Form states
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense")
  const [newCatColor, setNewCatColor] = useState("#8b5cf6")

  const [newPmName, setNewPmName] = useState("")

  useEffect(() => setMounted(true), [])

  const deleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await db.categories.update(id, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        isSynced: false
      })
      toast.success("Category deleted")
    }
  }

  const deletePaymentMethod = async (id: number) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      await db.paymentMethods.update(id, {
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        isSynced: false
      })
      toast.success("Payment method deleted")
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const now = Date.now()
    await db.categories.add({
      syncId: crypto.randomUUID(),
      name: newCatName,
      type: newCatType,
      color: newCatColor,
      icon: "",
      createdAt: now,
      updatedAt: now,
      isSynced: false
    })
    setNewCatName("")
    setCatOpen(false)
    toast.success("Category added successfully")
  }

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPmName.trim()) return
    const now = Date.now()
    await db.paymentMethods.add({
      syncId: crypto.randomUUID(),
      name: newPmName,
      icon: "",
      createdAt: now,
      updatedAt: now,
      isSynced: false
    })
    setNewPmName("")
    setPmOpen(false)
    toast.success("Payment method added successfully")
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun, description: "Clean and bright" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { value: "system", label: "System", icon: Monitor, description: "Follow device" },
  ]

  return (
    <div className="space-y-8 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground via-foreground/90 to-foreground/50 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Manage your preferences and configurations.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
           <Settings className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Appearance */}
      <Card className="border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4 border-b border-border/20 bg-card/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Appearance</CardTitle>
              <CardDescription className="text-sm font-medium">Customize how FinTrack looks.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {mounted && (
            <div className="grid grid-cols-3 gap-4">
              {themeOptions.map((opt) => {
                const Icon = opt.icon
                const isActive = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`relative flex flex-col items-center gap-2 p-5 rounded-3xl border-2 transition-all duration-300 text-center hover:scale-105 active:scale-95 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-[0_4px_16px_rgba(0,0,0,0.1)] ring-2 ring-primary/20"
                        : "border-transparent bg-card/60 hover:bg-card hover:border-border/60 hover:shadow-md"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-bold mt-1 ${isActive ? "text-primary" : "text-foreground/80"}`}>{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block font-medium">{opt.description}</p>
                    </div>
                    {isActive && (
                      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card className="border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="px-8 pt-6 pb-4 border-b border-border/20 bg-card/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Tag className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <CardTitle className="text-lg font-bold">Categories</CardTitle>
              <CardDescription className="text-sm font-medium">Manage expense & income categories.</CardDescription>
            </div>
            <div className="sm:hidden">
              <CardTitle className="text-lg font-bold">Categories</CardTitle>
            </div>
          </div>
          
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
             <DialogTrigger render={<Button size="sm" className="rounded-xl shadow-md h-10 px-4 gap-2 font-bold hover:scale-105 active:scale-95 transition-all" />}>
                <Plus className="w-4 h-4" /> Add New
             </DialogTrigger>
             <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[2rem]">
               <DialogHeader className="text-left space-y-1 p-6 pb-4 border-b border-border/30 bg-card/30">
                 <DialogTitle className="text-2xl font-black">Add Category</DialogTitle>
                 <DialogDescription className="font-medium opacity-80">Create a new category for your transactions.</DialogDescription>
               </DialogHeader>
               <form onSubmit={handleAddCategory} className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80 pl-1">Name</label>
                    <Input 
                      required 
                      value={newCatName} 
                      onChange={e => setNewCatName(e.target.value)} 
                      placeholder="e.g. Groceries" 
                      className="rounded-2xl h-12 bg-card/40 border-border/40 font-medium focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80 pl-1">Type</label>
                    <Select value={newCatType} onValueChange={(val: any) => setNewCatType(val)}>
                      <SelectTrigger className="rounded-2xl h-12 bg-card/40 border-border/40 font-medium focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-border/40 shadow-xl backdrop-blur-xl bg-background/95">
                         <SelectItem value="expense" className="rounded-xl font-medium cursor-pointer my-0.5">Expense</SelectItem>
                         <SelectItem value="income" className="rounded-xl font-medium cursor-pointer my-0.5">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80 pl-1">Color</label>
                    <div className="flex gap-4 items-center bg-card/40 border border-border/40 p-2 rounded-2xl">
                      <input 
                        type="color" 
                        value={newCatColor} 
                        onChange={e => setNewCatColor(e.target.value)} 
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0 p-0 overflow-hidden" 
                      />
                      <span className="font-medium font-mono text-sm uppercase opacity-80">{newCatColor}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">Save Category</Button>
               </form>
             </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {categories?.filter(c => c.type === 'expense').length === 0 && categories?.filter(c => c.type === 'income').length === 0 && (
              <div className="col-span-full py-8 text-center text-muted-foreground font-medium opacity-80">No categories found.</div>
            )}
            {categories?.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between p-3 border border-border/40 rounded-2xl bg-card/40 transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:bg-card">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm font-black text-xl"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-base tracking-tight">{cat.name}</p>
                    <span className={`inline-flex items-center text-[10px] font-black tracking-widest uppercase mt-0.5 px-2 py-0.5 rounded-lg ${
                      cat.type === 'income'
                        ? 'bg-income/20 text-income'
                        : 'bg-expense/20 text-expense'
                    }`}>
                      {cat.type}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cat.id && deleteCategory(cat.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded-xl mr-1"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="border-border/40 bg-background/50 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden">
         <CardHeader className="px-8 pt-6 pb-4 border-b border-border/20 bg-card/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <CardTitle className="text-lg font-bold">Payment Methods</CardTitle>
              <CardDescription className="text-sm font-medium">Manage how you pay.</CardDescription>
            </div>
            <div className="sm:hidden">
              <CardTitle className="text-lg font-bold">Payment</CardTitle>
            </div>
          </div>
          
          <Dialog open={pmOpen} onOpenChange={setPmOpen}>
             <DialogTrigger render={<Button size="sm" className="rounded-xl shadow-md h-10 px-4 gap-2 font-bold hover:scale-105 active:scale-95 transition-all" />}>
                <Plus className="w-4 h-4" /> Add New
             </DialogTrigger>
             <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[2rem]">
               <DialogHeader className="text-left space-y-1 p-6 pb-4 border-b border-border/30 bg-card/30">
                 <DialogTitle className="text-2xl font-black">Add Payment Method</DialogTitle>
                 <DialogDescription className="font-medium opacity-80">Add a new wallet, card, or bank account.</DialogDescription>
               </DialogHeader>
               <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-80 pl-1">Method Name</label>
                    <Input 
                      required 
                      value={newPmName} 
                      onChange={e => setNewPmName(e.target.value)} 
                      placeholder="e.g. Credit Card" 
                      className="rounded-2xl h-12 bg-card/40 border-border/40 font-medium focus-visible:ring-primary/30"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">Save Method</Button>
               </form>
             </DialogContent>
          </Dialog>

        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods?.length === 0 && (
               <div className="col-span-full py-8 text-center text-muted-foreground font-medium opacity-80">No payment methods found.</div>
            )}
            {paymentMethods?.map((pm) => (
              <div key={pm.id} className="group flex items-center justify-between p-3 border border-border/40 rounded-2xl bg-card/40 transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:bg-card">
                 <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-foreground font-black text-xl shadow-inner border border-border/50">
                     {pm.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-base tracking-tight">{pm.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => pm.id && deletePaymentMethod(pm.id)}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all rounded-xl mr-1"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
