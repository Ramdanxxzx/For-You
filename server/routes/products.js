const express = require('express');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  const q = (req.query.q || '').trim();
  let rows;
  if (q) {
    rows = db
      .prepare(
        `SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY name ASC`
      )
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
  }
  res.json({ products: rows });
});

router.post('/', requireAdmin, (req, res) => {
  const { sku, name, category, cost, price, stock } = req.body || {};
  if (!sku || !name || price == null) {
    return res.status(400).json({ error: 'SKU, nama, dan harga jual wajib diisi' });
  }
  try {
    const info = db
      .prepare(
        `INSERT INTO products (sku, name, category, cost, price, stock) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(sku, name, category || '', Number(cost) || 0, Number(price), Number(stock) || 0);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ product });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU sudah digunakan produk lain' });
    }
    res.status(500).json({ error: 'Gagal menyimpan produk' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const { sku, name, category, cost, price, stock } = req.body || {};
  try {
    db.prepare(
      `UPDATE products SET sku = ?, name = ?, category = ?, cost = ?, price = ?, stock = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      sku ?? existing.sku,
      name ?? existing.name,
      category ?? existing.category,
      cost != null ? Number(cost) : existing.cost,
      price != null ? Number(price) : existing.price,
      stock != null ? Number(stock) : existing.stock,
      req.params.id
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ product });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU sudah digunakan produk lain' });
    }
    res.status(500).json({ error: 'Gagal memperbarui produk' });
  }
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
