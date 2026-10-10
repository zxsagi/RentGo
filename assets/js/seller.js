/* RentGo — seller */
/* ============================================================
   SELLER
   ============================================================ */
function renderSeller(){
  const app = document.getElementById('app');
  const tabs = [
    { id:'dashboard', label:'Dashboard', icon:'fa-chart-line' },
    { id:'motors', label:'Motor Saya', icon:'fa-motorcycle' },
    { id:'rentals', label:'Rental Aktif', icon:'fa-clock' },
    { id:'messages', label:'Pesan', icon:'fa-comments' },
    { id:'wallet', label:'Dompet', icon:'fa-wallet' },
    { id:'history', label:'Histori', icon:'fa-clock-rotate-left' }
  ];
  let content = '';
  if (state.sellerTab === 'dashboard') content = renderSellerDashboard();
  else if (state.sellerTab === 'motors') content = renderSellerMotors();
  else if (state.sellerTab === 'rentals') content = renderSellerRentals();
  else if (state.sellerTab === 'messages') content = renderSellerMessages();
  else if (state.sellerTab === 'wallet') content = renderSellerWallet();
  else content = renderSellerHistory();
  app.innerHTML = renderHeader(state.sellerTab, tabs) + `<main class="main"><div class="container">${content}</div></main>`;
  attachHeaderHandlers(tabs);
  attachSellerHandlers();
  attachChatButtons();
}

function renderSellerDashboard(){
  const myMotors = state.motors.filter(m => m.sellerId === state.currentUser.id);
  const myRentals = state.rentals.filter(r => r.sellerId === state.currentUser.id);
  const active = myRentals.filter(r => r.status === 'active');
  const booked = myRentals.filter(r => r.status === 'booked');
  const completed = myRentals.filter(r => r.status === 'completed');
  const revenue = completed.reduce((s,r) => s + (r.sellerPayout || 0), 0);
  const availableCount = myMotors.filter(m => !isMotorRented(m.id)).length;

  return `
    <div class="page-title"><h1>Dashboard Penyedia</h1><p>Ringkasan performa rental motor kamu.</p></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-motorcycle"></i></div><div class="stat-info"><div class="val">${myMotors.length}</div><div class="label">Total Motor</div></div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div><div class="stat-info"><div class="val">${availableCount}</div><div class="label">Tersedia</div></div></div>
      <div class="stat-card"><div class="stat-icon amber"><i class="fa-solid fa-clock"></i></div><div class="stat-info"><div class="val">${active.length + booked.length}</div><div class="label">Aktif + Booking</div></div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-money-bill-wave"></i></div><div class="stat-info"><div class="val">${rupiah(revenue)}</div><div class="label">Pendapatan Bersih</div></div></div>
    </div>
    ${booked.length > 0 ? `
      <h3 style="margin-bottom:14px;font-size:16px">🟡 Booking Menunggu Pengambilan</h3>
      ${booked.map(r => {
        const motor = state.motors.find(m => m.id === r.motorId);
        const buyer = state.users.find(u => u.id === r.buyerId);
        return `
          <div class="active-rental pending" style="margin-bottom:14px">
            <div class="active-rental-info">
              <h3>${esc(motor?.name||'Motor')} — ${esc(buyer?.name||'Buyer')}</h3>
              <p>📞 ${esc(buyer?.phone||'-')} · Booking: ${formatDate(r.createdAt)} · ${r.durationHours} jam</p>
              <p style="margin-top:4px">💰 Dana ditahan: ${rupiah(r.totalPrice)} (escrow)</p>
            </div>
            <div class="active-rental-actions">
              <button class="btn btn-success btn-sm" data-confirm-pickup="${r.id}"><i class="fa-solid fa-check"></i> Konfirmasi Diambil</button>
              <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat</button>
            </div>
          </div>
        `;
      }).join('')}
    ` : ''}
    ${active.length > 0 ? `
      <h3 style="margin-bottom:14px;font-size:16px;margin-top:20px">🟢 Rental Sedang Berjalan</h3>
      ${active.map(r => {
        const motor = state.motors.find(m => m.id === r.motorId);
        const buyer = state.users.find(u => u.id === r.buyerId);
        const endTime = new Date(r.startTime).getTime() + r.durationHours*3600*1000;
        const overdue = endTime < Date.now();
        return `
          <div class="active-rental" style="margin-bottom:14px">
            <div class="active-rental-info">
              <h3>${esc(motor?.name||'Motor')} — ${esc(buyer?.name||'Buyer')}</h3>
              <p>📞 ${esc(buyer?.phone||'-')} · Mulai: ${formatDate(r.startTime)} · ${r.durationHours} jam</p>
            </div>
            <div class="timer-display ${overdue?'overdue':''}" data-timer data-start="${r.startTime}" data-duration="${r.durationHours}">
              <div class="label">${overdue?'Terlambat':'Sisa Waktu'}</div>
              <div class="time" data-time>--:--:--</div>
            </div>
            <div class="active-rental-actions">
              <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat</button>
              <button class="btn btn-success btn-sm" data-confirm-return="${r.id}"><i class="fa-solid fa-flag-checkered"></i> Konfirmasi Selesai</button>
            </div>
          </div>
        `;
      }).join('')}
    ` : ''}
  `;
}

function renderSellerMessages(){
  const sellerId = state.currentUser.id;
  const relatedRentals = state.rentals.filter(r => r.sellerId === sellerId && state.chats.some(c => c.rentalId === r.id));
  relatedRentals.sort((a,b) => {
    const lastA = Math.max(...state.chats.filter(c => c.rentalId === a.id).map(c => new Date(c.createdAt).getTime()));
    const lastB = Math.max(...state.chats.filter(c => c.rentalId === b.id).map(c => new Date(c.createdAt).getTime()));
    return lastB-lastA;
  });
  return `<div class="page-title"><h1>Pesan Masuk</h1><p>Percakapan dengan penyewa yang terkait dengan booking.</p></div>
    ${relatedRentals.length ? relatedRentals.map(r => {
      const buyer = state.users.find(u => u.id === r.buyerId);
      const motor = state.motors.find(m => m.id === r.motorId);
      const msgs = state.chats.filter(c => c.rentalId === r.id).sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));
      const last = msgs[msgs.length-1];
      const unread = msgs.filter(c => c.receiverId === sellerId && !c.read).length;
      return `<div class="active-rental" style="margin-bottom:12px"><div class="active-rental-info"><h3>${esc(buyer?.name || 'Penyewa')} · ${esc(motor?.name || 'Motor')}</h3><p>${esc(last?.text || 'Belum ada pesan')} · ${timeAgo(last?.createdAt || r.createdAt)}</p>${unread ? `<p><strong>${unread} pesan belum dibaca</strong></p>` : ''}</div><div class="active-rental-actions"><button class="btn btn-primary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Buka Chat</button></div></div>`;
    }).join('') : `<div class="empty"><i class="fa-solid fa-comments"></i><h3>Belum ada percakapan</h3><p>Pesan akan muncul di sini ketika penyewa mengirim chat pada booking motor milikmu.</p></div>`}`;
}

function renderSellerMotors(){
  const myMotors = state.motors.filter(m => m.sellerId === state.currentUser.id);
  return `
    <div class="page-title flex justify-between items-center">
      <div><h1>Motor Saya</h1><p>Kelola motor yang kamu sewakan.</p></div>
      <button class="btn btn-primary" id="addMotorBtn"><i class="fa-solid fa-plus"></i> Tambah Motor</button>
    </div>
    ${myMotors.length === 0 ? `<div class="empty"><i class="fa-solid fa-motorcycle"></i><h3>Belum ada motor</h3><p>Tambahkan motor pertamamu untuk mulai menyewakan.</p></div>`
    : myMotors.map(m => {
      const stats = getMotorRating(m.id);
      return `
        <div class="seller-motor">
          <div class="seller-motor-img">
            ${m.photo ? `<img src="${esc(m.photo)}" onerror="this.style.display='none';this.parentElement.innerHTML='🛵'">` : '🛵'}
          </div>
          <div class="seller-motor-info">
            <h4>${esc(m.brand)} ${esc(m.name)} (${m.year})</h4>
            <div class="price">${rupiah(m.pricePerHour)}/jam · ${rupiah(m.pricePerDay)}/hari</div>
            <div class="loc"><i class="fa-solid fa-location-dot"></i> ${esc(m.location)} ${stats.count>0?`· ⭐ ${stats.avg.toFixed(1)} (${stats.count})`:''}</div>
          </div>
          <div class="seller-motor-actions">
            <div class="status-toggle ${m.isOpen?'on':'off'}"><i class="fa-solid ${m.isOpen?'fa-circle-check':'fa-circle-xmark'}"></i>${m.isOpen?'Buka':'Tutup'}</div>
            <label class="toggle"><input type="checkbox" ${m.isOpen?'checked':''} data-toggle-motor="${m.id}"><span class="toggle-slider"></span></label>
            <button class="btn btn-secondary btn-sm" data-edit-motor="${m.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" data-delete-motor="${m.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderSellerRentals(){
  const my = state.rentals.filter(r => r.sellerId === state.currentUser.id && (r.status === 'active' || r.status === 'booked'));
  if (my.length === 0) return `<div class="page-title"><h1>Rental Aktif</h1><p>Motor yang sedang disewa pelanggan.</p></div><div class="empty"><i class="fa-solid fa-clock"></i><h3>Tidak ada rental aktif</h3><p>Semua motor kamu sedang tersedia.</p></div>`;
  return `
    <div class="page-title"><h1>Rental Aktif</h1><p>Motor yang sedang disewa pelanggan.</p></div>
    ${my.map(r => {
      const motor = state.motors.find(m => m.id === r.motorId);
      const buyer = state.users.find(u => u.id === r.buyerId);
      if (r.status === 'booked'){
        return `
          <div class="active-rental pending" style="margin-bottom:14px">
            <div class="active-rental-info">
              <h3>${esc(motor?.name||'Motor')} — ${esc(buyer?.name||'Buyer')}</h3>
              <p>📞 ${esc(buyer?.phone||'-')} · Booking: ${formatDate(r.createdAt)}</p>
              <p style="margin-top:4px">💰 Escrow: ${rupiah(r.totalPrice)}</p>
            </div>
            <div class="active-rental-actions">
              <button class="btn btn-success btn-sm" data-confirm-pickup="${r.id}"><i class="fa-solid fa-check"></i> Konfirmasi Diambil</button>
              <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat</button>
            </div>
          </div>
        `;
      }
      const endTime = new Date(r.startTime).getTime() + r.durationHours*3600*1000;
      const overdue = endTime < Date.now();
      return `
        <div class="active-rental" style="margin-bottom:14px">
          <div class="active-rental-info">
            <h3>${esc(motor?.name||'Motor')} — ${esc(buyer?.name||'Buyer')}</h3>
            <p>📞 ${esc(buyer?.phone||'-')} · Mulai: ${formatDate(r.startTime)} · ${r.durationHours} jam</p>
          </div>
          <div class="timer-display ${overdue?'overdue':''}" data-timer data-start="${r.startTime}" data-duration="${r.durationHours}">
            <div class="label">${overdue?'Terlambat':'Sisa Waktu'}</div>
            <div class="time" data-time>--:--:--</div>
          </div>
          <div class="active-rental-actions">
            <button class="btn btn-secondary btn-sm" data-open-chat="${r.id}"><i class="fa-solid fa-comments"></i> Chat</button>
            <button class="btn btn-success btn-sm" data-confirm-return="${r.id}"><i class="fa-solid fa-flag-checkered"></i> Selesai</button>
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function renderSellerWallet(){
  const u = state.users.find(x => x.id === state.currentUser.id);
  const myRentals = state.rentals.filter(r => r.sellerId === u.id);
  const completed = myRentals.filter(r => r.status === 'completed');
  const held = myRentals.filter(r => r.status === 'active' || r.status === 'booked').reduce((s,r) => s + r.totalPrice, 0);
  return `
    <div class="page-title"><h1>Dompet Saya</h1><p>Kelola pendapatan dari rental motor.</p></div>
    <div class="balance-card">
      <div style="position:relative;z-index:1">
        <div style="font-size:13px;opacity:.7;text-transform:uppercase;letter-spacing:1px">Saldo Tersedia</div>
        <div style="font-size:36px;font-weight:800;margin-top:4px">${rupiah(u.balance || 0)}</div>
        <button class="btn btn-primary mt-4" id="withdrawBtn"><i class="fa-solid fa-money-bill-transfer"></i> Tarik Saldo</button>
      </div>
      <div class="balance-grid">
        <div class="balance-item pending"><div class="label">Dana Ditahan (Escrow)</div><div class="val">${rupiah(held)}</div></div>
        <div class="balance-item available"><div class="label">Total Pendapatan</div><div class="val">${rupiah(u.balance || 0)}</div></div>
        <div class="balance-item"><div class="label">Transaksi Selesai</div><div class="val">${completed.length}</div></div>
      </div>
    </div>
    <div class="section-title">Riwayat Pendapatan</div>
    ${completed.length === 0 ? `<div class="empty"><i class="fa-solid fa-wallet"></i><h3>Belum ada pendapatan</h3><p>Pendapatan akan muncul setelah rental selesai.</p></div>` :
      `<div class="history-list">${completed.sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt)).map(r => {
        const motor = state.motors.find(m => m.id === r.motorId);
        const buyer = state.users.find(u => u.id === r.buyerId);
        return `
          <div class="history-item active">
            <div class="history-icon active"><i class="fa-solid fa-money-bill-wave"></i></div>
            <div class="history-info">
              <h4>${esc(motor?.name||'Motor')}</h4>
              <p>${esc(buyer?.name||'-')} · ${formatDate(r.completedAt||r.createdAt)}</p>
              <p>Bruto: ${rupiah(r.totalPrice)} · Komisi: ${rupiah(r.commission||0)}</p>
            </div>
            <div class="history-meta">
              <div class="price" style="color:var(--success)">+${rupiah(r.sellerPayout||0)}</div>
              <div class="date">Masuk Saldo</div>
            </div>
          </div>
        `;
      }).join('')}</div>`
    }
  `;
}

function renderSellerHistory(){
  const completed = state.rentals.filter(r => r.sellerId === state.currentUser.id && r.status === 'completed').sort((a,b) => new Date(b.completedAt||b.createdAt) - new Date(a.completedAt||a.createdAt));
  if (completed.length === 0) return `<div class="page-title"><h1>Histori Rental</h1><p>Riwayat rental yang sudah selesai.</p></div><div class="empty"><i class="fa-solid fa-clock-rotate-left"></i><h3>Belum ada histori</h3><p>Histori akan muncul setelah ada rental yang selesai.</p></div>`;
  return `
    <div class="page-title"><h1>Histori Rental</h1><p>Riwayat rental yang sudah selesai.</p></div>
    <div class="history-list">
      ${completed.map(r => {
        const motor = state.motors.find(m => m.id === r.motorId);
        const buyer = state.users.find(u => u.id === r.buyerId);
        const review = state.reviews.find(rv => rv.rentalId === r.id);
        return `
          <div class="history-item">
            <div class="history-icon"><i class="fa-solid fa-check"></i></div>
            <div class="history-info">
              <h4>${esc(motor?.name||'Motor')}</h4>
              <p>${esc(buyer?.name||'-')} · ${formatDate(r.completedAt||r.createdAt)}</p>
              <p>Durasi: ${r.durationHours} jam · ${esc(r.paymentMethod)}</p>
              ${review ? `<p style="color:#f59e0b;margin-top:4px">⭐ ${review.rating}/5 — "${esc(review.comment.slice(0,60))}${review.comment.length>60?'...':''}"</p>` : ''}
            </div>
            <div class="history-meta">
              <div class="price">${rupiah(r.totalPrice)}</div>
              <div class="date">Selesai</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
