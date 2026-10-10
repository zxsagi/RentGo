/* RentGo — core */
/* ============================================================
   KONFIGURASI & DATA
   ============================================================ */
const STORAGE_KEY = 'rentgo_v3';
const COMMISSION_RATE = 0.10; // 10% komisi platform (HANYA untuk seller)

const MOTOR_PHOTOS = {
  vario: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&h=600&fit=crop',
  beat: 'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=800&h=600&fit=crop',
  nmax: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop',
  scoopy: 'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&h=600&fit=crop',
  mio: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&h=600&fit=crop',
  pcx: 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&h=600&fit=crop'
};

const SEED_USERS = [
  { id:'u1', name:'Jacob Rental', email:'jacob@rental.com', password:'123456', role:'seller', phone:'0812-1111-2222', balance:0 },
  { id:'u2', name:'Machi Rental', email:'machi@rental.com', password:'123456', role:'seller', phone:'0812-3333-4444', balance:0 },
  { id:'u3', name:'Dwi Rental', email:'dwi@rental.com', password:'123456', role:'seller', phone:'0812-5555-6666', balance:0 },
  { id:'b1', name:'Melliana Hutagalung', email:'meli@student.com', password:'123456', role:'buyer', phone:'0812-6278-7043' },
  { id:'b2', name:'Shena Lestari', email:'shena@student.com', password:'123456', role:'buyer', phone:'0812-7777-8888' }
];

const SEED_MOTORS = [
  { id:'m1', sellerId:'u1', brand:'Honda', name:'Vario 125', year:2022, pricePerHour:10000, pricePerDay:70000,
    location:'Pos 1 UNAI', locationDetail:'Depan gerbang utama kampus', helmIncluded:true, helmCount:2,
    description:'Motor matic nyaman, cocok untuk perjalanan dalam kota. Sudah termasuk 2 helm SNI dan jas hujan.',
    photo:MOTOR_PHOTOS.vario, isOpen:true },
  { id:'m2', sellerId:'u2', brand:'Honda', name:'Beat Street', year:2021, pricePerHour:8000, pricePerDay:60000,
    location:'Pos 2 UNAI', locationDetail:'Samping parkiran fakultas', helmIncluded:true, helmCount:1,
    description:'Motor irit dan ringan, cocok untuk mahasiswa. Termasuk 1 helm dan raincoat.',
    photo:MOTOR_PHOTOS.beat, isOpen:true },
  { id:'m3', sellerId:'u3', brand:'Yamaha', name:'NMAX 155', year:2023, pricePerHour:15000, pricePerDay:100000,
    location:'Gerbang Belakang UNAI', locationDetail:'Dekat kos mahasiswa', helmIncluded:true, helmCount:2,
    description:'Motor premium dengan performa tinggi. Cocok untuk perjalanan jauh. Termasuk 2 helm full-face.',
    photo:MOTOR_PHOTOS.nmax, isOpen:true },
  { id:'m4', sellerId:'u1', brand:'Honda', name:'Scoopy', year:2022, pricePerHour:10000, pricePerDay:70000,
    location:'Pos 1 UNAI', locationDetail:'Depan gerbang utama kampus', helmIncluded:true, helmCount:1,
    description:'Motor retro yang stylish. Cocok untuk jalan-jalan santai. Termasuk 1 helm.',
    photo:MOTOR_PHOTOS.scoopy, isOpen:true },
  { id:'m5', sellerId:'u2', brand:'Yamaha', name:'Mio M3', year:2020, pricePerHour:7000, pricePerDay:50000,
    location:'Pos 2 UNAI', locationDetail:'Samping parkiran fakultas', helmIncluded:false, helmCount:0,
    description:'Motor murah meriah, cocok untuk kebutuhan mendadak. Helm tidak termasuk.',
    photo:MOTOR_PHOTOS.mio, isOpen:true },
  { id:'m6', sellerId:'u3', brand:'Honda', name:'PCX 160', year:2023, pricePerHour:18000, pricePerDay:120000,
    location:'Gerbang Belakang UNAI', locationDetail:'Dekat kos mahasiswa', helmIncluded:true, helmCount:2,
    description:'Motor premium dengan fitur lengkap. Termasuk 2 helm dan sarung tangan.',
    photo:MOTOR_PHOTOS.pcx, isOpen:false }
];

let state = {
  currentUser: null, users: [], motors: [], rentals: [], reviews: [],
  chats: [], notifications: [],
  buyerTab: 'browse', sellerTab: 'dashboard',
  filterStatus: 'all', searchQuery: ''
};

/* ---------- PERSISTENCE ---------- */
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    users: state.users, motors: state.motors, rentals: state.rentals,
    reviews: state.reviews, chats: state.chats, notifications: state.notifications,
    currentUser: state.currentUser
  }));
}
function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw){
    state.users = JSON.parse(JSON.stringify(SEED_USERS));
    state.motors = JSON.parse(JSON.stringify(SEED_MOTORS));
    saveState(); return;
  }
  try {
    const d = JSON.parse(raw);
    state.users = d.users || JSON.parse(JSON.stringify(SEED_USERS));
    state.motors = d.motors || JSON.parse(JSON.stringify(SEED_MOTORS));
    state.rentals = d.rentals || [];
    state.reviews = d.reviews || [];
    state.chats = d.chats || [];
    state.notifications = d.notifications || [];
    state.currentUser = d.currentUser || null;
  } catch(e){
    state.users = JSON.parse(JSON.stringify(SEED_USERS));
    state.motors = JSON.parse(JSON.stringify(SEED_MOTORS));
    state.rentals = []; state.reviews = []; state.chats = []; state.notifications = [];
  }
}

/* ---------- HELPERS ---------- */
function uid(p='id'){ return p + '_' + Date.now() + '_' + Math.random().toString(36).slice(2,7); }
function rupiah(n){ return 'Rp' + Math.round(n).toLocaleString('id-ID'); }
function esc(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function formatTime(ms){
  if (ms < 0) ms = 0;
  const s = Math.floor(ms/1000), h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
function formatDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function timeAgo(iso){
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return m + ' menit lalu';
  const h = Math.floor(m/60);
  if (h < 24) return h + ' jam lalu';
  return Math.floor(h/24) + ' hari lalu';
}
function initials(name){ return name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); }

/* ---------- TOAST ---------- */
function toast(msg, type='info'){
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = { info:'fa-circle-info', success:'fa-circle-check', error:'fa-circle-exclamation', warning:'fa-triangle-exclamation' };
  el.innerHTML = `<i class="fa-solid ${icons[type]||icons.info}"></i><span class="msg">${esc(msg)}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(100%)'; setTimeout(()=>el.remove(), 300); }, 3500);
}

/* ---------- NOTIFICATIONS ---------- */
function pushNotif(userId, type, title, message, rentalId=null){
  const n = { id: uid('n'), userId, type, title, message, rentalId, read: false, createdAt: new Date().toISOString() };
  state.notifications.push(n);
  saveState();
  if (state.currentUser && state.currentUser.id === userId){
    renderNotifBell();
    toast(title, type === 'danger' ? 'error' : type === 'warning' ? 'warning' : 'info');
  }
}
function unreadCount(userId){
  return state.notifications.filter(n => n.userId === userId && !n.read).length;
}
