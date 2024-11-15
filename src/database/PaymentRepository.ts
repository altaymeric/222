import { Payment } from '../types/payment';
import db from './db';

export class PaymentRepository {
  static savePayment(payment: Payment): void {
    const stmt = db.prepare(`
      INSERT INTO payments (
        id, due_date, check_number, bank, company, 
        business_group, description, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      payment.id,
      payment.dueDate.toISOString(),
      payment.checkNumber,
      payment.bank,
      payment.company,
      payment.businessGroup,
      payment.description,
      payment.amount,
      payment.status
    );
  }

  static savePayments(payments: Payment[]): void {
    const stmt = db.prepare(`
      INSERT INTO payments (
        id, due_date, check_number, bank, company, 
        business_group, description, amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((payments: Payment[]) => {
      for (const payment of payments) {
        stmt.run(
          payment.id,
          payment.dueDate.toISOString(),
          payment.checkNumber,
          payment.bank,
          payment.company,
          payment.businessGroup,
          payment.description,
          payment.amount,
          payment.status
        );
      }
    });

    insertMany(payments);
  }

  static getAllPayments(): Payment[] {
    const stmt = db.prepare('SELECT * FROM payments ORDER BY due_date ASC');
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      dueDate: new Date(row.due_date),
      checkNumber: row.check_number,
      bank: row.bank,
      company: row.company,
      businessGroup: row.business_group,
      description: row.description,
      amount: row.amount,
      status: row.status as 'pending' | 'paid' | 'other'
    }));
  }

  static updatePayment(payment: Payment): void {
    const stmt = db.prepare(`
      UPDATE payments 
      SET due_date = ?,
          check_number = ?,
          bank = ?,
          company = ?,
          business_group = ?,
          description = ?,
          amount = ?,
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      payment.dueDate.toISOString(),
      payment.checkNumber,
      payment.bank,
      payment.company,
      payment.businessGroup,
      payment.description,
      payment.amount,
      payment.status,
      payment.id
    );
  }

  static deletePayment(id: string): void {
    const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
    stmt.run(id);
  }

  static deleteAllPayments(): void {
    const stmt = db.prepare('DELETE FROM payments');
    stmt.run();
  }
}