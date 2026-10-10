/* RentGo — chat */
/* ============================================================
   CHAT
   ============================================================ */
function openChat(rentalId){
  const r = state.rentals.find(x => x.id === rentalId);
  if (!r) return;
  const otherId = state.currentUser.id === r.buyerId ? r.sellerId : r.buyerId;
  const other = state.users.find(u => u.id === otherId);
  const motor = state.motors.find(m => m.id === r.motorId);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="chat-container">
        <div class="chat-header">
          <div class="chat-avatar">${initials(other?.name||'?')}</div>
          <div class="chat-info"><div class="name">${esc(other?.name||'-')}</div><div class="sub">${esc(motor?.name||'Motor')} · Rental #${r.id.slice(-5)}</div></div>
          <button class="modal-close" style="position:static"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Ketik pesan..." autocomplete="off">
          <button class="chat-send" id="chatSend"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <div class="modal-footer" style="justify-content:space-between">
        <a class="btn btn-secondary btn-sm" href="https://wa.me/${(other?.phone||'').replace(/\D/g,'')}" target="_blank"><i class="fa-brands fa-whatsapp"></i> Lanjut di WhatsApp</a>
        <button class="btn btn-secondary btn-sm modal-close-btn">Tutup</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => b.onclick = () => overlay.remove());
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const msgsEl = document.getElementById('chatMessages');
  const inputEl = document.getElementById('chatInput');
  const sendEl = document.getElementById('chatSend');

  function renderMessages(){
    const msgs = state.chats.filter(c => c.rentalId === rentalId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    let changed = false;
    msgs.forEach(m => { if (m.receiverId === state.currentUser.id && !m.read){ m.read = true; changed = true; } });
    if (changed) saveState();
    if (msgs.length === 0){
      msgsEl.innerHTML = `<div class="chat-empty"><i class="fa-solid fa-comments"></i>Belum ada pesan.<br>Mulai percakapan dengan ${esc(other?.name||'seller')}.</div>`;
      return;
    }
    msgsEl.innerHTML = msgs.map(m => {
      const self = m.senderId === state.currentUser.id;
      return `<div class="chat-bubble ${self?'self':'other'}">${esc(m.text)}<span class="time">${timeAgo(m.createdAt)}${self && m.read?' · ✓✓':''}</span></div>`;
    }).join('');
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }
  function sendMessage(){
    const text = inputEl.value.trim();
    if (!text) return;
    const msg = { id: uid('c'), rentalId, senderId: state.currentUser.id, receiverId: otherId, text, read: false, createdAt: new Date().toISOString() };
    state.chats.push(msg); saveState();
    inputEl.value = '';
    renderMessages();
    pushNotif(otherId, 'chat', 'Pesan Baru', `${state.currentUser.name}: ${text.slice(0,50)}${text.length>50?'...':''}`, rentalId);
  }
  sendEl.onclick = sendMessage;
  inputEl.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };
  renderMessages();
  setTimeout(() => inputEl.focus(), 100);
}
