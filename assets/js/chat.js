/* RentGo — chat lintas perangkat melalui Supabase */
function chatCloud(){ return window.rentGoSupabase || null; }

function chatThreadId(rentalId, motorId, buyerId){
  if (rentalId) return 'rental:' + rentalId;
  return 'motor:' + motorId + ':buyer:' + buyerId;
}

async function fetchCloudMessages(threadId){
  const sb = chatCloud();
  if (!sb) return null;
  const { data, error } = await sb.from('chat_messages').select('*')
    .eq('thread_id', threadId).order('created_at', { ascending: true });
  if (error) { console.error('[RentGo chat] fetch', error); toast('Gagal memuat chat: ' + error.message, 'error'); return []; }
  return (data || []).map(row => ({
    id: row.id, threadId: row.thread_id, rentalId: row.rental_id,
    motorId: row.motor_id, motorName: row.motor_name,
    senderId: row.sender_id, receiverId: row.receiver_id,
    senderName: row.sender_name, receiverName: row.receiver_name,
    text: row.message, read: row.is_read, createdAt: row.created_at
  }));
}

async function openChat(rentalId){
  const r = state.rentals.find(x => x.id === rentalId);
  if (!r) { toast('Data rental tidak ditemukan di perangkat ini. Buka Pesan Masuk untuk melihat chat cloud.', 'warning'); return; }
  const otherId = state.currentUser.id === r.buyerId ? r.sellerId : r.buyerId;
  const other = state.users.find(u => u.id === otherId);
  const motor = state.motors.find(m => m.id === r.motorId);
  return openChatThread({
    threadId: chatThreadId(r.id), rentalId: r.id, motorId: r.motorId,
    motorName: motor?.name || 'Motor', otherId,
    otherName: other?.name || (state.currentUser.role === 'buyer' ? 'Penyedia' : 'Penyewa'),
    otherPhone: other?.phone || ''
  });
}

function openMotorChat(motorId){
  const motor = state.motors.find(m => String(m.id) === String(motorId));
  if (!motor || !state.currentUser) return;
  if (state.currentUser.role !== 'buyer') { toast('Pilih percakapan dari menu Pesan Masuk.', 'info'); return; }
  const seller = state.users.find(u => String(u.id) === String(motor.sellerId));
  const threadId = chatThreadId(null, motor.id, state.currentUser.id);
  openChatThread({
    threadId, rentalId: null, motorId: motor.id, motorName: motor.name,
    otherId: motor.sellerId, otherName: seller?.name || 'Penyedia',
    otherPhone: seller?.phone || ''
  });
}

async function openChatThread(info){
  const sb = chatCloud();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="chat-container">
        <div class="chat-header">
          <div class="chat-avatar">${initials(info.otherName || '?')}</div>
          <div class="chat-info"><div class="name">${esc(info.otherName || 'Pengguna RentGo')}</div>
          <div class="sub">${esc(info.motorName || 'Percakapan RentGo')}</div></div>
          <button class="modal-close" style="position:static"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="chat-messages" id="chatMessages"><div class="chat-empty">Memuat pesan...</div></div>
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Ketik pesan..." autocomplete="off" maxlength="2000">
          <button class="chat-send" id="chatSend" aria-label="Kirim pesan"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
        ${!sb ? '<div style="padding:8px 12px;color:#b91c1c;font-size:12px">Supabase belum dikonfigurasi. Pesan lintas perangkat belum aktif.</div>' : ''}
      </div>
      <div class="modal-footer" style="justify-content:space-between">
        ${info.otherPhone ? `<a class="btn btn-secondary btn-sm" href="https://wa.me/${String(info.otherPhone).replace(/\\D/g,'')}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>` : '<span></span>'}
        <button class="btn btn-secondary btn-sm modal-close-btn">Tutup</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { if (subscription) sb?.removeChannel(subscription); overlay.remove(); };
  overlay.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => b.onclick = close);
  overlay.onclick = e => { if (e.target === overlay) close(); };
  const msgsEl = overlay.querySelector('#chatMessages');
  const inputEl = overlay.querySelector('#chatInput');
  const sendEl = overlay.querySelector('#chatSend');
  let subscription = null, loading = false;

  async function renderMessages(){
    if (loading || !overlay.isConnected) return;
    loading = true;
    const cloud = await fetchCloudMessages(info.threadId);
    if (cloud !== null) {
      state.chats = state.chats.filter(m => m.threadId !== info.threadId).concat(cloud);
    }
    const msgs = cloud === null
      ? state.chats.filter(m => m.threadId === info.threadId || (info.rentalId && m.rentalId === info.rentalId))
      : cloud;
    if (!msgs.length) {
      msgsEl.innerHTML = `<div class="chat-empty"><i class="fa-solid fa-comments"></i>Belum ada pesan.<br>Mulai percakapan dengan ${esc(info.otherName || 'pengguna')}.</div>`;
    } else {
      msgsEl.innerHTML = msgs.map(m => {
        const self = String(m.senderId) === String(state.currentUser.id);
        return `<div class="chat-bubble ${self?'self':'other'}">${esc(m.text)}<span class="time">${timeAgo(m.createdAt)}${self && m.read?' · ✓✓':''}</span></div>`;
      }).join('');
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
    if (sb) {
      const unreadIds = msgs.filter(m => String(m.receiverId) === String(state.currentUser.id) && !m.read).map(m => m.id);
      if (unreadIds.length) {
        const { error } = await sb.from('chat_messages').update({is_read:true})
          .in('id', unreadIds).eq('receiver_id', String(state.currentUser.id));
        if (error) console.warn('[RentGo chat] mark read', error.message);
      }
    } else {
      let changed = false;
      msgs.forEach(m => { if (String(m.receiverId) === String(state.currentUser.id) && !m.read) { m.read = true; changed = true; } });
      if (changed) saveState();
    }
    loading = false;
  }

  async function sendMessage(){
    const message = inputEl.value.trim();
    if (!message) return;
    sendEl.disabled = true;
    const now = new Date().toISOString();
    const msg = {
      id: uid('c'), threadId: info.threadId, rentalId: info.rentalId || null,
      motorId: String(info.motorId || ''), motorName: info.motorName || '',
      senderId: String(state.currentUser.id), receiverId: String(info.otherId),
      senderName: state.currentUser.name || 'Pengguna RentGo',
      receiverName: info.otherName || 'Pengguna RentGo',
      text: message, read: false, createdAt: now
    };
    if (sb) {
      const row = {
        id: msg.id, thread_id: msg.threadId, rental_id: msg.rentalId,
        motor_id: msg.motorId || null, motor_name: msg.motorName,
        sender_id: msg.senderId, receiver_id: msg.receiverId,
        sender_name: msg.senderName, receiver_name: msg.receiverName,
        message: msg.text, is_read: false, created_at: now
      };
      const { error } = await sb.from('chat_messages').insert(row);
      if (error) {
        console.error('[RentGo chat] send', error);
        toast('Pesan gagal dikirim: ' + error.message, 'error');
        sendEl.disabled = false; return;
      }
    } else {
      state.chats.push(msg); saveState();
    }
    inputEl.value = '';
    await renderMessages();
    sendEl.disabled = false;
    if (typeof pushNotif === 'function') pushNotif(info.otherId, 'chat', 'Pesan Baru', `${state.currentUser.name}: ${message.slice(0,50)}`, info.rentalId || null);
  }
  sendEl.onclick = sendMessage;
  inputEl.onkeydown = e => { if (e.key === 'Enter') sendMessage(); };
  if (sb) {
    subscription = sb.channel('rentgo-chat-' + info.threadId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'thread_id=eq.' + info.threadId }, () => renderMessages())
      .subscribe();
  }
  await renderMessages();
  inputEl.focus();
}

async function openChatInbox(){
  if (!state.currentUser) return;
  const sb = chatCloud();
  if (!sb) {
    toast('Chat lintas perangkat belum aktif. Isi URL dan publishable key Supabase terlebih dahulu.', 'warning');
    return;
  }
  const { data, error } = await sb.from('chat_messages').select('*')
    .or(`sender_id.eq.${String(state.currentUser.id)},receiver_id.eq.${String(state.currentUser.id)}`)
    .order('created_at', { ascending: false }).limit(300);
  if (error) { toast('Gagal mengambil pesan masuk: ' + error.message, 'error'); console.error(error); return; }
  const threads = new Map();
  (data || []).forEach(m => {
    if (!threads.has(m.thread_id)) threads.set(m.thread_id, m);
  });
  const rows = [...threads.values()];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3><i class="fa-solid fa-comments"></i> Pesan Masuk</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
  <div class="modal-body" id="chatInboxRows">${rows.length ? rows.map(m => {
    const isSender = String(m.sender_id) === String(state.currentUser.id);
    const otherName = isSender ? (m.receiver_name || 'Pengguna RentGo') : (m.sender_name || 'Pengguna RentGo');
    const unread = (data || []).filter(x => x.thread_id === m.thread_id && String(x.receiver_id) === String(state.currentUser.id) && !x.is_read).length;
    return `<button class="btn btn-secondary" style="display:flex;width:100%;justify-content:space-between;align-items:center;margin-bottom:8px;text-align:left" data-thread="${esc(m.thread_id)}" data-other="${esc(isSender?m.receiver_id:m.sender_id)}" data-name="${esc(otherName)}" data-motor="${esc(m.motor_id||'')}" data-motor-name="${esc(m.motor_name||'Motor')}">
      <span><strong>${esc(otherName)}</strong><br><small>${esc(m.motor_name || 'Percakapan RentGo')} · ${esc(m.message.slice(0,75))}</small></span>
      ${unread ? `<span class="status-badge available">${unread} baru</span>` : ''}
    </button>`;
  }).join('') : '<div class="empty"><i class="fa-regular fa-comment-dots"></i><h3>Belum ada pesan</h3><p>Pesan dari penyewa akan muncul di sini.</p></div>'}</div>
  <div class="modal-footer"><button class="btn btn-secondary modal-close-btn">Tutup</button></div></div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelectorAll('.modal-close,.modal-close-btn').forEach(b => b.onclick = close);
  overlay.onclick = e => { if (e.target === overlay) close(); };
  overlay.querySelectorAll('[data-thread]').forEach(btn => btn.onclick = () => {
    const info = { threadId: btn.dataset.thread, rentalId: null, motorId: btn.dataset.motor,
      motorName: btn.dataset.motorName, otherId: btn.dataset.other, otherName: btn.dataset.name };
    close(); openChatThread(info);
  });
}

function ensureChatInboxButton(){
  if (!state.currentUser || document.getElementById('rentgoChatInboxButton')) return;
  const b = document.createElement('button');
  b.id = 'rentgoChatInboxButton';
  b.type = 'button';
  b.innerHTML = '<i class="fa-solid fa-comments"></i> Pesan Masuk';
  b.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:900;background:#2563eb;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:600 14px inherit;box-shadow:0 8px 24px #0002;cursor:pointer';
  b.onclick = openChatInbox;
  document.body.appendChild(b);
}
