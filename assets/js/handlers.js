/* RentGo — handlers */
/* ============================================================
   HANDLERS
   ============================================================ */
function attachHeaderHandlers(tabs){
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      if (state.currentUser.role === 'buyer') state.buyerTab = btn.dataset.tab;
      else state.sellerTab = btn.dataset.tab;
      render();
    };
  });
  const logo = document.getElementById('logoHome');
  if (logo) logo.onclick = () => {
    if (state.currentUser.role === 'buyer') state.buyerTab = 'browse';
    else state.sellerTab = 'dashboard';
    render();
  };
  document.getElementById('logoutBtn').onclick = () => {
    state.currentUser = null;
    state.buyerTab = 'browse'; state.sellerTab = 'dashboard';
    state.filterStatus = 'all'; state.searchQuery = '';
    saveState(); render(); toast('Kamu telah keluar', 'info');
  };
  document.getElementById('notifBtn').onclick = (e) => {
    e.stopPropagation();
    toggleNotifDropdown();
  };
  document.getElementById('userMenu').onclick = () => { if (typeof openProfileEditor === 'function') openProfileEditor(); };
  startTimers();
  attachActionButtons();
  attachChatButtons();
}

function attachBuyerBrowseHandlers(){
  document.querySelectorAll('.filter-tab').forEach(t => { t.onclick = () => { state.filterStatus = t.dataset.filter; render(); }; });
  const search = document.getElementById('searchInput');
  if (search){
    search.oninput = (e) => {
      state.searchQuery = e.target.value;
      clearTimeout(window._searchTimer);
      window._searchTimer = setTimeout(() => render(), 250);
    };
  }
  document.querySelectorAll('.motor-card').forEach(card => {
    card.onclick = () => openMotorDetail(card.dataset.motor);
  });
}

function attachSellerHandlers(){
  document.querySelectorAll('[data-toggle-motor]').forEach(el => {
    el.onchange = () => {
      const motor = state.motors.find(m => m.id === el.dataset.toggleMotor);
      if (motor){ motor.isOpen = el.checked; saveState(); if (window.rentGoCloudEnabled) window.saveMotorToCloud(motor).catch(() => {}); toast(`Motor ${motor.name} ${motor.isOpen?'dibuka':'ditutup'}`, motor.isOpen?'success':'info'); render(); }
    };
  });
  document.querySelectorAll('[data-delete-motor]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.deleteMotor;
      if (isMotorRented(id)){ toast('Tidak bisa hapus motor yang sedang disewa', 'error'); return; }
      if (!confirm('Yakin hapus motor ini?')) return;
      state.motors = state.motors.filter(m => m.id !== id); saveState(); if (window.rentGoCloudEnabled) window.deleteMotorFromCloud(id).catch(() => {}); toast('Motor dihapus', 'success'); render();
    };
  });
  document.querySelectorAll('[data-edit-motor]').forEach(btn => { btn.onclick = () => openMotorForm(btn.dataset.editMotor); });
  const addBtn = document.getElementById('addMotorBtn');
  if (addBtn) addBtn.onclick = () => openMotorForm(null);
  const withdraw = document.getElementById('withdrawBtn');
  if (withdraw) withdraw.onclick = () => {
    const u = state.users.find(x => x.id === state.currentUser.id);
    if (!u.balance || u.balance <= 0){ toast('Saldo tidak mencukupi', 'error'); return; }
    const amount = u.balance;
    if (!confirm(`Tarik saldo ${rupiah(amount)}?`)) return;
    u.balance = 0; saveState();
    toast(`Penarikan ${rupiah(amount)} berhasil diproses`, 'success');
    render();
  };
}

function attachActionButtons(){
  document.querySelectorAll('[data-confirm-pickup]').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); confirmPickup(btn.dataset.confirmPickup); }; });
  document.querySelectorAll('[data-return]').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); confirmReturn(btn.dataset.return); }; });
  document.querySelectorAll('[data-confirm-return]').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); confirmReturn(btn.dataset.confirmReturn); }; });
  document.querySelectorAll('[data-review]').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); openReviewModal(btn.dataset.review); }; });
}

function attachChatButtons(){
  document.querySelectorAll('[data-open-chat]').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openChat(btn.dataset.openChat); };
  });
}
