/* RentGo — auth */
/* ============================================================
   AUTH
   ============================================================ */
function renderAuth(){
  document.getElementById('app').innerHTML = `
    <div class="auth-wrap">
      <div class="auth-left">
        <div class="auth-logo"><i class="fa-solid fa-motorcycle"></i> RentGo</div>
        <div class="auth-hero">
          <h1>Sewa motor jadi lebih mudah & cepat.</h1>
          <p>Platform rental motor terpercaya untuk mahasiswa dan warga sekitar kampus. Booking online, motor siap pakai.</p>
        </div>
        <div class="auth-features">
          <div class="auth-feature"><i class="fa-solid fa-clock"></i> Timer real-time setelah motor diambil</div>
          <div class="auth-feature"><i class="fa-solid fa-comments"></i> Chat langsung dengan penyedia</div>
          <div class="auth-feature"><i class="fa-solid fa-star"></i> Rating & review terverifikasi</div>
          <div class="auth-feature"><i class="fa-solid fa-shield-halved"></i> Booking online · pembayaran masih demo</div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form">
          <h2 id="authTitle">Masuk ke RentGo</h2>
          <p class="sub" id="authSub">Silakan login untuk melanjutkan</p>
          <div class="role-select" id="roleSelect">
            <div class="role-option active" data-role="buyer"><i class="fa-solid fa-user"></i><span>Penyewa</span></div>
            <div class="role-option" data-role="seller"><i class="fa-solid fa-store"></i><span>Penyedia</span></div>
          </div>
          <div id="registerFields" class="hidden">
            <div class="form-group"><label>Nama Lengkap</label><input type="text" id="regName" placeholder="Nama kamu"></div>
            <div class="form-group"><label>No. WhatsApp</label><input type="tel" id="regPhone" placeholder="0812-xxxx-xxxx"></div>
          </div>
          <div class="form-group"><label>Email</label><input type="email" id="authEmail" placeholder="nama@email.com"></div>
          <div class="form-group"><label>Password</label><input type="password" id="authPassword" placeholder="••••••••"></div>
          <button class="btn btn-primary btn-block" id="authSubmit">Masuk</button>
          <div class="auth-switch"><span id="switchText">Belum punya akun?</span> <a id="switchBtn">Daftar sekarang</a></div>
          <div style="margin-top:20px;padding:12px;background:var(--bg);border-radius:10px;font-size:12px;color:var(--muted)">
            <strong>Akun RentGo</strong><br>Daftar dengan email dan password seperti biasa. Verifikasi email dinonaktifkan melalui pengaturan Supabase agar akun bisa langsung digunakan.
          </div>
        </div>
      </div>
    </div>
  `;
  let mode = 'login', selectedRole = 'buyer';
  document.querySelectorAll('.role-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active'); selectedRole = opt.dataset.role;
    };
  });
  const switchBtn = document.getElementById('switchBtn');
  switchBtn.onclick = () => {
    mode = mode === 'login' ? 'register' : 'login';
    const reg = document.getElementById('registerFields');
    if (mode === 'register'){
      reg.classList.remove('hidden');
      document.getElementById('authTitle').textContent = 'Daftar Akun Baru';
      document.getElementById('authSub').textContent = 'Buat akun untuk mulai menggunakan RentGo';
      document.getElementById('authSubmit').textContent = 'Daftar';
      document.getElementById('switchText').textContent = 'Sudah punya akun?';
      switchBtn.textContent = 'Masuk di sini';
    } else {
      reg.classList.add('hidden');
      document.getElementById('authTitle').textContent = 'Masuk ke RentGo';
      document.getElementById('authSub').textContent = 'Silakan login untuk melanjutkan';
      document.getElementById('authSubmit').textContent = 'Masuk';
      document.getElementById('switchText').textContent = 'Belum punya akun?';
      switchBtn.textContent = 'Daftar sekarang';
    }
  };
  document.getElementById('authSubmit').onclick = async () => {
    const email = document.getElementById('authEmail').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;
    const submit = document.getElementById('authSubmit');
    if (!email || !password){ toast('Email dan password wajib diisi', 'error'); return; }
    if (password.length < 6){ toast('Password minimal 6 karakter', 'error'); return; }
    submit.disabled = true;
    const originalText = submit.textContent;
    submit.textContent = mode === 'login' ? 'Memeriksa...' : 'Mendaftarkan...';
    try {
      if (window.rentGoCloudEnabled) {
        const client = window.rentGoSupabase;
        if (mode === 'login') {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          await window.rentGoFinishLogin(data.user);
          if (state.currentUser.role !== selectedRole) {
            await client.auth.signOut(); state.currentUser = null; render();
            throw new Error('Role akun tidak sesuai pilihan. Pilih role yang benar.');
          }
          toast(`Selamat datang, ${state.currentUser.name}!`, 'success');
        } else {
          const name = document.getElementById('regName').value.trim();
          const phone = document.getElementById('regPhone').value.trim();
          if (!name || !phone) throw new Error('Nama dan nomor WhatsApp wajib diisi.');
          const { data, error } = await client.auth.signUp({
            email, password,
            options: { data: { name, phone, role: selectedRole }, emailRedirectTo: window.location.origin + window.location.pathname }
          });
          if (error) throw error;
          if (data.session && data.user) {
            // Trigger SQL membuat profil secara otomatis. Beri jeda singkat untuk propagasi profil.
            await new Promise(resolve => setTimeout(resolve, 400));
            await window.rentGoFinishLogin(data.user);
            toast('Akun berhasil dibuat!', 'success');
          } else {
            throw new Error('Akun berhasil dibuat, tetapi Supabase masih meminta verifikasi email. Buka Supabase → Authentication → Sign In / Providers → Email, lalu nonaktifkan Confirm email. Setelah itu coba daftar lagi.');
          }
        }
      } else {
        // Fallback demo lokal hanya untuk preview sebelum kredensial Supabase diisi.
        if (mode === 'login') {
          const user = state.users.find(u => u.email === email && u.password === password && u.role === selectedRole);
          if (!user){ toast('Mode lokal: akun tidak ditemukan. Isi konfigurasi Supabase untuk akun online.', 'error'); return; }
          state.currentUser = user; saveState(); toast(`Selamat datang, ${user.name}! (mode lokal)`, 'success'); render();
        } else {
          const name = document.getElementById('regName').value.trim();
          const phone = document.getElementById('regPhone').value.trim();
          if (!name || !phone){ toast('Nama dan nomor WhatsApp wajib diisi', 'error'); return; }
          if (state.users.find(u => u.email === email)){ toast('Email sudah terdaftar', 'error'); return; }
          const newUser = { id: uid('u'), name, email, password, role: selectedRole, phone, balance: 0 };
          state.users.push(newUser); state.currentUser = newUser; saveState(); toast('Akun demo lokal dibuat. Konfigurasi Supabase untuk sinkronisasi antarperangkat.', 'success'); render();
        }
      }
    } catch (error) {
      console.error('[RentGo auth]', error);
      toast(error.message || 'Autentikasi gagal. Periksa konfigurasi Supabase.', 'error');
    } finally {
      submit.disabled = false;
      submit.textContent = originalText;
    }
  };
}
