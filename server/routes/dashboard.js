const express = require('express');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireLogin, (req, res) => {
  const today = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
       FROM transactions WHERE date(created_at) = date('now', 'localtime')`
    )
    .get();

  const month = db
    .prepare(
      `SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
       FROM transactions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')`
    )
    .get();

  const lowStock = db
    .prepare(`SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10`)
    .all();

  const topProducts = db
    .prepare(
      `SELECT ti.name, SUM(ti.qty) AS total_qty, SUM(ti.subtotal) AS total_revenue
       FROM transaction_items ti
       JOIN transactions t ON t.id = ti.transaction_id
       WHERE date(t.created_at) >= date('now', 'localtime', '-6 days')
       GROUP BY ti.name
       ORDER BY total_qty DESC
       LIMIT 5`
    )
    .all();

  res.json({ today, month, lowStock, topProducts });
});

module.exports = router;
