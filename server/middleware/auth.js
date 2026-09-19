function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Belum login' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya admin yang boleh mengakses ini' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
