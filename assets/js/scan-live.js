/* Scan screen driver: real scanner when CF.apiBase() is set and reachable, labeled demo playback otherwise. */
(function(){
  var p=new URLSearchParams(location.search),eu=CF.euOn(),target=p.get('url')||'';
  var bar=document.querySelector('.ex-bar'),live=document.getElementById('scan-live'),lead=document.querySelector('.phero .lead');
  function setSite(t){document.querySelectorAll('[data-r=site]').forEach(function(e){e.textContent=t;});}
  function demo(why){
    if(bar){bar.hidden=false;bar.textContent=why;}
    CF.load({sample:true}).then(function(r){r=JSON.parse(JSON.stringify(r));setSite(CF.site(r));CF.demoScan(r,{eu:eu});});
  }
  function fail(msg){
    document.getElementById('scan-status').textContent='Scan stopped';
    if(lead)lead.textContent=msg;live.textContent=msg;
    var d=document.getElementById('scan-done');d.hidden=false;d.querySelector('h2').textContent='We couldn\u2019t finish this scan.';
    d.querySelector('p').textContent=msg;var a=d.querySelector('a');a.textContent='Try another address';a.href='index.html#scan';
  }
  var api=CF.apiBase();
  if(!api){demo('Demo: the scanner isn\u2019t connected on this preview. This screen plays back EXAMPLE results.');return;}
  if(!target){demo('Demo: no website address was given. This screen plays back EXAMPLE results.');return;}
  setSite(target.replace(/^https?:\/\//,''));
  if(bar)bar.hidden=true;
  CF.startScan(target,eu).then(function(start){
    if(start.error){fail(start.error.message||'That address can\u2019t be scanned.');return;}
    var id=start.id,half=false,t0=Date.now();
    (function tick(){
      CF.fetchScan(id).then(function(r){
        CF.renderScan(r,{eu:eu});
        if(r.progress&&lead&&r.scan.status==='running')lead.textContent=r.progress.stage+'\u2026 Keep this tab open.';
        if(!half&&r.progress&&r.progress.pct>=50){half=true;live.textContent='Halfway. '+document.getElementById('scan-found').textContent+' issues found so far.';}
        if(r.scan.status==='complete'){
          try{sessionStorage.setItem('cf_scan_'+id,JSON.stringify(r));}catch(x){}
          var d=document.getElementById('scan-done');d.hidden=false;
          d.querySelector('a').href='report.html?scan='+encodeURIComponent(id)+(eu?'&eu=1':'')+(p.get('api')?'&api='+encodeURIComponent(p.get('api')):'');
          document.getElementById('scan-status').textContent='Scan complete';
          var h=document.getElementById('scan-h');if(h)h.firstChild.textContent='Scanned ';
          if(lead)lead.textContent='Done in '+Math.round((Date.now()-t0)/1000)+' seconds. Your report is ready below.';
          live.textContent='Scan complete. '+r.summary.totalIssues+' issues found. Your report is ready.';
          return;
        }
        if(r.scan.status==='failed'){fail((r.error&&r.error.message)||'The scan stopped.');return;}
        if(Date.now()-t0>180000){fail('The scan is taking too long. Try again in a few minutes.');return;}
        setTimeout(tick,1500);
      }).catch(function(){setTimeout(tick,3000);});
    })();
  }).catch(function(){demo('Demo: the scanner couldn\u2019t be reached just now, so this screen plays back EXAMPLE results.');});
})();
