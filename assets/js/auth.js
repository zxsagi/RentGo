
/* RentGo — Auth dengan Supabase dan tombol lihat password */

async function renderAuth() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-left">
        <div class="auth-logo">
          <i class="fa-solid fa-motorcycle"></i> RentGo
        </div>
        <div class="auth-hero">
          <h1>Sewa motor jadi lebih mudah & cepat.</h1>
          <p>Platform rental motor terpercaya untuk mahasiswa dan warga sekitar kampus. Booking online, motor siap pakai.</p>
        </div>
        <div class="auth-features">
          <div class="auth-feature"><i class="fa-solid fa-clock"></i> Timer real-time setelah motor diambil</div>
          <div class="auth-feature"><i class="fa-solid fa-comments"></i> Chat langsung dengan penyedia</div>
          <div class="auth-feature"><i class="fa-solid fa-star"></i> Rating & review terverifikasi</div>
          <div class="auth-feature"><i class="fa-solid fa-shield-halved"></i> Pembayaran aman & escrow</div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form">
          <h2 id="authTitle">Masuk ke RentGo</h2>
          <p class="sub" id="authSub">Silakan login untuk melanjutkan</p>

          <div class="role-select" id="roleSelect">
            <div class="role-option active" data-role="buyer">
              <i class="fa-solid fa-user"></i><span>Penyewa</span>
            </div>
            <div class="role-option" data-role="seller">
              <i class="fa-solid fa-store"></i><span>Penyedia</span>
            </div>
          </div>

          <div id="registerFields" class="hidden">
            <div class="form-group">
              <label>Nama Lengkap</label>
              <input type="text" id="regName" placeholder="Nama kamu" autocomplete="name">
            </div>
            <div class="form-group">
              <label>No. WhatsApp</label>
              <input type="tel" id="regPhone" placeholder="0812-xxxx-xxxx" autocomplete="tel">
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="authEmail"
              placeholder="nama@email.com" autocomplete="email">
          </div>

          <div class="form-group">
            <label for="authPassword">Password</label>
            <div class="rg-password-wrap">
              <input type="password" id="authPassword"
                placeholder="Minimal 6 karakter"
                autocomplete="current-password">
              <button type="button" id="togglePassword"
                class="rg-password-toggle"
                aria-label="Tampilkan password"
                aria-pressed="false">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>

          <div id="authError" role="alert"
            style="display:none;color:#dc2626;font-size:13px;margin:10px 0">
          </div>

          <button class="btn btn-primary btn-block" id="authSubmit">
            Masuk
          </button>

          <div class="auth-switch">
            <span id="switchText">Belum punya akun?</span>
            <a href="#" id="switchBtn">Daftar sekarang</a>
          </div>
        </div>
      </div>
    </div>
  `;

  const supabaseClient = window.rentGoSupabase;

  let mode = 'login';
  let selectedRole = 'buyer';

  const $ = id => document.getElementById(id);
  const submitBtn = $('authSubmit');
  const switchBtn = $('switchBtn');
  const passwordInput = $('authPassword');
  const togglePassword = $('togglePassword');
  const errorBox = $('authError');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }

  if (!supabaseClient) {
    showError(
      'Supabase belum terhubung. Periksa URL dan publishable/anon key di supabase-config.js.'
    );
    submitBtn.disabled = true;
    return;
  }

  // Pilih peran.
  document.querySelectorAll('.role-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.role-option').forEach(item => {
        item.classList.remove('active');
      });

      option.classList.add('active');
      selectedRole = option.dataset.role;
      clearError();
    });
  });

  // Tampilkan atau sembunyikan password.
  togglePassword.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';

    passwordInput.type = showing ? 'password' : 'text';
    togglePassword.innerHTML = showing
      ? '<i class="fa-solid fa-eye"></i>'
      : '<i class="fa-solid fa-eye-slash"></i>';

    togglePassword.setAttribute(
      'aria-label',
      showing ? 'Tampilkan password' : 'Sembunyikan password'
    );
    togglePassword.setAttribute('aria-pressed', String(!showing));
  });

  // Pindah antara login dan daftar.
  switchBtn.addEventListener('click', event => {
    event.preventDefault();
    mode = mode === 'login' ? 'register' : 'login';

    $('registerFields').classList.toggle('hidden', mode !== 'register');
    $('authTitle').textContent = mode === 'register'
      ? 'Daftar Akun Baru' : 'Masuk ke RentGo';
    $('authSub').textContent = mode === 'register'
      ? 'Buat akun untuk mulai menggunakan RentGo'
      : 'Silakan login untuk melanjutkan';
    submitBtn.textContent = mode === 'register' ? 'Daftar' : 'Masuk';
    $('switchText').textContent = mode === 'register'
      ? 'Sudah punya akun?' : 'Belum punya akun?';
    switchBtn.textContent = mode === 'register'
      ? 'Masuk di sini' : 'Daftar sekarang';

    passwordInput.autocomplete = mode === 'register'
      ? 'new-password' : 'current-password';

    clearError();
  });

  // Proses login dan pendaftaran.
  submitBtn.addEventListener('click', async () => {
    clearError();

    const email = $('authEmail').value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Email dan password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      showError('Password minimal 6 karakter.');
      return;
    }

    let name = '';
    let phone = '';

    if (mode === 'register') {
      name = $('regName').value.trim();
      phone = $('regPhone').value.trim();

      if (!name || !phone) {
        showError('Nama lengkap dan nomor WhatsApp wajib diisi.');
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'register'
      ? 'Mendaftarkan...' : 'Memproses...';

    try {
      let authData;
      let authError;

      if (mode === 'register') {
        // Buat akun sungguhan di Supabase Auth.
        const result = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone,
              role: selectedRole
            }
          }
        });

        authData = result.data;
        authError = result.error;

        if (authError) throw authError;

        // Jika konfirmasi email masih aktif, session bisa null.
        if (!authData.session || !authData.user) {
          showError(
            'Akun sudah dikirim ke Supabase, tetapi belum bisa langsung masuk. ' +
            'Nonaktifkan Confirm email di pengaturan Supabase Auth, lalu coba lagi.'
          );
          return;
        }
      } else {
        // Login menggunakan email dan password Supabase Auth.
        const result = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        authData = result.data;
        authError = result.error;

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Supabase tidak mengembalikan data pengguna.');
        }
      }

      const authUser = authData.user;
      const metadata = authUser.user_metadata || {};

      // Saat login, ambil profil dari database.
      let profile = null;

      const profileResult = await supabaseClient
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileResult.error) {
        throw new Error(
          'Gagal mengambil profil pengguna: ' + profileResult.error.message
        );
      }

      profile = profileResult.data;

      // Saat daftar, simpan profil. Saat login, pulihkan profil jika belum ada.
      if (!profile) {
        const profileData = {
          id: authUser.id,
          full_name: name || metadata.full_name || email.split('@')[0],
          phone: phone || metadata.phone || '',
          role: selectedRole
        };

        const saved = await supabaseClient
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' })
          .select('id, full_name, phone, role')
          .single();

        if (saved.error) {
          throw new Error(
            'Akun berhasil diautentikasi, tetapi profil gagal disimpan: ' +
            saved.error.message
          );
        }

        profile = saved.data;
      }

      // Peran berasal dari profil database, bukan pilihan dropdown saat login.
      if (profile.role !== selectedRole) {
        await supabaseClient.auth.signOut();
        throw new Error(
          'Peran akun ini adalah ' +
          (profile.role === 'seller' ? 'Penyedia' : 'Penyewa') +
          '. Silakan pilih peran yang sesuai.'
        );
      }

      const user = {
        id: authUser.id,
        name: profile.full_name || metadata.full_name || email.split('@')[0],
        email: authUser.email || email,
        role: profile.role,
        phone: profile.phone || '',
        balance: 0
      };

      // Simpan profil lokal untuk komponen RentGo yang masih membutuhkannya.
      state.users = (state.users || []).filter(
        item => String(item.id) !== String(user.id)
      );
      state.users.push(user);
      state.currentUser = user;
      saveState();

      toast(
        mode === 'register'
          ? 'Akun berhasil dibuat!'
          : `Selamat datang, ${user.name}!`,
        'success'
      );

      render();
    } catch (error) {
      console.error('[RentGo Auth]', error);

      const message = error.message || 'Terjadi kesalahan yang tidak diketahui.';

      if (/invalid login credentials/i.test(message)) {
        showError('Email atau password salah.');
      } else if (/already registered/i.test(message)) {
        showError('Email sudah terdaftar. Silakan masuk.');
      } else if (/profiles/i.test(message) && /permission|policy|denied/i.test(message)) {
        showError(
          'Tidak dapat mengakses profil. Periksa tabel profiles dan kebijakan RLS Supabase.'
        );
      } else {
        showError(message);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'register' ? 'Daftar' : 'Masuk';
    }
  });
}
