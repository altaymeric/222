import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Payment } from '../types/payment';

interface PaymentDB extends DBSchema {
  payments: {
    key: string;
    value: Payment;
    indexes: {
      'by-date': Date;
    };
  };
}

class Database {
  private dbPromise: Promise<IDBPDatabase<PaymentDB>>;

  constructor() {
    this.dbPromise = openDB<PaymentDB>('payment-tracker', 1, {
      upgrade(db) {
        const store = db.createObjectStore('payments', { keyPath: 'id' });
        store.createIndex('by-date', 'dueDate');
      },
    });
  }

  async getAllPayments(): Promise<Payment[]> {
    const db = await this.dbPromise;
    return db.getAll('payments');
  }

  async savePayment(payment: Payment): Promise<void> {
    const db = await this.dbPromise;
    await db.put('payments', {
      ...payment,
      dueDate: new Date(payment.dueDate)
    });
  }

  async savePayments(payments: Payment[]): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('payments', 'readwrite');
    await Promise.all([
      ...payments.map(payment => tx.store.put({
        ...payment,
        dueDate: new Date(payment.dueDate)
      })),
      tx.done
    ]);
  }

  async updatePayment(payment: Payment): Promise<void> {
    await this.savePayment(payment);
  }

  async deletePayment(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('payments', id);
  }

  async deleteAllPayments(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction('payments', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }
}

export const db = new Database();