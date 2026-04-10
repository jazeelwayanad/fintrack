"use client"

// Sync Engine — runs in the browser only
// Processes unsynced local records → pushes to server → pulls server changes

const LAST_SYNC_KEY = 'fintrack_last_synced_at'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'
type SyncListener = (status: SyncStatus) => void

let currentStatus: SyncStatus = 'idle'
const listeners: SyncListener[] = []

export function onSyncStatus(fn: SyncListener) {
  listeners.push(fn)
  fn(currentStatus)
  return () => {
    const idx = listeners.indexOf(fn)
    if (idx > -1) listeners.splice(idx, 1)
  }
}

function setStatus(status: SyncStatus) {
  currentStatus = status
  listeners.forEach((fn) => fn(status))
}

export async function syncNow() {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) {
    setStatus('offline')
    return
  }

  // Dynamically import db to avoid SSR issues
  const { db } = await import('./db')

  setStatus('syncing')
  try {
    const lastSyncedAt = parseInt(localStorage.getItem(LAST_SYNC_KEY) ?? '0')

    // --- PUSH ---
    const unsyncedTransactions = await db.transactions
      .filter((t) => !t.isSynced)
      .toArray()
    const unsyncedCategories = await db.categories
      .filter((c) => !c.isSynced)
      .toArray()
    const unsyncedPaymentMethods = await db.paymentMethods
      .filter((pm) => !pm.isSynced)
      .toArray()

    const hasPending =
      unsyncedTransactions.length > 0 ||
      unsyncedCategories.length > 0 ||
      unsyncedPaymentMethods.length > 0

    if (hasPending) {
      const pushRes = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: unsyncedTransactions,
          categories: unsyncedCategories,
          paymentMethods: unsyncedPaymentMethods,
        }),
      })

      if (!pushRes.ok) {
        const err = await pushRes.json()
        // If 401 — user not logged in, stop silently
        if (pushRes.status === 401) {
          setStatus('idle')
          return
        }
        throw new Error(err.error || 'Push failed')
      }

      // Mark pushed records as synced
      await db.transactions.bulkUpdate(
        unsyncedTransactions.map((t) => ({ key: t.id!, changes: { isSynced: true } }))
      )
      await db.categories.bulkUpdate(
        unsyncedCategories.map((c) => ({ key: c.id!, changes: { isSynced: true } }))
      )
      await db.paymentMethods.bulkUpdate(
        unsyncedPaymentMethods.map((pm) => ({ key: pm.id!, changes: { isSynced: true } }))
      )
    }

    // --- PULL ---
    const pullRes = await fetch(`/api/sync/pull?since=${lastSyncedAt}`)
    if (!pullRes.ok) {
      if (pullRes.status === 401) { setStatus('idle'); return }
      throw new Error('Pull failed')
    }

    const pulled = await pullRes.json()

    // Apply pulled transactions (skip those already modified locally after server updatedAt)
    for (const t of pulled.transactions) {
      const existing = await db.transactions.where('syncId').equals(t.syncId).first()
      if (t.deletedAt) {
        if (existing?.id) await db.transactions.delete(existing.id)
        continue
      }
      if (existing) {
        if (t.updatedAt > (existing.updatedAt ?? 0)) {
          await db.transactions.update(existing.id!, { ...t, isSynced: true })
        }
      } else {
        await db.transactions.add({ ...t, isSynced: true })
      }
    }

    for (const c of pulled.categories) {
      const existing = await db.categories.where('syncId').equals(c.syncId).first()
      if (c.deletedAt) {
        if (existing?.id) await db.categories.delete(existing.id)
        continue
      }
      if (existing) {
        if (c.updatedAt > (existing.updatedAt ?? 0)) {
          await db.categories.update(existing.id!, { ...c, isSynced: true })
        }
      } else {
        await db.categories.add({ ...c, isSynced: true })
      }
    }

    for (const pm of pulled.paymentMethods) {
      const existing = await db.paymentMethods.where('syncId').equals(pm.syncId).first()
      if (pm.deletedAt) {
        if (existing?.id) await db.paymentMethods.delete(existing.id)
        continue
      }
      if (existing) {
        if (pm.updatedAt > (existing.updatedAt ?? 0)) {
          await db.paymentMethods.update(existing.id!, { ...pm, isSynced: true })
        }
      } else {
        await db.paymentMethods.add({ ...pm, isSynced: true })
      }
    }

    localStorage.setItem(LAST_SYNC_KEY, pulled.serverTime.toString())
    setStatus('synced')
  } catch (err) {
    console.error('[SyncEngine]', err)
    setStatus('error')
  }
}

let started = false
export function startBackgroundSync() {
  if (started || typeof window === 'undefined') return
  started = true

  // Sync on startup
  syncNow()

  // Sync when coming back online
  window.addEventListener('online', syncNow)

  // Sync every 5 minutes while online
  setInterval(() => {
    if (navigator.onLine) syncNow()
  }, 5 * 60 * 1000)
}
