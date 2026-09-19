async function initLayout(activePage) {
  let user = null;
  try {
    const data = await api.get('/api/auth/me');
    user = data.user;
  } catch (e) {
    user = null;
  }

  if (!user) {
    window.location.href = '/index.html';
    return null;
  }

  const nav = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard.html' },
    { key: 'pos', label: 'Kasir (POS)', href: '/pos.html' },
    { key: 'products', label: 'Produk', href: '/products.html' },
    { key: 'reports', label: 'Laporan', href: '/reports.html' },
  ];

  const sidebar = document.getElementById('sidebar-placeholder');
  if (sidebar) {
    sidebar.innerHTML = `
      <div class="sidebar">
        <h2>Toko POS</h2>
        <nav>
          ${nav
            .map(
              (item) =>
                `<a href="${item.href}" class="${item.key === activePage ? 'active' : ''}">${item.label}</a>`
            )
            .join('')}
        </nav>
        <div class="user-box">
          <div class="name">${user.name}</div>
          <div class="role">${user.role}</div>
          <button class="logout" id="logout-btn">Keluar</button>
        </div>
      </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await api.post('/api/auth/logout');
      window.location.href = '/index.html';
    });
  }

  return user;
}
