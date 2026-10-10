/* RentGo — app */
/* ============================================================
   RENDER
   ============================================================ */
function render(){
  const oldChatInboxButton = document.getElementById('rentgoChatInboxButton');
  if (!state.currentUser && oldChatInboxButton) oldChatInboxButton.remove();
  if (!state.currentUser) renderAuth();
  else if (state.currentUser.role === 'buyer') renderBuyer();
  else renderSeller();
  startTimers();
  if (typeof ensureChatInboxButton === 'function') ensureChatInboxButton();
}

loadState();
render();
// Tarik daftar motor dari Supabase setelah UI awal tampil.
if (typeof initRentGoCloud === 'function') initRentGoCloud();
