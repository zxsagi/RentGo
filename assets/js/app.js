/* RentGo — app */
function render(){
  if (!state.currentUser) renderAuth();
  else if (state.currentUser.role === 'buyer') renderBuyer();
  else renderSeller();
  startTimers();
}

loadState();
if (window.rentGoCloudEnabled && typeof initRentGoCloud === 'function') {
  // Jangan tampilkan sesi demo lokal sebagai sesi online. Tunggu pemulihan sesi Supabase.
  state.currentUser = null;
  renderAuth();
  initRentGoCloud().catch(e => console.error('[RentGo] bootstrap', e));
} else {
  render();
  console.warn('[RentGo] Mode lokal/demo aktif. Isi assets/js/supabase-config.js untuk fitur online.');
}
