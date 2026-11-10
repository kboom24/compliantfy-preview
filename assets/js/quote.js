/* Quote flow: 3 steps, client-side validation, sends nothing. */
(function(){
  var f=document.getElementById('quote');if(!f)return;
  var s=1,back=document.getElementById('q-back'),next=document.getElementById('q-next'),es=document.getElementById('err-sum'),el=document.getElementById('err-list');
  var p=new URLSearchParams(location.search);if(p.get('url'))document.getElementById('q-url').value=p.get('url');
  function show(n,focus){s=n;f.querySelectorAll('[data-step]').forEach(function(d){d.hidden=d.getAttribute('data-step')!==String(n);});
    document.querySelectorAll('#stepper li').forEach(function(li){var k=+li.getAttribute('data-s');if(k===n)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');li.classList.toggle('done',k<n);});
    back.hidden=n===1;next.textContent=n===3?'Request my quote':'Continue';
    var h=f.querySelector('[data-step="'+n+'"] .step-h');if(h&&focus)h.focus();}
  function validate(){var bad=[];
    f.querySelectorAll('[data-step="'+s+'"] [required]').forEach(function(i){
      var v=i.value.trim(),ok=!!v&&(i.type!=='email'||/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v));
      var old=document.getElementById(i.id+'-err');if(old)old.remove();
      if(!ok){var lab=f.querySelector('label[for="'+i.id+'"]').textContent.trim().toLowerCase();
        var e=document.createElement('p');e.className='err';e.id=i.id+'-err';e.textContent=(v?'Enter a valid ':'Enter your ')+lab;
        i.after(e);i.setAttribute('aria-invalid','true');i.setAttribute('aria-describedby',e.id);bad.push([i.id,e.textContent]);}
      else{i.removeAttribute('aria-invalid');i.removeAttribute('aria-describedby');}});
    el.textContent='';bad.forEach(function(b){var li=document.createElement('li'),a=document.createElement('a');a.href='#'+b[0];a.textContent=b[1];li.appendChild(a);el.appendChild(li);});
    es.hidden=!bad.length;if(bad.length)es.focus();return !bad.length;}
  back.addEventListener('click',function(){es.hidden=true;show(s-1,true);});
  f.addEventListener('submit',function(e){e.preventDefault();if(!validate())return;
    if(s<3){show(s+1,true);return;}
    f.hidden=true;document.getElementById('stepper').hidden=true;var d=document.getElementById('q-done');d.hidden=false;d.focus();});
  var st=+p.get('step');if(st>1&&st<4)show(st,false);
})();
