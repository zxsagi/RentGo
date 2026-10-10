/* RentGo — buyer */
/* ============================================================
   BUYER
   ============================================================ */
function renderBuyer(){
  const app = document.getElementById('app');
  const tabs = [
    { id:'browse', label:'Cari Motor', icon:'fa-magnifying-glass' },
    { id:'history', label:'Histori Saya', icon:'fa-clock-rotate-left' }
  ];
  let content = state.buyerTab === 'browse' ? renderBuyerBrowse() : renderBuyerHistory();
  app.innerHTML = renderHeader(state.buyerTab, tabs) + `<main class="main"><div class="container">${content}</div></main>`;
  attachHeaderHandlers(tabs);
  if (state.buyerTab === 'browse') attachBuyerBrowseHandlers();
  attachChatButtons();
}

function renderBuyerBrowse(){
  const myActive = state.rentals.filter(r => r.buyerId === state.currentUser.id && (r.status === 'booked' || r.status === 'active'));
  const available = state.motors.filter(m => m.isOpen);
  let filtered = available;
  if (state.filterStatus === 'available') filtered = filtered.filter(m => !isMotorRented(m.id));
  else if (state.filterStatus === 'rented') filtered = filtered.filter(m => isMotorRented(m.id));
  if (state.searchQuery){
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.location.toLowerCase().includes(q));
  }
  return `
    <div class="page-title">
      <h1>Halo, ${esc(state.currentUser.name.split(' ')[0])} 👋</h1>
      <p>Temukan motor yang tepat untuk kebutuhanmu hari ini.</p>
    </div>
    ${myActive.map(r => renderActiveRentalBanner(r)).join('')}
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab ${state.filterStatus==='all'?'active':''}" data-filter="all">Semua</button>
        <button class="filter-tab ${state.filterStatus==='available'?'active':''}" data-filter="available">Tersedia</button>
        <button class="filter-tab ${state.filterStatus==='rented'?'active':''}" data-filter="rented">Sedang Disewa</button>
      </div>
      <div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="searchInput" placeholder="Cari motor, brand, atau lokasi..." value="${esc(state.searchQuery)}"></div>
    </div>
    ${filtered.length === 0 ? `<div class="empty"><i class="fa-solid fa-motorcycle"></i><h3>Tidak ada motor ditemukan</h3><p>Coba ubah filter atau kata kunci pencarianmu.</p></div>`
    : `<div class="motor-grid">${filtered.map(m => renderMotorCard(m)).join('')}</div>`}
  `;
}

function renderMotorCard(m){
  const seller = state.users.find(u => u.id === m.sellerId);
  const rented = isMotorRented(m.id);
  const stats = getMotorRating(m.id);
  return `
    <div class="motor-card" data-motor="${m.id}">
      <div class="motor-img">
        ${m.photo ? `<img src="${esc(m.photo)}" alt="${esc(m.name)}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'fallback\\'>🛵</div>'">` : `<div class="fallback">🛵</div>`}
        <div class="status-badge ${rented?'rented':'available'}"><span class="dot"></span>${rented?'Sedang Disewa':'Tersedia'}</div>
        ${stats.count > 0 ? `<div class="rating-badge"><i class="fa-solid fa-star"></i> ${stats.avg.toFixed(1)} (${stats.count})</div>` : ''}
      </div>
      <div class="motor-body">
        <div class="motor-brand">${esc(m.brand)} · ${m.year}</div>
        <div class="motor-name">${esc(m.name)}</div>
        <div class="motor-specs">
          <span><i class="fa-solid fa-helmet-safety"></i> ${m.helmIncluded ? m.helmCount+' helm' : 'tanpa helm'}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${esc(m.location)}</span>
        </div>
        <div class="motor-footer">
          <div class="motor-price">${rupiah(m.pricePerHour)}<small>/jam</small></div>
          <div class="seller-tag"><i class="fa-solid fa-store"></i> ${esc(seller ? seller.name : 'Seller')}</div>
        </div>
      </div>
    </div>
  `;
}

function renderActiveRentalBanner(r){
  const motor = state.motors.find(m => m.id === r.motorId);
  if (!motor) return '';
  const seller = state.users.find(u => u.id === r.sellerId);
  if (r.status === 'booked'){
    return `
      <div class="active-rental pending">
        <div class="active-rental-info">
          <h3><i class="fa-solid fa-hourglass-half" style="color:#fcd34d;margin-right:8px"></i>Menunggu Pengambilan — ${esc(motor.name)}</h3>
          <p>Booking: ${formatDate(r.createdAt)} · Durasi: ${r.durationHours} jam · Total: ${rupiah(r.totalPrice)}</p>
          <p style="margin-top:4px">📍 ${esc(motor.location)} — ${esc(motor.locationDetail)}</p>
        </div>
        <div class="active-rental-actions">
          <button class="btn btn-success btn-sm" data-confirm-pickup="${r.id}"><i class="fa-solid fa-check"></i> Konfirmasi Motor Diambil</button>
          <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat Seller</button>
        </div>
      </div>
    `;
  }
  const endTime = new Date(r.startTime).getTime() + r.durationHours*3600*1000;
  const overdue = endTime < Date.now();
  return `
    <div class="active-rental">
      <div class="active-rental-info">
        <h3><i class="fa-solid fa-circle" style="color:${overdue?'#fca5a5':'#4ade80'};font-size:10px;margin-right:8px"></i>${esc(motor.name)} sedang digunakan</h3>
        <p>Mulai: ${formatDate(r.startTime)} · Durasi: ${r.durationHours} jam · Seller: ${esc(seller?.name||'-')}</p>
      </div>
      <div class="timer-display ${overdue?'overdue':''}" data-timer data-start="${r.startTime}" data-duration="${r.durationHours}">
        <div class="label">${overdue?'Terlambat':'Sisa Waktu'}</div>
        <div class="time" data-time>--:--:--</div>
        <div class="status">${overdue?'Segera kembalikan!':'Berjalan...'}</div>
      </div>
      <div class="active-rental-actions">
        <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat</button>
        <button class="btn btn-success btn-sm" data-return="${r.id}"><i class="fa-solid fa-flag-checkered"></i> Selesai & Kembalikan</button>
      </div>
    </div>
  `;
}

function renderBuyerHistory(){
  const my = state.rentals.filter(r => r.buyerId === state.currentUser.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (my.length === 0) return `<div class="page-title"><h1>Histori Rental</h1><p>Riwayat penyewaan motor kamu.</p></div><div class="empty"><i class="fa-solid fa-clock-rotate-left"></i><h3>Belum ada histori rental</h3><p>Mulai sewa motor pertamamu sekarang!</p></div>`;
  return `
    <div class="page-title"><h1>Histori Rental</h1><p>Riwayat penyewaan motor kamu.</p></div>
    <div class="history-list">
      ${my.map(r => {
        const motor = state.motors.find(m => m.id === r.motorId);
        const seller = state.users.find(u => u.id === r.sellerId);
        const endTime = r.startTime ? new Date(r.startTime).getTime() + r.durationHours*3600*1000 : 0;
        const overdue = r.status === 'active' && endTime < Date.now();
        const cls = r.status === 'active' ? (overdue?'overdue':'active') : r.status === 'booked' ? 'pending' : '';
        const icon = r.status === 'booked' ? 'fa-hourglass-half' : r.status === 'active' ? (overdue?'fa-triangle-exclamation':'fa-clock') : 'fa-check';
        const hasReview = state.reviews.some(rv => rv.rentalId === r.id);
        return `
          <div class="history-item ${cls}">
            <div class="history-icon ${cls}"><i class="fa-solid ${icon}"></i></div>
            <div class="history-info">
              <h4>${esc(motor ? motor.name : 'Motor')}</h4>
              <p>${esc(seller ? seller.name : '-')} · ${formatDate(r.createdAt)}</p>
              <p>Durasi: ${r.durationHours} jam · ${esc(r.paymentMethod)}</p>
            </div>
            <div class="history-meta">
              <div class="price">${rupiah(r.totalPrice)}</div>
              <div class="date">${r.status === 'booked'?'Menunggu':r.status==='active'?(overdue?'Terlambat':'Aktif'):'Selesai'}</div>
              ${r.status === 'completed' && !hasReview ? `<button class="btn btn-primary btn-xs mt-2" data-review="${r.id}"><i class="fa-solid fa-star"></i> Beri Rating</button>` : ''}
              ${r.status === 'completed' && hasReview ? `<div class="text-xs text-muted mt-2"><i class="fa-solid fa-check"></i> Sudah diulas</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function isMotorRented(motorId){
  return state.rentals.some(r => r.motorId === motorId && (r.status === 'active' || r.status === 'booked' || r.status === 'pending_payment'));
}
