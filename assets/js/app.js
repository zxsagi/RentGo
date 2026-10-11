/* RentGo — app */
/* ============================================================
   RENDER
   ============================================================ */
function render(){
  if (typeof setupRentGoTheme === "function") setupRentGoTheme();
  const oldChatInboxButton = document.getElementById('rentgoChatInboxButton');
  if (!state.currentUser && oldChatInboxButton) oldChatInboxButton.remove();
  if (!state.currentUser) renderAuth();
  else if (state.currentUser.role === 'buyer') renderBuyer();
  else renderSeller();
  startTimers();
  if (typeof ensureChatInboxButton === 'function') ensureChatInboxButton();
  if (state.currentUser && typeof loadRentGoWorkflow === 'function' && window._rentGoWorkflowUser !== String(state.currentUser.id)) {
    window._rentGoWorkflowUser = String(state.currentUser.id);
    loadRentGoWorkflow().then(() => { startRentGoWorkflowRealtime(); if (typeof render === 'function') render(); });
  }
}

loadState();
render();
// Tarik daftar motor dari Supabase setelah UI awal tampil.
if (typeof initRentGoCloud === 'function') initRentGoCloud();

// Muat booking/notifikasi akun dari cloud dan dengarkan perubahan lintas perangkat.
if (state.currentUser && typeof loadRentGoWorkflow === 'function') {
  loadRentGoWorkflow().then(() => { startRentGoWorkflowRealtime(); if (typeof render === 'function') render(); });
}
