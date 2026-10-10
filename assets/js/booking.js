/* RentGo — booking */
/* ============================================================
   MOTOR DETAIL & BOOKING (BUYER)
   ============================================================ */
function openMotorDetail(motorId){
  const m = state.motors.find(x => x.id === motorId);
  if (!m) return;
  const seller = state.users.find(u => u.id === m.sellerId);
  const rented = isMotorRented(m.id);
  const stats = getMotorRating(m.id);
  const reviews = state.reviews.filter(rv => rv.motorId === m.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  let selectedDuration = 1, selectedPayment = 'Transfer BCA';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-header"><h3>Detail Motor</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body">
        <div class="detail-hero">
          ${m.photo ? `<img src="${esc(m.photo)}" onerror="this.style.display='none'">` : '🛵'}
          <div class="status-badge ${rented?'rented':'available'}" style="top:12px;left:12px"><span class="dot"></span>${rented?'Sedang Disewa':'Tersedia'}</div>
        </div>
        <div class="motor-brand">${esc(m.brand)} · ${m.year}</div>
        <h2 style="font-size:22px;margin:4px 0 8px">${esc(m.name)}</h2>
        ${stats.count > 0 ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;color:#b45309;font-size:13px;font-weight:600"><i class="fa-solid fa-star"></i> ${stats.avg.toFixed(1)} · ${stats.count} ulasan</div>` : ''}
        <div class="detail-grid">
          <div class="detail-item"><div class="label">Harga per Jam</div><div class="val" style="color:var(--primary)">${rupiah(m.pricePerHour)}</div></div>
          <div class="detail-item"><div class="label">Harga per Hari</div><div class="val" style="color:var(--primary)">${rupiah(m.pricePerDay)}</div></div>
          <div class="detail-item"><div class="label">Helm</div><div class="val">${m.helmIncluded ? `${m.helmCount} helm SNI` : 'Tidak termasuk'}</div></div>
          <div class="detail-item"><div class="label">Penyedia</div><div class="val">${esc(seller ? seller.name : '-')}</div></div>
        </div>
        <div class="section-title">Deskripsi</div>
        <p class="detail-desc">${esc(m.description)}</p>
        <div class="section-title">Lokasi Penjemputan</div>
        <div class="pickup-card">
          <div class="loc"><i class="fa-solid fa-location-dot"></i><div><div class="loc-name">${esc(m.location)}</div><div class="loc-detail">${esc(m.locationDetail)}</div></div></div>
          <a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location+' UNAI')}" target="_blank"><i class="fa-solid fa-map-location-dot"></i> Buka di Google Maps</a>
        </div>
        ${!rented ? `
          <div class="section-title">Pilih Durasi</div>
          <div class="duration-picker" id="durationPicker">
            ${[1,2,3,5,8,24].map(h => `<button class="duration-opt ${h===1?'active':''}" data-hours="${h}">${h} jam</button>`).join('')}
          </div>
          <div class="section-title">Metode Pembayaran</div>
          <div class="payment-list" id="paymentList">
            <div class="payment-opt active" data-pay="Transfer bank (demo)"><i class="fa-solid fa-building-columns"></i><div class="info"><div class="name">Transfer bank (demo)</div><div class="desc">Belum terhubung ke bank/payment gateway. Jangan transfer uang melalui aplikasi ini.</div></div></div>
            <div class="payment-opt" data-pay="QRIS (demo)"><i class="fa-solid fa-qrcode"></i><div class="info"><div class="name">QRIS (demo)</div><div class="desc">QRIS belum tersedia. Pembayaran hanya simulasi untuk pengujian aplikasi.</div></div></div>
          </div>
          <div class="price-summary">
            <div class="price-row"><span>Harga per jam</span><span id="sumPrice">${rupiah(m.pricePerHour)}</span></div>
            <div class="price-row"><span>Durasi</span><span id="sumDuration">1 jam</span></div>
            <div class="price-row total"><span>Total Dibayar</span><span id="sumTotal">${rupiah(m.pricePerHour)}</span></div>
          </div>
        ` : `<div class="empty" style="padding:30px 20px;background:var(--danger-light);color:var(--danger)"><i class="fa-solid fa-clock"></i><h3 style="color:var(--danger)">Motor sedang disewa</h3><p style="color:var(--danger)">Silakan pilih motor lain atau cek kembali nanti.</p></div>`}
        ${reviews.length > 0 ? `
          <div class="section-title mt-4">Ulasan Penyewa</div>
          <div class="review-summary">
            <div class="review-score"><div class="num">${stats.avg.toFixed(1)}</div><div class="count">${stats.count} ulasan</div></div>
            <div class="review-bar">
              ${[5,4,3,2,1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const pct = reviews.length ? (count/reviews.length*100) : 0;
                return `<div class="row"><span>${star}</span><div class="bar"><div style="width:${pct}%"></div></div><span>${count}</span></div>`;
              }).join('')}
            </div>
          </div>
          <div class="review-list">
            ${reviews.slice(0,5).map(rv => {
              const buyer = state.users.find(u => u.id === rv.buyerId);
              return `
                <div class="review-item">
                  <div class="head">
                    <div class="review-avatar">${initials(buyer?.name||'?')}</div>
                    <div><div class="name">${esc(buyer?.name||'Penyewa')}</div><div class="date">${timeAgo(rv.createdAt)}</div></div>
                  </div>
                  <div class="stars-mini">${'★'.repeat(rv.rating)}${'☆'.repeat(5-rv.rating)}</div>
                  <div class="comment">${esc(rv.comment)}</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
      ${!rented ? `<div class="modal-footer"><button class="btn btn-secondary modal-close-btn">Batal</button><button class="btn btn-primary" id="bookBtn"><i class="fa-solid fa-check"></i> Booking Sekarang</button></div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);

  const updateSummary = () => {
    const total = selectedDuration * m.pricePerHour;
    document.getElementById('sumPrice').textContent = rupiah(m.pricePerHour);
    document.getElementById('sumDuration').textContent = selectedDuration + ' jam';
    document.getElementById('sumTotal').textContent = rupiah(total);
  };
  overlay.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => b.onclick = () => overlay.remove());
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelectorAll('.duration-opt').forEach(opt => {
    opt.onclick = () => {
      overlay.querySelectorAll('.duration-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active'); selectedDuration = parseInt(opt.dataset.hours); updateSummary();
    };
  });
  overlay.querySelectorAll('.payment-opt').forEach(opt => {
    opt.onclick = () => {
      overlay.querySelectorAll('.payment-opt').forEach(o => o.classList.remove('active'));
      opt.classList.add('active'); selectedPayment = opt.dataset.pay;
    };
  });
  const bookBtn = document.getElementById('bookBtn');
  if (bookBtn){
    bookBtn.onclick = () => {
      const total = selectedDuration * m.pricePerHour;
      // Buat pesanan sebagai menunggu pembayaran. Belum dianggap lunas.
      const rental = {
        id: uid('r'), motorId: m.id, buyerId: state.currentUser.id, sellerId: m.sellerId,
        startTime: null, durationHours: selectedDuration, paymentMethod: selectedPayment,
        totalPrice: total, status: 'pending_payment', createdAt: new Date().toISOString(),
        paymentStatus: 'pending'
      };
      state.rentals.push(rental);
      saveState();
      overlay.remove();
      openDemoPayment(rental.id);

    };
  }
}


/* Checkout demo: konfirmasi di sini hanya simulasi, bukan transaksi uang sungguhan. */
function openDemoPayment(rentalId){
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental || rental.paymentStatus !== 'pending') return;
  const motor = state.motors.find(m => m.id === rental.motorId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3><i class="fa-solid fa-shield-halved"></i> Pembayaran Booking</h3></div>
      <div class="modal-body">
        <div class="empty" style="padding:12px 0"><i class="fa-solid fa-receipt"></i><h3>${esc(motor?.name || 'Rental Motor')}</h3><p>Durasi ${rental.durationHours} jam · ${esc(rental.paymentMethod)}</p></div>
        <div class="price-summary"><div class="price-row total"><span>Total yang harus dibayar</span><span>${rupiah(rental.totalPrice)}</span></div></div>
        <div class="pickup-card" style="margin-top:16px"><strong>Instruksi pembayaran demo</strong><p style="margin-top:8px">Metode: ${esc(rental.paymentMethod)}. Pada aplikasi nyata, tahap ini harus terhubung ke payment gateway untuk membuat tagihan dan memverifikasi pembayaran secara otomatis.</p></div>
        <p style="font-size:12px;color:var(--muted);margin-top:12px">Mode demo: tombol konfirmasi hanya mensimulasikan status pembayaran dan tidak memindahkan uang.</p>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" id="cancelDemoPayment">Batalkan pesanan</button><button class="btn btn-primary" id="confirmDemoPayment">Konfirmasi Pembayaran (Demo)</button></div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('cancelDemoPayment').onclick = () => {
    state.rentals = state.rentals.filter(r => r.id !== rentalId);
    saveState(); overlay.remove(); render(); toast('Pesanan dibatalkan.', 'info');
  };
  document.getElementById('confirmDemoPayment').onclick = () => {
    rental.paymentStatus = 'paid_demo';
    rental.status = 'booked';
    rental.paidAt = new Date().toISOString();
    saveState();
    const buyer = state.users.find(u => u.id === rental.buyerId);
    pushNotif(rental.sellerId, 'booking', 'Booking Baru — Dibayar (Demo)', `${buyer?.name || 'Penyewa'} memesan ${motor?.name || 'motor'} selama ${rental.durationHours} jam. Status pembayaran: simulasi demo.`, rental.id);
    pushNotif(rental.buyerId, 'payment', 'Pembayaran Tercatat (Demo)', `Pembayaran ${rupiah(rental.totalPrice)} disimulasikan berhasil. Ini bukan transaksi uang sungguhan.`, rental.id);
    overlay.remove(); toast('Pembayaran demo tercatat. Booking menunggu pengambilan.', 'success'); render();
  };
  overlay.onclick = e => { if (e.target === overlay) toast('Selesaikan atau batalkan pembayaran terlebih dahulu.', 'warning'); };
}
