/* RentGo — preferensi tema lokal */
function applyRentGoTheme(theme){
  const value=theme==='dark'?'dark':'light';
  document.documentElement.dataset.theme=value;
  try{localStorage.setItem('rentgo_theme',value);}catch(e){}
  document.querySelectorAll('#themeToggle,#rentgoThemeFloat').forEach(btn=>{
    btn.innerHTML=value==='dark'?'<i class="fa-solid fa-sun"></i>':'<i class="fa-solid fa-moon"></i>';
    btn.title=value==='dark'?'Gunakan mode terang':'Gunakan mode gelap';
    btn.setAttribute('aria-label',btn.title);
  });
}
function setupRentGoTheme(){
  let theme='light';try{theme=localStorage.getItem('rentgo_theme')||'light';}catch(e){}
  applyRentGoTheme(theme);
  let floating=document.getElementById('rentgoThemeFloat');
  if(!floating){floating=document.createElement('button');floating.type='button';floating.id='rentgoThemeFloat';floating.className='theme-float';floating.setAttribute('aria-label','Ganti tema');document.body.appendChild(floating);}
  floating.style.display=state.currentUser?'none':'flex';
  floating.onclick=()=>applyRentGoTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
  const headerBtn=document.getElementById('themeToggle');
  if(headerBtn)headerBtn.onclick=()=>applyRentGoTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
}
