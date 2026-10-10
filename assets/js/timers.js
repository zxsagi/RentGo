/* RentGo — timers */
/* ============================================================
   TIMER
   ============================================================ */
let timerInterval = null;
function startTimers(){
  if (timerInterval) clearInterval(timerInterval);
  const tick = () => {
    document.querySelectorAll('[data-timer]').forEach(el => {
      const start = new Date(el.dataset.start).getTime();
      const durationMs = parseInt(el.dataset.duration) * 3600 * 1000;
      const remaining = start + durationMs - Date.now();
      const timeEl = el.querySelector('[data-time]');
      if (!timeEl) return;
      if (remaining >= 0){
        timeEl.textContent = formatTime(remaining);
        el.classList.remove('overdue');
      } else {
        timeEl.textContent = formatTime(Math.abs(remaining));
        el.classList.add('overdue');
      }
    });
  };
  tick();
  timerInterval = setInterval(tick, 1000);
}
