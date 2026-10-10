/* RentGo — sinkronisasi booking, status rental, dan notifikasi lintas perangkat */
(function () {
  const sb = () => window.rentGoSupabase;
  const asRow = r => ({ id: String(r.id), buyer_id: String(r.buyerId), seller_id: String(r.sellerId), motor_id: String(r.motorId), status: r.status || 'pending_payment', rental_data: r, updated_at: new Date().toISOString() });
  window.saveRentalToCloud = async function (r) {
    if (!sb() || !r) return false;
    const { error } = await sb().from('rentals').upsert(asRow(r), { onConflict: 'id' });
    if (error) { console.error('[RentGo rental] save', error); toast('Pesanan belum tersinkron ke server: ' + error.message, 'error'); return false; }
    return true;
  };
  window.deleteRentalFromCloud = async function (id) {
    if (!sb()) return false;
    const { error } = await sb().from('rentals').delete().eq('id', String(id));
    if (error) { console.error('[RentGo rental] delete', error); toast('Pesanan gagal dibatalkan di server: ' + error.message, 'error'); return false; }
    return true;
  };
  window.saveNotificationToCloud = async function (n) {
    if (!sb() || !n) return false;
    const row = { id: String(n.id), user_id: String(n.userId), type: n.type || 'info', title: n.title || '', message: n.message || '', rental_id: n.rentalId ? String(n.rentalId) : null, is_read: Boolean(n.read), created_at: n.createdAt || new Date().toISOString() };
    const { error } = await sb().from('rentgo_notifications').upsert(row, { onConflict: 'id' });
    if (error) console.error('[RentGo notification] save', error);
    return !error;
  };
  window.loadRentGoWorkflow = async function () {
    if (!sb() || !state.currentUser) return false;
    const uid = String(state.currentUser.id);
    const [rr, nn] = await Promise.all([
      sb().from('rentals').select('rental_data').or(`buyer_id.eq.${uid},seller_id.eq.${uid}`).order('updated_at', { ascending: false }),
      sb().from('rentgo_notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200)
    ]);
    if (!rr.error) {
      const cloudRentals = (rr.data || []).map(x => x.rental_data).filter(Boolean);
      const otherRentals = state.rentals.filter(r => String(r.buyerId) !== uid && String(r.sellerId) !== uid);
      state.rentals = [...otherRentals, ...cloudRentals];
    } else console.error('[RentGo workflow] load rentals', rr.error);
    if (!nn.error) {
      const cloudNotifs = (nn.data || []).map(n => ({ id:n.id, userId:n.user_id, type:n.type, title:n.title, message:n.message, rentalId:n.rental_id, read:n.is_read, createdAt:n.created_at }));
      state.notifications = [...state.notifications.filter(n => String(n.userId) !== uid), ...cloudNotifs];
    } else console.error('[RentGo workflow] load notifications', nn.error);
    saveState();
    return true;
  };
  window.startRentGoWorkflowRealtime = function () {
    if (!sb() || !state.currentUser) return;
    if (window.rentGoWorkflowChannel) sb().removeChannel(window.rentGoWorkflowChannel);
    const uid = String(state.currentUser.id);
    window.rentGoWorkflowChannel = sb().channel('rentgo-workflow-' + uid)
      .on('postgres_changes', {event:'*', schema:'public', table:'rentals'}, async payload => {
        const row = payload.new || payload.old || {};
        if (String(row.buyer_id) !== uid && String(row.seller_id) !== uid) return;
        await window.loadRentGoWorkflow();
        if (typeof render === 'function' && state.currentUser) render();
      })
      .on('postgres_changes', {event:'*', schema:'public', table:'rentgo_notifications', filter:'user_id=eq.' + uid}, async () => {
        await window.loadRentGoWorkflow();
        if (typeof renderNotifBell === 'function') renderNotifBell();
        if (typeof render === 'function' && state.currentUser) render();
      }).subscribe();
  };
})();
