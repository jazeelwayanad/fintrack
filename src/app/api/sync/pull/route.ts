import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface SyncTransaction {
  id: string
  type: string
  amount: number
  categoryId: string
  paymentMethodId: string
  date: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface SyncCategory {
  id: string
  type: string
  name: string
  icon: string
  color: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

interface SyncPaymentMethod {
  id: string
  name: string
  icon: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

// GET /api/sync/pull?since=<timestamp_ms>
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const sinceParam = req.nextUrl.searchParams.get("since")
  const since = sinceParam ? new Date(parseInt(sinceParam)) : new Date(0)

  const [transactions, categories, paymentMethods] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, updatedAt: { gt: since } },
    }) as Promise<SyncTransaction[]>,
    prisma.category.findMany({
      where: { userId, updatedAt: { gt: since } },
    }) as Promise<SyncCategory[]>,
    prisma.paymentMethod.findMany({
      where: { userId, updatedAt: { gt: since } },
    }) as Promise<SyncPaymentMethod[]>,
  ])

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      syncId: t.id,
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      paymentMethodId: t.paymentMethodId,
      date: t.date,
      description: t.description,
      createdAt: t.createdAt.getTime(),
      updatedAt: t.updatedAt.getTime(),
      deletedAt: t.deletedAt?.getTime() ?? null,
    })),
    categories: categories.map((c) => ({
      syncId: c.id,
      type: c.type,
      name: c.name,
      icon: c.icon,
      color: c.color,
      createdAt: c.createdAt.getTime(),
      updatedAt: c.updatedAt.getTime(),
      deletedAt: c.deletedAt?.getTime() ?? null,
    })),
    paymentMethods: paymentMethods.map((pm) => ({
      syncId: pm.id,
      name: pm.name,
      icon: pm.icon,
      createdAt: pm.createdAt.getTime(),
      updatedAt: pm.updatedAt.getTime(),
      deletedAt: pm.deletedAt?.getTime() ?? null,
    })),
    serverTime: Date.now(),
  })
}
