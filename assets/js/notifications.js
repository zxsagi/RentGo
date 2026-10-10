/* RentGo — notifications */
/* ============================================================
   NOTIFICATION DROPDOWN
   ============================================================ */
function toggleNotifDropdown(){
  const existing = document.querySelector('.notif-dropdown');
  if (existing){ existing.remove(); return; }
  const notifs = state.notifications.filter(n => n.userId === state.currentUser.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const dd = document.createElement('div');
  dd.className = 'notif-dropdown';
  const icons = { booking:'fa-calendar-check', payment:'fa-money-bill-wave', warning:'fa-triangle-exclamation', danger:'fa-circle-exclamation', review:'fa-star', chat:'fa-comments' };
  dd.innerHTML = `
    <div class="notif-header"><h4>Notifikasi</h4><button id="markAllRead">Tandai semua dibaca</button></div>
    ${notifs.length === 0 ? `<div class="notif-empty"><i class="fa-solid fa-bell-slash"></i>Belum ada notifikasi</div>` :
      notifs.slice(0,20).map(n => `
        <div class="notif-item ${n.read?'':'unread'}" data-notif="${n.id}">
          <div class="notif-icon ${n.type}"><i class="fa-solid ${icons[n.type]||'fa-bell'}"></i></div>
          <div class="notif-content">
            <div class="title">${esc(n.title)}</div>
            <div class="desc">${esc(n.message)}</div>
            <div class="time">${timeAgo(n.createdAt)}</div>
          </div>
        </div>
      `).join('')}
  `;
  document.body.appendChild(dd);
  setTimeout(() => { document.addEventListener('click', closeNotifOnClick); }, 0);
  dd.querySelector('#markAllRead').onclick = (e) => {
    e.stopPropagation();
    state.notifications.filter(n => n.userId === state.currentUser.id).forEach(n => n.read = true);
    saveState(); renderNotifBell(); dd.remove();
  };
  dd.querySelectorAll('[data-notif]').forEach(el => {
    el.onclick = (e) => {
      e.stopPropagation();
      const n = state.notifications.find(x => x.id === el.dataset.notif);
      if (n){ n.read = true; saveState(); renderNotifBell(); }
      dd.remove();
      if (n && n.rentalId && n.type === 'chat'){ openChat(n.rentalId); }
      else if (n && n.rentalId){ render(); }
    };
  });
  dd.onclick = (e) => e.stopPropagation();
}
function closeNotifOnClick(e){
  const dd = document.querySelector('.notif-dropdown');
  const btn = document.getElementById('notifBtn');
  if (dd && !dd.contains(e.target) && e.target !== btn && !btn.contains(e.target)){
    dd.remove();
    document.removeEventListener('click', closeNotifOnClick);
  }
}
