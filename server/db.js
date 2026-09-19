const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.TOKO_DB_PATH || path.join(__dirname, 'data', 'toko.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kasir')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    cost INTEGER NOT NULL DEFAULT 0,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total INTEGER NOT NULL,
    paid INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
  );
`);

function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
    );
    insertUser.run('admin', bcrypt.hashSync('admin123', 10), 'Admin Toko', 'admin');
    insertUser.run('kasir', bcrypt.hashSync('kasir123', 10), 'Kasir 1', 'kasir');
  }

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (productCount === 0) {
    const insertProduct = db.prepare(
      'INSERT INTO products (sku, name, category, cost, price, stock) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const samples = [
      ['SKU001', 'Beras 5kg', 'Sembako', 60000, 68000, 25],
      ['SKU002', 'Minyak Goreng 1L', 'Sembako', 15000, 18000, 40],
      ['SKU003', 'Gula Pasir 1kg', 'Sembako', 12000, 15000, 50],
      ['SKU004', 'Indomie Goreng', 'Mie Instan', 2500, 3000, 200],
      ['SKU005', 'Air Mineral 600ml', 'Minuman', 2000, 3000, 150],
      ['SKU006', 'Teh Botol 450ml', 'Minuman', 4000, 5500, 80],
      ['SKU007', 'Sabun Mandi', 'Kebutuhan Rumah', 3000, 4500, 60],
      ['SKU008', 'Sikat Gigi', 'Kebutuhan Rumah', 2500, 4000, 45],
    ];
    db.exec('BEGIN');
    try {
      for (const row of samples) insertProduct.run(...row);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

seedIfEmpty();

module.exports = db;
