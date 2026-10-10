/* RentGo — reviews */
/* ============================================================
   REVIEW
   ============================================================ */
function openReviewModal(rentalId){
  const r = state.rentals.find(x => x.id === rentalId);
  if (!r) return;
  const motor = state.motors.find(m => m.id === r.motorId);
  let rating = 5;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>Beri Rating & Ulasan</h3><button class="modal-close"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="modal-body">
        <div style="text-align:center;margin-bottom:20px">
          <div class="section-title">Bagaimana pengalamanmu?</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:16px">${esc(motor?.name||'Motor')}</div>
          <div class="stars" id="starPicker" style="justify-content:center">
            ${[1,2,3,4,5].map(n => `<i class="fa-solid fa-star active" data-star="${n}"></i>`).join('')}
          </div>
          <div style="margin-top:8px;font-size:13px;color:var(--muted)" id="ratingText">Sangat Baik (5/5)</div>
        </div>
        <div class="form-group"><label>Komentar (opsional)</label><textarea id="reviewComment" rows="4" placeholder="Ceritakan pengalamanmu menggunakan motor ini..."></textarea></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary modal-close-btn">Batal</button><button class="btn btn-primary" id="submitReview">Kirim Ulasan</button></div>
    </div>
  `;
  document.body.appendChild(overlay);
  const ratingTexts = { 1:'Sangat Buruk (1/5)', 2:'Buruk (2/5)', 3:'Cukup (3/5)', 4:'Baik (4/5)', 5:'Sangat Baik (5/5)' };
  overlay.querySelectorAll('.modal-close, .modal-close-btn').forEach(b => b.onclick = () => overlay.remove());
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  overlay.querySelectorAll('#starPicker i').forEach(star => {
    star.onclick = () => {
      rating = parseInt(star.dataset.star);
      overlay.querySelectorAll('#starPicker i').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.star) <= rating);
      });
      document.getElementById('ratingText').textContent = ratingTexts[rating];
    };
  });
  document.getElementById('submitReview').onclick = () => {
    const comment = document.getElementById('reviewComment').value.trim();
    const review = { id: uid('rv'), rentalId, motorId: r.motorId, buyerId: state.currentUser.id, sellerId: r.sellerId, rating, comment: comment || 'Tidak ada komentar.', createdAt: new Date().toISOString() };
    state.reviews.push(review); saveState();
    pushNotif(r.sellerId, 'review', 'Ulasan Baru', `${state.currentUser.name} memberi rating ${rating}/5 untuk ${motor?.name||'motor'}.`, r.id);
    toast('Terima kasih atas ulasanmu!', 'success');
    overlay.remove(); render();
  };
}

function getMotorRating(motorId){
  const reviews = state.reviews.filter(r => r.motorId === motorId);
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const avg = reviews.reduce((s,r) => s + r.rating, 0) / reviews.length;
  return { avg, count: reviews.length };
}
