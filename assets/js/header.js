/* RentGo — header */
/* ============================================================
   HEADER
   ============================================================ */
function renderHeader(activeTab, tabs){
  const u = state.currentUser;
  const unread = unreadCount(u.id);
  return `
    <header class="header">
      <div class="container header-inner">
        <div class="logo" id="logoHome"><i class="fa-solid fa-motorcycle"></i> RentGo</div>
        <nav class="header-nav">
          ${tabs.map(t => `<button class="nav-btn ${activeTab===t.id?'active':''}" data-tab="${t.id}"><i class="fa-solid ${t.icon}" style="margin-right:6px"></i>${t.label}</button>`).join('')}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" id="notifBtn" title="Notifikasi">
            <i class="fa-solid fa-bell"></i>
            ${unread > 0 ? `<span class="badge">${unread>9?'9+':unread}</span>` : ''}
          </button>
          <div class="user-menu" id="userMenu">
            <div class="user-info" style="text-align:right">
              <div class="name">${esc(u.name)}</div>
              <div class="role">${u.role === 'buyer' ? 'Penyewa' : 'Penyedia'}</div>
            </div>
            <div class="user-avatar">${initials(u.name)}</div>
          </div>
          <button class="icon-btn" id="logoutBtn" title="Keluar"><i class="fa-solid fa-right-from-bracket"></i></button>
        </div>
      </div>
    </header>
  `;
}
function renderNotifBell(){
  const btn = document.getElementById('notifBtn');
  if (!btn) return;
  const unread = unreadCount(state.currentUser.id);
  const existing = btn.querySelector('.badge');
  if (existing) existing.remove();
  if (unread > 0){
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = unread > 9 ? '9+' : unread;
    btn.appendChild(b);
  }
}
