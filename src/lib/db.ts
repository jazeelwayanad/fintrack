import Dexie, { type EntityTable } from 'dexie';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id?: number;
  syncId: string;       // UUID – used as primary key on server
  type: TransactionType;
  amount: number;
  categoryId: string;   // now references Category.syncId
  paymentMethodId: string; // now references PaymentMethod.syncId
  date: string;         // YYYY-MM-DD
  description?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;   // soft-delete
  isSynced: boolean;
}

export interface Category {
  id?: number;
  syncId: string;
  type: TransactionType;
  name: string;
  icon: string;
  color: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  isSynced: boolean;
}

export interface PaymentMethod {
  id?: number;
  syncId: string;
  name: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  isSynced: boolean;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: 'transactions' | 'categories' | 'paymentMethods';
  syncId: string;
  timestamp: number;
}

const db = new Dexie('FinTrackDB') as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  categories: EntityTable<Category, 'id'>;
  paymentMethods: EntityTable<PaymentMethod, 'id'>;
  syncQueue: EntityTable<SyncQueueItem, 'id'>;
};

// Old v1 schema (keep for migration reference)
db.version(1).stores({
  transactions: '++id, type, categoryId, paymentMethodId, date, createdAt, isSynced',
  categories: '++id, type, name',
  paymentMethods: '++id, name',
});

// New v2 schema with syncId, updatedAt, deletedAt, syncQueue
db.version(2).stores({
  transactions: '++id, syncId, type, categoryId, paymentMethodId, date, createdAt, updatedAt, isSynced',
  categories: '++id, syncId, type, name, updatedAt, isSynced',
  paymentMethods: '++id, syncId, name, updatedAt, isSynced',
  syncQueue: '++id, operation, table, syncId, timestamp',
}).upgrade(async (tx) => {
  // Migrate existing categories with syncId
  await tx.table('categories').toCollection().modify((cat) => {
    if (!cat.syncId) cat.syncId = crypto.randomUUID();
    if (!cat.createdAt) cat.createdAt = Date.now();
    if (!cat.updatedAt) cat.updatedAt = Date.now();
    if (cat.isSynced === undefined) cat.isSynced = false;
    if (!cat.icon) cat.icon = '';
  });

  // Migrate existing payment methods with syncId
  await tx.table('paymentMethods').toCollection().modify((pm) => {
    if (!pm.syncId) pm.syncId = crypto.randomUUID();
    if (!pm.createdAt) pm.createdAt = Date.now();
    if (!pm.updatedAt) pm.updatedAt = Date.now();
    if (pm.isSynced === undefined) pm.isSynced = false;
    if (!pm.icon) pm.icon = '';
  });

  // Migrate existing transactions with syncId
  await tx.table('transactions').toCollection().modify((t) => {
    if (!t.syncId) t.syncId = crypto.randomUUID();
    if (!t.updatedAt) t.updatedAt = t.createdAt ?? Date.now();
    if (t.isSynced === undefined) t.isSynced = false;
  });
});

// Seed defaults only on first create
db.on('populate', () => {
  const now = Date.now();
  db.categories.bulkAdd([
    { syncId: crypto.randomUUID(), type: 'income', name: 'Salary', icon: 'wallet', color: '#4ade80', createdAt: now, updatedAt: now, isSynced: false },
    { syncId: crypto.randomUUID(), type: 'expense', name: 'Food', icon: 'pizza', color: '#f87171', createdAt: now, updatedAt: now, isSynced: false },
    { syncId: crypto.randomUUID(), type: 'expense', name: 'Transport', icon: 'car', color: '#60a5fa', createdAt: now, updatedAt: now, isSynced: false },
    { syncId: crypto.randomUUID(), type: 'expense', name: 'Bills', icon: 'file-text', color: '#fbbf24', createdAt: now, updatedAt: now, isSynced: false },
  ]);
  db.paymentMethods.bulkAdd([
    { syncId: crypto.randomUUID(), name: 'Cash', icon: 'banknote', createdAt: now, updatedAt: now, isSynced: false },
    { syncId: crypto.randomUUID(), name: 'Card', icon: 'credit-card', createdAt: now, updatedAt: now, isSynced: false },
  ]);
});

export { db };
