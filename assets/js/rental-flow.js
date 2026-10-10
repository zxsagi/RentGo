/* RentGo — rental-flow */
/* ============================================================
   RENTAL FLOW
   ============================================================ */
function confirmPickup(rentalId){
  const r = state.rentals.find(x => x.id === rentalId);
  if (!r || r.status !== 'booked') return;
  r.status = 'active';
  r.startTime = new Date().toISOString();
  r.pickupConfirmedAt = new Date().toISOString();
  saveState();
  const motor = state.motors.find(m => m.id === r.motorId);
  const buyer = state.users.find(u => u.id === r.buyerId);
  pushNotif(r.buyerId, 'booking', 'Motor Diambil', `Timer untuk ${motor?.name||'motor'} telah dimulai.`, r.id);
  pushNotif(r.sellerId, 'booking', 'Motor Diambil', `${buyer?.name||'Penyewa'} telah mengambil ${motor?.name||'motor'}. Timer berjalan.`, r.id);
  toast('Motor dikonfirmasi diambil. Timer dimulai!', 'success');
  render();
}

function confirmReturn(rentalId){
  const r = state.rentals.find(x => x.id === rentalId);
  if (!r || r.status !== 'active') return;
  if (!confirm('Konfirmasi motor telah dikembalikan dengan baik?')) return;
  r.status = 'completed';
  r.completedAt = new Date().toISOString();
  // Hitung komisi dan payout (HANYA untuk seller, tidak ditampilkan ke buyer)
  r.commission = Math.round(r.totalPrice * COMMISSION_RATE);
  r.sellerPayout = r.totalPrice - r.commission;
  // Transfer dari escrow ke saldo seller
  const seller = state.users.find(u => u.id === r.sellerId);
  if (seller){ seller.balance = (seller.balance || 0) + r.sellerPayout; }
  saveState();
  const motor = state.motors.find(m => m.id === r.motorId);
  // Notif ke BUYER — TANPA info komisi
  pushNotif(r.buyerId, 'payment', 'Rental Selesai', `Terima kasih! Rental ${motor?.name||'motor'} selesai. Jangan lupa beri rating.`, r.id);
  // Notif ke SELLER — DENGAN info komisi & payout
  pushNotif(r.sellerId, 'payment', 'Pembayaran Diterima', `${rupiah(r.sellerPayout)} masuk ke saldo kamu (komisi platform: ${rupiah(r.commission)}).`, r.id);
  toast('Rental selesai. Pembayaran diteruskan ke penyedia.', 'success');
  render();
}
