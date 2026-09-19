const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

function generateInvoiceNo() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${stamp}-${rand}`;
}

// Checkout: create a new transaction
router.post('/', requireLogin, (req, res) => {
  const { items, paid } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Keranjang kosong' });
  }

  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  const insertTx = db.prepare(
    `INSERT INTO transactions (invoice_no, user_id, total, paid, change_amount) VALUES (?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO transaction_items (transaction_id, product_id, name, price, qty, subtotal) VALUES (?, ?, ?, ?, ?, ?)`
  );

  function runCheckout() {
    let total = 0;
    const resolvedItems = [];

    for (const item of items) {
      const product = getProduct.get(item.productId);
      if (!product) throw new Error(`Produk id ${item.productId} tidak ditemukan`);
      const qty = Number(item.qty) || 0;
      if (qty <= 0) throw new Error(`Jumlah tidak valid untuk ${product.name}`);
      if (product.stock < qty) throw new Error(`Stok ${product.name} tidak cukup (sisa ${product.stock})`);

      const subtotal = product.price * qty;
      total += subtotal;
      resolvedItems.push({ product, qty, subtotal });
    }

    const paidAmount = Number(paid);
    if (!Number.isFinite(paidAmount) || paidAmount < total) {
      throw new Error('Uang bayar kurang dari total belanja');
    }
    const changeAmount = paidAmount - total;

    const invoiceNo = generateInvoiceNo();
    const txInfo = insertTx.run(invoiceNo, req.session.user.id, total, paidAmount, changeAmount);
    const transactionId = txInfo.lastInsertRowid;

    for (const { product, qty, subtotal } of resolvedItems) {
      insertItem.run(transactionId, product.id, product.name, product.price, qty, subtotal);
      updateStock.run(qty, product.id);
    }

    return { transactionId, invoiceNo, total, paid: paidAmount, changeAmount };
  }

  try {
    db.exec('BEGIN');
    let result;
    try {
      result = runCheckout();
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.transactionId);
    const txItems = db
      .prepare('SELECT * FROM transaction_items WHERE transaction_id = ?')
      .all(result.transactionId);
    res.status(201).json({ transaction: tx, items: txItems });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List transactions (with optional date range filter: from, to as YYYY-MM-DD)
router.get('/', requireLogin, (req, res) => {
  const { from, to } = req.query;
  let sql = `
    SELECT t.*, u.name AS cashier_name
    FROM transactions t
    JOIN users u ON u.id = t.user_id
  `;
  const params = [];
  const conditions = [];
  if (from) {
    conditions.push('date(t.created_at) >= date(?)');
    params.push(from);
  }
  if (to) {
    conditions.push('date(t.created_at) <= date(?)');
    params.push(to);
  }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(sql).all(...params);
  res.json({ transactions: rows });
});

// Transaction detail
router.get('/:id', requireLogin, (req, res) => {
  const tx = db
    .prepare(
      `SELECT t.*, u.name AS cashier_name FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.id = ?`
    )
    .get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  const items = db
    .prepare('SELECT * FROM transaction_items WHERE transaction_id = ?')
    .all(req.params.id);
  res.json({ transaction: tx, items });
});

module.exports = router;
