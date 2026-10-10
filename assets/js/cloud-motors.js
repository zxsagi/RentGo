/* RentGo — sinkronisasi data motor dan foto dengan Supabase */
(function () {
  const config = window.RENTGO_SUPABASE_CONFIG || {};
  const placeholder = !config.url || config.url.includes('PROJECT-ID-ANDA') ||
    !config.anonKey || config.anonKey.includes('ISI_PUBLISHABLE');
  window.rentGoSupabase = (!placeholder && window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;
  window.rentGoCloudEnabled = Boolean(window.rentGoSupabase);
  const bucket = config.bucket || 'motor-photos';

  function cloudError(error, context) {
    console.error('[RentGo cloud] ' + context, error);
    if (typeof toast === 'function') toast(context + ': ' + (error?.message || 'periksa konfigurasi Supabase'), 'error');
  }

  window.uploadMotorPhoto = async function (file, sellerId, motorId) {
    if (!window.rentGoSupabase) return null;
    if (!file) return null;
    const extFromName = (file.name.split('.').pop() || '').toLowerCase();
    const ext = ['jpg','jpeg','png','webp','avif'].includes(extFromName) ? extFromName : 'jpg';
    const safeSeller = String(sellerId || 'seller').replace(/[^a-zA-Z0-9_-]/g, '_');
    const path = safeSeller + '/' + String(motorId).replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + Date.now() + '.' + ext;
    const { data, error } = await window.rentGoSupabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type || 'image/jpeg'
    });
    if (error) { cloudError(error, 'Upload foto gagal'); throw error; }
    const { data: urlData } = window.rentGoSupabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  window.saveMotorToCloud = async function (motor) {
    if (!window.rentGoSupabase) return false;
    const row = {
      id: String(motor.id), seller_id: String(motor.sellerId), brand: motor.brand,
      name: motor.name, year: Number(motor.year) || null,
      price_per_hour: Number(motor.pricePerHour) || 0,
      price_per_day: Number(motor.pricePerDay) || 0,
      location: motor.location || '', location_detail: motor.locationDetail || '',
      helm_included: Boolean(motor.helmIncluded), helm_count: Number(motor.helmCount) || 0,
      description: motor.description || '', photo: motor.photo || '',
      is_open: motor.isOpen !== false, updated_at: new Date().toISOString()
    };
    const { error } = await window.rentGoSupabase.from('motors').upsert(row, { onConflict: 'id' });
    if (error) { cloudError(error, 'Menyimpan data motor ke cloud gagal'); throw error; }
    return true;
  };

  window.deleteMotorFromCloud = async function (motorId) {
    if (!window.rentGoSupabase) return false;
    const { error } = await window.rentGoSupabase.from('motors').delete().eq('id', String(motorId));
    if (error) { cloudError(error, 'Menghapus motor dari cloud gagal'); throw error; }
    return true;
  };

  window.syncCloudMotors = async function (quiet = true) {
    if (!window.rentGoSupabase) return false;
    const { data, error } = await window.rentGoSupabase.from('motors').select('*').order('updated_at', { ascending: false });
    if (error) { if (!quiet) cloudError(error, 'Mengambil daftar motor dari cloud gagal'); else console.error('[RentGo cloud] load motors', error); return false; }
    const remoteMotors = (data || []).map(row => ({
      id: String(row.id), sellerId: String(row.seller_id), brand: row.brand || '', name: row.name || '',
      year: Number(row.year) || new Date().getFullYear(), pricePerHour: Number(row.price_per_hour) || 0,
      pricePerDay: Number(row.price_per_day) || 0, location: row.location || '',
      locationDetail: row.location_detail || '', helmIncluded: Boolean(row.helm_included),
      helmCount: Number(row.helm_count) || 0, description: row.description || '',
      photo: row.photo || '', isOpen: row.is_open !== false, cloudSynced: true
    }));
    const remoteIds = new Set(remoteMotors.map(m => m.id));
    // Motor cloud menimpa versi lokal dengan ID sama; seed/demo lokal tetap tersedia.
    state.motors = [...state.motors.filter(m => !remoteIds.has(String(m.id))), ...remoteMotors];
    saveState();
    if (typeof render === 'function' && state.currentUser) render();
    return true;
  };

  window.initRentGoCloud = async function () {
    if (!window.rentGoSupabase) {
      console.info('[RentGo] Supabase belum dikonfigurasi. Foto hanya tersimpan di browser ini.');
      return false;
    }
    await window.syncCloudMotors(true);
    return true;
  };
})();
