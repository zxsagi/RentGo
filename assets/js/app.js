/* RentGo — app */
/* ============================================================
   RENDER
   ============================================================ */
function render(){
  if (!state.currentUser) renderAuth();
  else if (state.currentUser.role === 'buyer') renderBuyer();
  else renderSeller();
  startTimers();
}

loadState();
render();
// Tarik daftar motor dari Supabase setelah UI awal tampil.
if (typeof initRentGoCloud === 'function') initRentGoCloud();
