/* Compliantfy results renderer. Vanilla JS.
 * Data source: a "results object" matching /data/results.schema.json.
 * Load order: window.CF_RESULTS (if a scanner injects it) -> fetch(?results=URL or data/sample-results.json)
 *   -> window.CF_SAMPLE_RESULTS (file:// fallback from data/sample-results.js).
 * Public API (window.CF):
 *   CF.load() -> Promise<results>
 *   CF.renderScan(results, {eu:boolean})  : re-render progress from check statuses (call on every poll)
 *   CF.renderReport(results, {eu:boolean, unlocked:boolean})
 * All text is inserted with textContent (no HTML injection from scanner data). */
(function(){
  var CF=window.CF={};
  var SEV=['critical','high','medium','low'];
  var LEVELS=[['low',0,29],['elevated',30,59],['high',60,84],['critical',85,100]];
  function qs(n){return new URLSearchParams(location.search).get(n);}
  function el(tag,attrs,kids){var e=document.createElement(tag);if(attrs)for(var k in attrs){if(k==='text')e.textContent=attrs[k];else if(k==='class')e.className=attrs[k];else e.setAttribute(k,attrs[k]);}
    (kids||[]).forEach(function(c){if(c==null)return;e.appendChild(typeof c==='string'?document.createTextNode(c):c);});return e;}
  CF.el=el;
  CF.exposureFor=function(v){for(var i=0;i<LEVELS.length;i++)if(v>=LEVELS[i][1]&&v<=LEVELS[i][2])return LEVELS[i][0];return 'critical';};
  CF.load=function(){
    if(window.CF_RESULTS)return Promise.resolve(window.CF_RESULTS);
    var src=qs('results')||'data/sample-results.json';
    return fetch(src,{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json();})
      .catch(function(){if(window.CF_SAMPLE_RESULTS)return window.CF_SAMPLE_RESULTS;throw new Error('No results data');});
  };
  CF.euOn=function(){return qs('eu')==='1';};
  CF.site=function(r){var u=qs('url');return u||String(r.scan.url).replace(/^https?:\/\//,'');};
  var ICON={pass:'✓',fail:'!',warn:'!',queued:'',running:'',skipped:'–'};
  var STXT={pass:'Passed',fail:'Issues found',warn:'Needs review',queued:'Queued',running:'Checking…',skipped:'Skipped'};
  function checkRow(c){
    return el('li',{'data-status':c.status},[
      el('span',{class:'st st-'+c.status,'aria-hidden':'true',text:ICON[c.status]||''}),
      el('span',null,[c.label,el('span',{class:'vh',text:' : '+(STXT[c.status]||c.status)})]),
      el('span',{class:'tag-std',text:c.status==='fail'||c.status==='warn'?(c.issues+' '+(c.issues===1?'issue':'issues')):(STXT[c.status]||'')})]);
  }
  /* Scan-in-progress */
  CF.renderScan=function(r,o){
    o=o||{};var us=r.checks.filter(function(c){return c.region==='US';}),eu=r.checks.filter(function(c){return c.region==='EU';});
    var L=document.getElementById('us-checks');L.textContent='';us.forEach(function(c){L.appendChild(checkRow(c));});
    var EM=document.getElementById('eu-module');
    if(EM){EM.hidden=!o.eu;var EL=document.getElementById('eu-checks');EL.textContent='';eu.forEach(function(c){EL.appendChild(checkRow(o.eu?c:Object.assign({},c,{status:'skipped'})));});}
    var all=o.eu?us.concat(eu):us,done=all.filter(function(c){return['pass','fail','warn','skipped'].indexOf(c.status)>-1;}).length;
    var pct=Math.round(done/all.length*100),bar=document.getElementById('scan-bar');
    bar.querySelector('i').style.width=pct+'%';bar.setAttribute('aria-valuenow',String(pct));
    document.getElementById('scan-pct').textContent=pct+'% · '+done+' of '+all.length+' checks';
    var found=all.reduce(function(s,c){return s+((c.status==='fail'||c.status==='warn')?c.issues:0);},0);
    document.getElementById('scan-found').textContent=String(found);
    return {done:done,total:all.length,pct:pct};
  };
  /* Demo driver: simulates a scanner by revealing the final statuses one check at a time. Remove when wired to a real scanner. */
  CF.demoScan=function(r,o){
    var finals=r.checks.map(function(c){return c.status;});
    var list=r.checks.filter(function(c){return o.eu||c.region==='US';});
    r.checks.forEach(function(c){c.status='queued';});
    var i=0,freeze=parseInt(qs('freeze')||'',10),live=document.getElementById('scan-live');
    function step(){
      if(i>0){var p=list[i-1];p.status=finals[r.checks.indexOf(p)];}
      if(i<list.length)list[i].status='running';
      var s=CF.renderScan(r,o);
      if(i===Math.ceil(list.length/2))live.textContent='Halfway. '+document.getElementById('scan-found').textContent+' issues found so far.';
      if(i>=list.length){finish();return;}
      i++;
      if(!isNaN(freeze)&&i>freeze)return;
      setTimeout(step,650);
    }
    function finish(){
      var d=document.getElementById('scan-done');d.hidden=false;
      var a=d.querySelector('a');a.href='report.html?url='+encodeURIComponent(CF.site(r))+(o.eu?'&eu=1':'');
      live.textContent='Scan complete. '+document.getElementById('scan-found').textContent+' issues found. Your report is ready.';
      document.getElementById('scan-status').textContent='Scan complete';var h=document.getElementById('scan-h');if(h)h.firstChild.textContent='Scanned ';var ld=document.querySelector('.phero .lead');if(ld)ld.textContent='Done. Your report is ready below.';
    }
    step();
  };
  /* Report */
  function issueCard(x,idx){
    var head=el('div',{class:'issue-hd'},[el('div',null,[el('span',{class:'sev sev-'+x.severity,text:x.severity}),' ',el('span',{class:'tag-std',text:x.standard||''})]),
      el('span',{class:'tag-std',text:(x.occurrences||1)+'× · fix effort: '+(x.effort||'n/a')})]);
    var dl=el('dl',null,[el('div',null,[el('dt',{text:'In plain English'}),el('dd',{text:x.plainEnglish})]),
      el('div',null,[el('dt',{class:'r',text:'Why this gets you sued'}),el('dd',{text:x.whySued})]),
      el('div',null,[el('dt',{text:'How to fix it'}),el('dd',{text:x.howToFix})])]);
    return el('article',{class:'issue sv-'+x.severity,'aria-labelledby':'iss-'+x.id},[head,el('h3',{id:'iss-'+x.id,text:(idx+1)+'. '+x.title}),dl,
      (x.where&&x.where.length)?el('p',{class:'meta',text:'Where: '+x.where.join('  ·  ')}):null]);
  }
  CF.renderReport=function(r,o){
    o=o||{};var lvl=r.score.exposure||CF.exposureFor(r.score.value);
    document.querySelectorAll('[data-r=site]').forEach(function(e){e.textContent=CF.site(r);});
    document.getElementById('r-score').textContent=String(r.score.value);
    document.querySelectorAll('[data-r=level]').forEach(function(e){e.textContent=lvl.charAt(0).toUpperCase()+lvl.slice(1);});
    document.getElementById('r-disc').textContent=r.score.disclaimer;
    var li=['low','elevated','high','critical'].indexOf(lvl);
    document.querySelectorAll('.exp-meter span').forEach(function(s,i){s.classList.toggle('on',i<=li);});
    document.querySelectorAll('.exp-labels span').forEach(function(s,i){s.classList.toggle('cur',i===li);});
    document.getElementById('r-total').textContent=String(r.summary.totalIssues);
    var sv=document.getElementById('r-sev');sv.textContent='';
    SEV.forEach(function(s){sv.appendChild(el('span',{class:'sevchip '+s[0]},[el('b',{text:String(r.summary.bySeverity[s]||0)}),s]));});
    var cg=document.getElementById('r-cats');cg.textContent='';
    r.summary.byCategory.forEach(function(c){cg.appendChild(el('div',{class:'catcard '+c.status},[el('span',{class:'s '+c.status,text:c.status==='fail'?'Issues found':c.status==='warn'?'Needs review':'Passed'}),
      el('div',{class:'n',text:String(c.issues)}),el('p',{text:c.label})]));});
    var us=r.issues.filter(function(x){return x.region==='US';}).sort(function(a,b){return SEV.indexOf(a.severity)-SEV.indexOf(b.severity);});
    var free=(r.gate&&r.gate.freeIssueCount)||3,open=document.getElementById('r-open'),lock=document.getElementById('r-locked');
    open.textContent='';lock.textContent='';
    us.slice(0,o.unlocked?us.length:free).forEach(function(x,i){open.appendChild(issueCard(x,i));});
    var rest=us.slice(free);document.getElementById('r-locked-count').textContent=String(rest.length);
    var lw=document.getElementById('locked-wrap');
    if(o.unlocked||!rest.length){lw.hidden=true;}else{lw.hidden=false;rest.slice(0,3).forEach(function(x,i){lock.appendChild(issueCard(x,free+i));});}
    var eu=r.issues.filter(function(x){return x.region==='EU';}),em=document.getElementById('r-eu'),eb=document.getElementById('r-eu-list');
    eb.textContent='';eu.forEach(function(x,i){eb.appendChild(issueCard(x,i));});
    var tg=document.getElementById('eu-toggle');tg.checked=!!o.eu;eb.hidden=!o.eu;
    document.getElementById('r-eu-count').textContent=String((r.euSummary&&r.euSummary.totalIssues)||eu.length);
    document.getElementById('r-rec').textContent=r.recommendation?r.recommendation.reason:'';
    document.querySelectorAll('[data-rec]').forEach(function(c){c.hidden=!(r.recommendation&&c.getAttribute('data-rec')===r.recommendation.path);});
    document.getElementById('ex-bar').hidden=!r.example;
    document.getElementById('r-pages').textContent=String(r.scan.pagesScanned||'n/a');
  };
})();
