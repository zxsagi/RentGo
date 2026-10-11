/* RentGo — Supabase Auth (email/password) */
function renderAuth(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-left"><div class="auth-logo"><i class="fa-solid fa-motorcycle"></i> RentGo</div>
        <div class="auth-hero"><h1>Sewa motor jadi lebih mudah & cepat.</h1><p>Platform rental motor terpercaya untuk mahasiswa dan warga sekitar kampus. Booking online, motor siap pakai.</p></div>
        <div class="auth-features"><div class="auth-feature"><i class="fa-solid fa-clock"></i> Timer real-time setelah motor diambil</div><div class="auth-feature"><i class="fa-solid fa-comments"></i> Chat langsung dengan penyedia</div><div class="auth-feature"><i class="fa-solid fa-star"></i> Rating & review</div><div class="auth-feature"><i class="fa-solid fa-shield-halved"></i> Akun aman</div></div>
      </div>
      <div class="auth-right"><div class="auth-form">
        <h2 id="authTitle">Masuk ke RentGo</h2><p class="sub" id="authSub">Silakan login untuk melanjutkan</p>
        <div class="role-select" id="roleSelect"><div class="role-option active" data-role="buyer"><i class="fa-solid fa-user"></i><span>Penyewa</span></div><div class="role-option" data-role="seller"><i class="fa-solid fa-store"></i><span>Penyedia</span></div></div>
        <div id="registerFields" class="hidden"><div class="form-group"><label>Nama Lengkap</label><input type="text" id="regName" placeholder="Nama kamu" autocomplete="name"></div><div class="form-group"><label>No. WhatsApp</label><input type="tel" id="regPhone" placeholder="0812-xxxx-xxxx" autocomplete="tel"></div>
        <div id="sellerBankFields" class="seller-bank-fields hidden">
          <div class="bank-section-heading"><span class="bank-icon"><i class="fa-solid fa-building-columns"></i></span><div><strong>Informasi Rekening</strong><small>Untuk pencairan pendapatan rental</small></div></div>
          <div class="form-group"><label>Nama Bank</label><select id="regBank"><option value="">Pilih bank</option><option>BCA</option><option>Bank Mandiri</option><option>BNI</option><option>BRI</option><option>BSI</option><option>BTN</option><option>CIMB Niaga</option><option>Bank Danamon</option><option>PermataBank</option><option>Bank Jago</option><option>SeaBank</option><option>Bank Neo Commerce</option><option>Bank lainnya</option></select></div>
          <div class="form-group"><label>Nomor Rekening</label><input type="text" id="regAccountNumber" inputmode="numeric" maxlength="30" placeholder="Masukkan nomor rekening"></div>
          <div class="form-group"><label>Nama Pemilik Rekening</label><input type="text" id="regAccountName" maxlength="100" placeholder="Sesuai nama di buku rekening"></div>
          <p class="bank-note"><i class="fa-solid fa-lock"></i> Data rekening digunakan untuk kebutuhan pembayaran RentGo.</p>
        </div></div>
        <div class="form-group"><label>Email</label><input type="email" id="authEmail" placeholder="nama@email.com" autocomplete="email"></div>
        <div class="form-group"><label>Password</label><div class="rg-password-wrap"><input type="password" id="authPassword" placeholder="Minimal 6 karakter" autocomplete="current-password"><button type="button" class="rg-password-toggle" id="toggleAuthPassword" aria-label="Tampilkan password"><i class="fa-regular fa-eye"></i></button></div></div>
        <button class="btn btn-primary btn-block" id="authSubmit">Masuk</button><div id="authMessage" role="status" style="margin-top:12px;font-size:13px"></div>
        <div class="auth-switch"><span id="switchText">Belum punya akun?</span> <a id="switchBtn">Daftar sekarang</a></div>
      </div></div>
    </div>`;
  let mode='login', selectedRole='buyer';
  const supabaseClient = window.rentGoSupabase;
  const message = (text, isError=true) => { const el=document.getElementById('authMessage'); if(el){el.textContent=text;el.style.color=isError?'#dc2626':'#15803d';} };
  document.querySelectorAll('.role-option').forEach(opt=>opt.onclick=()=>{document.querySelectorAll('.role-option').forEach(o=>o.classList.remove('active'));opt.classList.add('active');selectedRole=opt.dataset.role;const bankFields=document.getElementById('sellerBankFields');if(bankFields)bankFields.classList.toggle('hidden',!(mode==='register'&&selectedRole==='seller'));});
  document.getElementById('toggleAuthPassword').onclick=()=>{const input=document.getElementById('authPassword');const visible=input.type==='password';input.type=visible?'text':'password';document.getElementById('toggleAuthPassword').innerHTML=visible?'<i class="fa-regular fa-eye-slash"></i>':'<i class="fa-regular fa-eye"></i>';document.getElementById('toggleAuthPassword').setAttribute('aria-label',visible?'Sembunyikan password':'Tampilkan password');};
  document.getElementById('switchBtn').onclick=()=>{mode=mode==='login'?'register':'login';const reg=document.getElementById('registerFields');reg.classList.toggle('hidden',mode!=='register');document.getElementById('sellerBankFields')?.classList.toggle('hidden',!(mode==='register'&&selectedRole==='seller'));document.getElementById('authTitle').textContent=mode==='register'?'Daftar Akun Baru':'Masuk ke RentGo';document.getElementById('authSub').textContent=mode==='register'?'Buat akun untuk mulai menggunakan RentGo':'Silakan login untuk melanjutkan';document.getElementById('authSubmit').textContent=mode==='register'?'Daftar':'Masuk';document.getElementById('switchText').textContent=mode==='register'?'Sudah punya akun?':'Belum punya akun?';document.getElementById('switchBtn').textContent=mode==='register'?'Masuk di sini':'Daftar sekarang';document.getElementById('authPassword').autocomplete=mode==='register'?'new-password':'current-password';message('');};
  async function getProfile(user, fallback={}){
    let profile=null;
    const {data,error}=await supabaseClient.from('profiles').select('id, full_name, phone, role, avatar_url, bank_name, bank_account_number, bank_account_name').eq('id',user.id).maybeSingle();
    if(!error && data) profile=data;
    else if(error) console.warn('[RentGo auth] profil tidak bisa dibaca:',error.message);
    const meta=user.user_metadata||{};
    return {id:user.id,name:profile?.full_name||meta.full_name||meta.name||fallback.name||user.email?.split('@')[0]||'Pengguna',email:user.email,role:profile?.role||meta.role||fallback.role||'buyer',phone:profile?.phone||meta.phone||fallback.phone||'',avatarUrl:profile?.avatar_url||meta.avatar_url||fallback.avatarUrl||'',bankName:profile?.bank_name||meta.bank_name||fallback.bankName||'',bankAccountNumber:profile?.bank_account_number||meta.bank_account_number||fallback.bankAccountNumber||'',bankAccountName:profile?.bank_account_name||meta.bank_account_name||fallback.bankAccountName||'',balance:0};
  }
  document.getElementById('authSubmit').onclick=async()=>{
    const btn=document.getElementById('authSubmit');const email=document.getElementById('authEmail').value.trim().toLowerCase();const password=document.getElementById('authPassword').value;
    if(!email||!password){message('Email dan password wajib diisi.');return;}
    if(!supabaseClient){message('Supabase belum terhubung. Periksa URL dan publishable/anon key di assets/js/supabase-config.js.');return;}
    if(mode==='register'){
      const name=document.getElementById('regName').value.trim(),phone=document.getElementById('regPhone').value.trim();
      const bankName=selectedRole==='seller'?document.getElementById('regBank').value:'';
      const bankAccountNumber=selectedRole==='seller'?document.getElementById('regAccountNumber').value.trim():'';
      const bankAccountName=selectedRole==='seller'?document.getElementById('regAccountName').value.trim():'';
      if(!name||!phone){message('Nama lengkap dan nomor WhatsApp wajib diisi.');return;}
      if(selectedRole==='seller'&&(!bankName||!bankAccountNumber||!bankAccountName)){message('Lengkapi nama bank, nomor rekening, dan nama pemilik rekening.');return;}
      if(selectedRole==='seller'&&!/^[0-9\s-]{5,30}$/.test(bankAccountNumber)){message('Nomor rekening harus berisi angka (boleh dipisah spasi atau tanda hubung).');return;}
      if(password.length<6){message('Password minimal 6 karakter.');return;}
      btn.disabled=true;btn.textContent='Mendaftarkan...';
      try{
        const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{full_name:name,phone,role:selectedRole,bank_name:bankName,bank_account_number:bankAccountNumber,bank_account_name:bankAccountName}}});
        if(error) throw error;
        const user=data.user;
        if(!user) throw new Error('Supabase tidak mengembalikan data pengguna.');
        if(data.session){
          const {error:profileError}=await supabaseClient.from('profiles').upsert({id:user.id,full_name:name,phone,role:selectedRole,bank_name:bankName||null,bank_account_number:bankAccountNumber||null,bank_account_name:bankAccountName||null,updated_at:new Date().toISOString()},{onConflict:'id'});
          if(profileError) console.warn('[RentGo auth] profil belum tersimpan:',profileError.message);
          state.currentUser=await getProfile(user,{name,phone,role:selectedRole,bankName,bankAccountNumber,bankAccountName});saveState();toast('Akun berhasil dibuat!','success');render();
        }else{
          message('Akun dibuat, tetapi Supabase masih meminta konfirmasi email. Matikan Confirm email di Authentication → Sign In / Providers → Email, lalu daftar ulang atau login.',false);
        }
      }catch(e){message(e.message||'Pendaftaran gagal.');}
      finally{btn.disabled=false;btn.textContent=mode==='register'?'Daftar':'Masuk';}
    }else{
      btn.disabled=true;btn.textContent='Memeriksa...';
      try{
        const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});if(error)throw error;
        const user=data.user;if(!user)throw new Error('Pengguna tidak ditemukan.');
        const appUser=await getProfile(user);
        // Peran akun mengikuti profil yang tersimpan di server, bukan pilihan UI login.
        state.currentUser=appUser;saveState();toast(`Selamat datang, ${appUser.name}!`,'success');render();
      }catch(e){message(e.message||'Login gagal. Periksa email dan password.');}
      finally{btn.disabled=false;btn.textContent=mode==='register'?'Daftar':'Masuk';}
    }
  };
}
