/* RentGo — motor-form */
/* ============================================================
   MOTOR FORM (SELLER)
   ============================================================ */
function openMotorForm(motorId){
  const editing = motorId ? state.motors.find(m => m.id === motorId) : null;
  let photoData = editing?.photo || '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>${editing?'Edit Motor':'Tambah Motor Baru'}</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body">
        <div class="form-group">
          <label>Foto Motor</label>
          <div id="photoArea">
            ${photoData ? `<div class="photo-preview"><img src="${esc(photoData)}"><button class="remove" id="removePhoto"><i class="fa-solid fa-xmark"></i></button></div>` : ''}
            <div class="photo-upload" id="photoUpload"><i class="fa-solid fa-camera"></i><div class="text">Klik untuk upload foto</div><div class="sub">JPG, PNG max 5MB</div></div>
          </div>
          <input type="file" id="photoInput" accept="image/*" class="hidden">
        </div>
        <div class="form-group"><label>Brand</label><input type="text" id="fBrand" placeholder="Honda / Yamaha / Suzuki" value="${editing?esc(editing.brand):''}"></div>
        <div class="form-group"><label>Nama Motor</label><input type="text" id="fName" placeholder="Vario 125 / NMAX" value="${editing?esc(editing.name):''}"></div>
        <div class="form-group"><label>Tahun</label><input type="number" id="fYear" value="${editing?editing.year:2023}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group"><label>Harga per Jam</label><input type="number" id="fPriceHour" value="${editing?editing.pricePerHour:10000}"></div>
          <div class="form-group"><label>Harga per Hari</label><input type="number" id="fPriceDay" value="${editing?editing.pricePerDay:70000}"></div>
        </div>
        <div class="form-group"><label>Lokasi Penjemputan</label><input type="text" id="fLocation" placeholder="Pos 1 UNAI" value="${editing?esc(editing.location):''}"></div>
        <div class="form-group"><label>Detail Lokasi</label><input type="text" id="fLocationDetail" placeholder="Depan gerbang utama" value="${editing?esc(editing.locationDetail):''}"></div>
        <div class="form-group"><label>Jumlah Helm</label><input type="number" id="fHelm" value="${editing?editing.helmCount:1}"></div>
        <div class="form-group"><label>Deskripsi</label><textarea id="fDesc" rows="3" placeholder="Deskripsi motor...">${editing?esc(editing.description):''}</textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close-btn">Batal</button><button class="btn btn-primary" id="saveMotorBtn">${editing?'Simpan Perubahan':'Tambah Motor'}</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => b.onclick = () => overlay.remove());
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const photoInput = document.getElementById('photoInput');
  function bindPhotoEvents(){
    const up = document.getElementById('photoUpload') || document.getElementById('photoUpload2');
    if (up) up.onclick = () => photoInput.click();
    const rm = document.getElementById('removePhoto');
    if (rm) rm.onclick = (e) => {
      e.stopPropagation(); photoData = '';
      document.getElementById('photoArea').innerHTML = `<div class="photo-upload" id="photoUpload"><i class="fa-solid fa-camera"></i><div class="text">Klik untuk upload foto</div><div class="sub">JPG, PNG max 5MB</div></div>`;
      bindPhotoEvents();
    };
  }
  photoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Pilih file gambar yang valid', 'error'); photoInput.value = ''; return; }
    if (file.size > 5*1024*1024){ toast('Ukuran file maksimal 5MB', 'error'); photoInput.value = ''; return; }
    const reader = new FileReader();
    reader.onerror = () => toast('Foto gagal dibaca. Coba pilih foto lain.', 'error');
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => toast('Format foto tidak dapat dibuka', 'error');
      img.onload = () => {
        // Kompres dan batasi dimensi agar aman disimpan ke localStorage.
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.78);
        document.getElementById('photoArea').innerHTML = `
          <div class="photo-preview"><img src="${photoData}" alt="Pratinjau foto motor"><button type="button" class="remove" id="removePhoto"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="photo-upload" id="photoUpload2"><i class="fa-solid fa-camera"></i><div class="text">Ganti foto</div><div class="sub">Pilih foto lain bila diperlukan</div></div>
        `;
        bindPhotoEvents();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  bindPhotoEvents();

  document.getElementById('saveMotorBtn').onclick = () => {
    const brand = document.getElementById('fBrand').value.trim();
    const name = document.getElementById('fName').value.trim();
    const year = parseInt(document.getElementById('fYear').value) || 2023;
    const pricePerHour = parseInt(document.getElementById('fPriceHour').value) || 10000;
    const pricePerDay = parseInt(document.getElementById('fPriceDay').value) || 70000;
    const location = document.getElementById('fLocation').value.trim();
    const locationDetail = document.getElementById('fLocationDetail').value.trim();
    const helmCount = parseInt(document.getElementById('fHelm').value) || 0;
    const description = document.getElementById('fDesc').value.trim();
    if (!brand || !name || !location){ toast('Brand, nama, dan lokasi wajib diisi', 'error'); return; }
    if (editing){
      Object.assign(editing, { brand, name, year, pricePerHour, pricePerDay, location, locationDetail, helmCount, helmIncluded: helmCount>0, description, photo: photoData });
      toast('Motor berhasil diupdate', 'success');
    } else {
      state.motors.push({
        id: uid('m'), sellerId: state.currentUser.id, brand, name, year, pricePerHour, pricePerDay,
        location, locationDetail, helmCount, helmIncluded: helmCount>0, description,
        photo: photoData || MOTOR_PHOTOS.vario, isOpen: true
      });
      toast('Motor berhasil ditambahkan', 'success');
    }
    saveState(); overlay.remove(); render();
  };
}
