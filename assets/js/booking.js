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
  let selectedDuration = 1, selectedPayment = 'Midtrans';

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
            <div class="payment-opt active" data-pay="Midtrans"><i class="fa-solid fa-shield-halved"></i><div class="info"><div class="name">Bayar Online — Midtrans</div><div class="desc">Kartu, transfer bank, QRIS, dan metode yang tersedia di checkout Midtrans. Pembayaran tampil di website RentGo.</div></div></div>
            <div class="payment-opt" data-pay="Cash"><i class="fa-solid fa-money-bill-wave"></i><div class="info"><div class="name">Bayar Tunai (Cash)</div><div class="desc">Bayar langsung kepada penyedia saat mengambil motor. Status pembayaran tetap belum lunas sampai dikonfirmasi.</div></div></div>
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
      <div class="modal-footer"><button class="btn btn-secondary" id="chatSellerFromDetail"><i class="fa-solid fa-comments"></i> Chat Penyedia</button>${!rented ? `<button class="btn btn-secondary modal-close-btn">Batal</button><button class="btn btn-primary" id="bookBtn"><i class="fa-solid fa-check"></i> Booking Sekarang</button>` : `<button class="btn btn-secondary modal-close-btn">Tutup</button>`}</div>
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
  const chatSellerBtn = overlay.querySelector('#chatSellerFromDetail');
  if (chatSellerBtn) chatSellerBtn.onclick = () => openMotorChat(m.id);
  const bookBtn = overlay.querySelector('#bookBtn');
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
      if (selectedPayment === 'Cash') {
        rental.status = 'booked';
        rental.paymentStatus = 'cash_due';
        rental.cashPaymentDue = true;
      }
      state.rentals.push(rental);
      saveState();
      if (typeof saveRentalToCloud === 'function') saveRentalToCloud(rental);
      overlay.remove();
      if (selectedPayment === 'Cash') {
        const motorName = m.name || 'motor';
        pushNotif(rental.sellerId, 'booking', 'Booking Tunai Baru', `${state.currentUser.name} memesan ${motorName} dengan pembayaran tunai. Konfirmasi saat motor diambil.`, rental.id);
        pushNotif(rental.buyerId, 'booking', 'Booking Berhasil', `Pesanan ${motorName} dibuat. Siapkan pembayaran tunai ${rupiah(total)} saat mengambil motor.`, rental.id);
        toast('Booking tunai berhasil dibuat. Pembayaran dilakukan saat mengambil motor.', 'success');
        render();
      } else {
        openDemoPayment(rental.id);
      }

    };
  }
}


/* Memuat Snap JS di halaman RentGo agar checkout tidak berpindah ke tab lain. */
function loadMidtransSnap(src, clientKey){
  return new Promise((resolve,reject)=>{
    if(window.snap && typeof window.snap.pay === 'function'){ resolve(); return; }
    const existing=document.querySelector('script[data-rentgo-midtrans-snap]');
    if(existing){ existing.addEventListener('load',()=>resolve(),{once:true}); existing.addEventListener('error',()=>reject(new Error('Gagal memuat checkout Midtrans.')),{once:true}); return; }
    const script=document.createElement('script'); script.src=src; script.dataset.rentgoMidtransSnap='true'; script.setAttribute('data-client-key',clientKey);
    script.onload=()=>window.snap && typeof window.snap.pay==='function' ? resolve() : reject(new Error('Snap Midtrans tidak tersedia.'));
    script.onerror=()=>reject(new Error('Gagal memuat checkout Midtrans. Periksa koneksi internet.'));
    document.head.appendChild(script);
  });
}

/* Checkout Midtrans: pembayaran hanya dianggap sukses setelah webhook server memverifikasi status. */
function openDemoPayment(rentalId){
  const rental = state.rentals.find(r => r.id === rentalId);
  if (!rental || rental.paymentStatus !== 'pending') return;
  const motor = state.motors.find(m => m.id === rental.motorId);
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal"><div class="modal-header"><h3><i class="fa-solid fa-shield-halved"></i> Pembayaran Booking</h3><button class="modal-close" aria-label="Tutup"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body"><div class="empty" style="padding:12px 0"><i class="fa-solid fa-receipt"></i><h3>${esc(motor?.name || 'Rental Motor')}</h3><p>Durasi ${rental.durationHours} jam</p></div>
        <div class="price-summary"><div class="price-row total"><span>Total pembayaran</span><span>${rupiah(rental.totalPrice)}</span></div></div>
        <div class="pickup-card" style="margin-top:16px"><strong>Pembayaran aman melalui Midtrans</strong><p style="margin-top:8px">Jendela pembayaran akan terbuka di halaman RentGo. Status booking berubah setelah server memverifikasi notifikasi pembayaran.</p></div>
        <p id="rgMidtransMessage" role="status" style="font-size:13px;margin-top:12px;color:var(--muted)">Pastikan Edge Functions dan secret Midtrans sudah dikonfigurasi.</p>
      </div><div class="modal-footer"><button class="btn btn-secondary" id="cancelMidtransPayment">Batalkan pesanan</button><button class="btn btn-primary" id="startMidtransPayment"><i class="fa-solid fa-lock"></i> Bayar melalui Midtrans</button></div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('.modal-close').onclick=close;
  overlay.querySelector('#cancelMidtransPayment').onclick = async () => {
    if (!await showRentGoConfirm('Batalkan pesanan?', 'Pesanan yang belum dibayar akan dibatalkan.', 'Batalkan pesanan')) return;
    state.rentals = state.rentals.filter(r => r.id !== rentalId); saveState();
    if (typeof deleteRentalFromCloud === 'function') await deleteRentalFromCloud(rentalId);
    close(); render(); toast('Pesanan dibatalkan.', 'info');
  };
  overlay.querySelector('#startMidtransPayment').onclick = async () => {
    const btn=overlay.querySelector('#startMidtransPayment'), msg=overlay.querySelector('#rgMidtransMessage');
    const sb=window.rentGoSupabase;
    if(!sb){msg.textContent='Supabase belum terhubung.';return;}
    btn.disabled=true; msg.textContent='Membuat transaksi aman...';
    try {
      const {data:{session}} = await sb.auth.getSession();
      if(!session?.access_token) throw new Error('Silakan login ulang dengan akun Supabase Auth sebelum melakukan pembayaran.');
      const saved = await (typeof saveRentalToCloud==='function' ? saveRentalToCloud(rental) : false);
      if(!saved) throw new Error('Pesanan belum tersimpan di Supabase. Coba lagi sebelum membayar.');
      const {data,error}=await sb.functions.invoke('create-midtrans-payment',{body:{rental_id:String(rental.id)}});
      if(error) throw error;
      if(!data?.token) throw new Error(data?.error || 'Midtrans tidak mengembalikan token pembayaran.');
      const clientKey = data.client_key;
      if(!clientKey) throw new Error('MIDTRANS_CLIENT_KEY belum tersedia di Edge Function Secrets.');
      const production = String(data.environment || 'sandbox').toLowerCase() === 'production';
      const snapUrl = production ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
      await loadMidtransSnap(snapUrl, clientKey);
      msg.textContent='Transaksi dibuat. Selesaikan pembayaran pada jendela Midtrans di RentGo.';
      window.snap.pay(data.token, {
        onSuccess: async () => {
          // Callback ini berjalan ketika penyewa menekan Oke pada hasil sukses Snap.
          // Tutup modal pembayaran RentGo juga; status rental tetap ditentukan webhook server.
          toast('Pembayaran berhasil. Memperbarui status booking…', 'success');
          close();
          try {
            if (typeof loadRentGoWorkflow === 'function') await loadRentGoWorkflow();
            if (typeof render === 'function') render();
          } catch (refreshError) { console.warn('[RentGo payment] refresh after success', refreshError); }
        },
        onPending: () => { msg.textContent='Pembayaran masih menunggu penyelesaian. Kamu dapat melanjutkan dari halaman ini.'; btn.disabled=false; },
        onError: () => { msg.textContent='Pembayaran gagal. Silakan coba lagi.'; btn.disabled=false; },
        onClose: () => { msg.textContent='Jendela pembayaran ditutup. Pesanan tetap menunggu pembayaran.'; btn.disabled=false; }
      });
      btn.disabled=false;
    } catch(e) {
      msg.textContent=e?.message || 'Pembayaran belum dapat dimulai. Periksa konfigurasi Supabase Edge Functions dan Midtrans.';
      btn.disabled=false;
    }
  };
}
