import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

interface UnsyncedTransaction {
  syncId: string
  type: string
  amount: number
  categoryId: string
  paymentMethodId: string
  date: string
  description?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

interface UnsyncedCategory {
  syncId: string
  type: string
  name: string
  icon?: string
  color: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

interface UnsyncedPaymentMethod {
  syncId: string
  name: string
  icon?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

// POST /api/sync/push
// Body: { transactions: [...], categories: [...], paymentMethods: [...] }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const { transactions = [], categories = [], paymentMethods = [] } = await req.json()

  // Upsert all records in a transaction
  await prisma.$transaction(async (tx: any) => {
    // Transactions
    for (const t of (transactions as UnsyncedTransaction[])) {
      await tx.transaction.upsert({
        where: { id: t.syncId },
        update: {
          type: t.type,
          amount: t.amount,
          categoryId: t.categoryId,
          paymentMethodId: t.paymentMethodId,
          date: t.date,
          description: t.description ?? null,
          updatedAt: new Date(t.updatedAt),
          deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
        },
        create: {
          id: t.syncId,
          userId,
          type: t.type,
          amount: t.amount,
          categoryId: t.categoryId,
          paymentMethodId: t.paymentMethodId,
          date: t.date,
          description: t.description ?? null,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
        },
      })
    }

    // Categories
    for (const c of (categories as UnsyncedCategory[])) {
      await tx.category.upsert({
        where: { id: c.syncId },
        update: {
          type: c.type,
          name: c.name,
          icon: c.icon ?? "",
          color: c.color,
          updatedAt: new Date(c.updatedAt),
          deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        },
        create: {
          id: c.syncId,
          userId,
          type: c.type,
          name: c.name,
          icon: c.icon ?? "",
          color: c.color,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        },
      })
    }

    // Payment Methods
    for (const pm of (paymentMethods as UnsyncedPaymentMethod[])) {
      await tx.paymentMethod.upsert({
        where: { id: pm.syncId },
        update: {
          name: pm.name,
          icon: pm.icon ?? "",
          updatedAt: new Date(pm.updatedAt),
          deletedAt: pm.deletedAt ? new Date(pm.deletedAt) : null,
        },
        create: {
          id: pm.syncId,
          userId,
          name: pm.name,
          icon: pm.icon ?? "",
          createdAt: new Date(pm.createdAt),
          updatedAt: new Date(pm.updatedAt),
          deletedAt: pm.deletedAt ? new Date(pm.deletedAt) : null,
        },
      })
    }
  })

  return NextResponse.json({ success: true })
}
