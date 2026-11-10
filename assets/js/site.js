/* Compliantfy site behaviour. Vanilla JS, no dependencies. Nothing here sends data anywhere. */
(function(){
  document.documentElement.classList.add('js');
  // Mobile nav
  var t=document.querySelector('.nav-toggle'),n=document.getElementById('site-nav');
  if(t&&n){n.setAttribute('data-open','false');t.addEventListener('click',function(){var o=t.getAttribute('aria-expanded')==='true';t.setAttribute('aria-expanded',String(!o));n.setAttribute('data-open',String(!o));});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&t.getAttribute('aria-expanded')==='true'){t.click();t.focus();}});}
  // Ticker pause/play (WCAG 2.2.2)
  document.querySelectorAll('.ticker').forEach(function(tk){var b=tk.querySelector('.ticker-btn');if(!b)return;
    b.addEventListener('click',function(){var p=tk.getAttribute('data-paused')==='true';tk.setAttribute('data-paused',String(!p));b.setAttribute('aria-pressed',String(!p));b.textContent=p?'Pause':'Play';});});
  // Scan forms: validate and go to scan.html (no network request)
  document.querySelectorAll('form[data-scan-form]').forEach(function(f){
    f.addEventListener('submit',function(e){e.preventDefault();
      var i=f.querySelector('input[name=url]'),err=f.querySelector('.field-err'),v=(i.value||'').trim();
      var ok=/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v);
      if(!ok){i.setAttribute('aria-invalid','true');err.hidden=false;err.textContent='Enter a website address like yourwebsite.com';i.focus();return;}
      i.removeAttribute('aria-invalid');err.hidden=true;
      var eu=f.querySelector('input[name=eu]');
      location.href='scan.html?url='+encodeURIComponent(v.replace(/^https?:\/\//i,''))+(eu&&eu.checked?'&eu=1':'');
    });});
})();
