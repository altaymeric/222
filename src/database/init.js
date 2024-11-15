import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'payment_tracker.db');

function initializeDatabase() {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      permissions TEXT NOT NULL
    )
  `);

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    )
  `);

  // Create category_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS category_items (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Create payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      due_date TEXT NOT NULL,
      check_number TEXT NOT NULL,
      bank TEXT NOT NULL,
      company TEXT NOT NULL,
      business_group TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default admin user if not exists
  const defaultUser = {
    id: '1',
    username: 'altay',
    password: '123456',
    permissions: JSON.stringify({
      add: true,
      edit: true,
      delete: true,
      changeStatus: true,
      manageCategories: true,
      manageUsers: true
    })
  };

  const stmt = db.prepare('INSERT OR IGNORE INTO users (id, username, password, permissions) VALUES (?, ?, ?, ?)');
  stmt.run(defaultUser.id, defaultUser.username, defaultUser.password, defaultUser.permissions);

  // Insert default categories if not exist
  const defaultCategories = [
    { id: 'bank', name: 'Banka', type: 'bank' },
    { id: 'company', name: 'Firma', type: 'company' },
    { id: 'businessGroup', name: 'İş Grubu', type: 'businessGroup' }
  ];

  const categoryStmt = db.prepare('INSERT OR IGNORE INTO categories (id, name, type) VALUES (?, ?, ?)');
  defaultCategories.forEach(category => {
    categoryStmt.run(category.id, category.name, category.type);
  });

  console.log('Database initialized successfully!');
  return db;
}

try {
  initializeDatabase();
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}