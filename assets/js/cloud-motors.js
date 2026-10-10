/* RentGo Cloud: Supabase Auth + katalog + records lintas perangkat + Realtime. */
(function () {
  const config = window.RENTGO_SUPABASE_CONFIG || {};
  const placeholder = !config.url || /PROJECT-ID-ANDA|your-project/i.test(config.url) ||
    !config.anonKey || /ISI_PUBLISHABLE|YOUR-ANON|YOUR-PUBLISHABLE/i.test(config.anonKey);
  window.rentGoSupabase = (!placeholder && window.supabase?.createClient)
    ? window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null;
  window.rentGoCloudEnabled = Boolean(window.rentGoSupabase);
  const db = () => window.rentGoSupabase;
  const bucket = config.bucket || 'motor-photos';
  let realtimeChannel = null;
  let isApplyingRemote = false;

  function report(error, context) {
    console.error('[RentGo cloud] ' + context, error);
    if (typeof toast === 'function') toast(context + ': ' + (error?.message || 'periksa konfigurasi Supabase'), 'error');
  }
  function currentUid() { return state.currentUser?.id || null; }
  function record(type, item) {
    let owner = currentUid(), participants = [];
    if (type === 'rental') { owner = item.buyerId; participants = [item.buyerId, item.sellerId]; }
    if (type === 'chat') { owner = item.senderId; participants = [item.senderId, item.receiverId]; }
    if (type === 'review') { owner = item.buyerId; participants = [item.buyerId, item.sellerId]; }
    if (type === 'notification') { owner = item.createdBy || currentUid(); participants = [owner, item.userId].filter(Boolean); }
    return { record_type: type, record_id: String(item.id), owner_id: owner, participant_ids: [...new Set(participants.filter(Boolean))], payload: item, updated_at: new Date().toISOString() };
  }

  window.uploadMotorPhoto = async function (file, sellerId, motorId) {
    if (!db()) throw new Error('Supabase belum dikonfigurasi.');
    if (!file) return null;
    if (!currentUid()) throw new Error('Silakan login ulang sebelum mengunggah foto.');
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Foto harus JPG, PNG, WEBP, atau AVIF maksimal 5 MB.');
    const ext = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'})[file.type] || 'jpg';
    const path = currentUid() + '/' + String(motorId).replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + Date.now() + '.' + ext;
    const { data, error } = await db().storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) { report(error, 'Upload foto gagal'); throw error; }
    return db().storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  };

  window.saveMotorToCloud = async function (motor) {
    if (!db()) throw new Error('Supabase belum dikonfigurasi.');
    if (!currentUid() || String(motor.sellerId) !== currentUid()) throw new Error('Hanya pemilik motor yang dapat menyimpan motor ini.');
    const row = { id: String(motor.id), seller_id: currentUid(), brand: motor.brand, name: motor.name,
      year: Number(motor.year) || null, price_per_hour: Number(motor.pricePerHour) || 0,
      price_per_day: Number(motor.pricePerDay) || 0, location: motor.location || '',
      location_detail: motor.locationDetail || '', helm_included: Boolean(motor.helmIncluded),
      helm_count: Number(motor.helmCount) || 0, description: motor.description || '', photo: motor.photo || '',
      is_open: motor.isOpen !== false, updated_at: new Date().toISOString() };
    const { error } = await db().from('motors').upsert(row, { onConflict: 'id' });
    if (error) { report(error, 'Menyimpan motor gagal'); throw error; }
    return true;
  };
  window.deleteMotorFromCloud = async function (motorId) {
    if (!db()) return false;
    const { error } = await db().from('motors').delete().eq('id', String(motorId)).eq('seller_id', currentUid());
    if (error) { report(error, 'Menghapus motor gagal'); throw error; }
    return true;
  };

  window.syncCloudMotors = async function (quiet = true) {
    if (!db()) return false;
    const { data, error } = await db().from('motors').select('*').order('updated_at', { ascending: false });
    if (error) { if (!quiet) report(error, 'Memuat katalog motor gagal'); else console.error('[RentGo cloud] load motors', error); return false; }
    state.motors = (data || []).map(row => ({ id: String(row.id), sellerId: String(row.seller_id), brand: row.brand || '', name: row.name || '',
      year: Number(row.year) || new Date().getFullYear(), pricePerHour: Number(row.price_per_hour) || 0, pricePerDay: Number(row.price_per_day) || 0,
      location: row.location || '', locationDetail: row.location_detail || '', helmIncluded: Boolean(row.helm_included), helmCount: Number(row.helm_count) || 0,
      description: row.description || '', photo: row.photo || '', isOpen: row.is_open !== false, cloudSynced: true }));
    return true;
  };

  window.persistRentGoRecords = async function () {
    if (!db() || !currentUid() || isApplyingRemote) return;
    const uid = currentUid();
    const all = [];
    (state.rentals || []).filter(x => [x.buyerId, x.sellerId].includes(uid)).forEach(x => all.push(record('rental', x)));
    (state.chats || []).filter(x => [x.senderId, x.receiverId].includes(uid)).forEach(x => all.push(record('chat', x)));
    (state.reviews || []).filter(x => [x.buyerId, x.sellerId].includes(uid)).forEach(x => all.push(record('review', x)));
    (state.notifications || []).filter(x => [x.userId, x.createdBy].includes(uid)).forEach(x => all.push(record('notification', x)));
    if (!all.length) return;
    const { error } = await db().from('rentgo_records').upsert(all, { onConflict: 'record_type,record_id' });
    if (error) report(error, 'Sinkronisasi data gagal');
  };

  async function loadProfiles() {
    const { data, error } = await db().from('profiles').select('id,name,email,role,phone,balance');
    if (error) throw error;
    state.users = (data || []).map(p => ({ id: p.id, name: p.name || 'Pengguna RentGo', email: p.email || '', role: p.role || 'buyer', phone: p.phone || '', balance: Number(p.balance) || 0 }));
  }
  async function loadRecords() {
    const { data, error } = await db().from('rentgo_records').select('record_type,payload');
    if (error) throw error;
    const rows = data || [];
    state.rentals = rows.filter(r => r.record_type === 'rental').map(r => r.payload);
    state.chats = rows.filter(r => r.record_type === 'chat').map(r => r.payload);
    state.reviews = rows.filter(r => r.record_type === 'review').map(r => r.payload);
    state.notifications = rows.filter(r => r.record_type === 'notification').map(r => r.payload);
  }
  async function refreshRemoteState(shouldRender = true) {
    if (!db() || !currentUid()) return;
    isApplyingRemote = true;
    try { await Promise.all([loadProfiles(), loadRecords(), window.syncCloudMotors(true)]); }
    finally { isApplyingRemote = false; }
    if (shouldRender && typeof render === 'function') render();
  }
  function subscribeRealtime() {
    if (!db() || realtimeChannel) return;
    realtimeChannel = db().channel('rentgo-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentgo_records' }, async () => {
        if (currentUid()) await refreshRemoteState(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'motors' }, async () => {
        if (currentUid()) { await window.syncCloudMotors(true); if (typeof render === 'function') render(); }
      })
      .subscribe(status => console.info('[RentGo realtime]', status));
  }

  window.rentGoLoadProfile = async function (authUser) {
    const { data, error } = await db().from('profiles').select('id,name,email,role,phone,balance').eq('id', authUser.id).single();
    if (error) throw error;
    return { id: data.id, name: data.name || authUser.user_metadata?.name || 'Pengguna RentGo', email: data.email || authUser.email || '', role: data.role || authUser.user_metadata?.role || 'buyer', phone: data.phone || '', balance: Number(data.balance) || 0 };
  };
  window.rentGoFinishLogin = async function (authUser) {
    state.currentUser = await window.rentGoLoadProfile(authUser);
    await refreshRemoteState(false);
    subscribeRealtime();
    saveState();
    if (typeof render === 'function') render();
  };
  window.rentGoSignOut = async function () {
    if (db()) { const { error } = await db().auth.signOut(); if (error) report(error, 'Logout gagal'); }
    state.currentUser = null; state.users = []; state.motors = []; state.rentals = []; state.chats = []; state.reviews = []; state.notifications = [];
    localStorage.removeItem('rentgo_v3');
    if (typeof render === 'function') render();
  };
  window.initRentGoCloud = async function () {
    if (!db()) { console.warn('[RentGo] Kredensial Supabase belum diisi. Aplikasi berjalan dalam mode lokal/demo.'); return false; }
    try {
      const { data: { session }, error } = await db().auth.getSession();
      if (error) throw error;
      if (session?.user) await window.rentGoFinishLogin(session.user);
      else {
        state.currentUser = null; state.users = []; state.motors = []; state.rentals = []; state.chats = []; state.reviews = []; state.notifications = [];
        if (typeof render === 'function') render();
      }
      db().auth.onAuthStateChange((event, sessionNow) => {
        if (event === 'SIGNED_OUT') { state.currentUser = null; if (typeof render === 'function') render(); }
        else if (event === 'SIGNED_IN' && sessionNow?.user && state.currentUser?.id !== sessionNow.user.id) {
          // Hindari memanggil operasi Supabase secara langsung di callback auth.
          setTimeout(() => window.rentGoFinishLogin(sessionNow.user).catch(e => report(e, 'Memuat profil gagal')), 0);
        }
      });
      return true;
    } catch (e) { report(e, 'Inisialisasi Supabase gagal'); return false; }
  };
})();
