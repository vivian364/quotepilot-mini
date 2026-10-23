/* MARINE QUO Command Center — additive enhancement for the existing passport.html.
   Uses existing authenticated dashboard data already rendered on the page.
   No new API calls, no credentials, no changes to RLS or the landing page. */
(()=>{
  'use strict';
  const workspace=document.getElementById('portalWorkspace');
  if(!workspace || document.getElementById('mqCommandCenter')) return;
  const style=document.createElement('style');
  style.id='mqCommandCenterStyle';
  style.textContent=`
    #mqCommandCenter{margin:22px 0 28px;color:#153c50;font-family:'Manrope',Arial,sans-serif}
    #mqCommandCenter .mq-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:15px;flex-wrap:wrap}
    #mqCommandCenter .mq-eyebrow{color:#45798c;font-size:10px;font-weight:700;letter-spacing:.2em}
    #mqCommandCenter h2{font:600 clamp(30px,4vw,43px)/1 'Barlow Condensed',Arial,sans-serif;margin:8px 0 0}
    #mqCommandCenter .mq-refresh{font-size:11px;color:#547180}
    #mqCommandCenter .mq-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:16px}
    #mqCommandCenter .mq-panel{background:#fff;border:1px solid #dbe6eb;border-radius:5px;padding:24px;min-width:0}
    #mqCommandCenter .mq-panel h3{font:600 25px/1.1 'Barlow Condensed',Arial,sans-serif;margin:0 0 15px}
    #mqCommandCenter .mq-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    #mqCommandCenter .mq-action{display:flex;flex-direction:column;justify-content:space-between;gap:14px;min-height:112px;padding:16px;border:1px solid #dbe6eb;border-radius:4px;color:#153c50;text-decoration:none;background:#f7fafb;font-size:11px;font-weight:650}
    #mqCommandCenter .mq-action:hover{border-color:#d9bd8b;background:#fffaf1}
    #mqCommandCenter .mq-action span:first-child{font-size:20px;color:#b1925b}
    #mqCommandCenter .mq-action span:last-child{color:#51788a;font-size:16px;align-self:flex-end}
    #mqCommandCenter .mq-status{font-size:12px;color:#5b7688;line-height:1.8;margin:0}
    #mqCommandCenter .mq-progress{height:7px;background:#e6eff2;border-radius:8px;overflow:hidden;margin:17px 0 10px}
    #mqCommandCenter .mq-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2c8098,#d9bd8b);transition:width .3s}
    #mqCommandCenter .mq-totals{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}
    #mqCommandCenter .mq-pill{font-size:10px;padding:7px 10px;border-radius:3px;background:#edf4f6;color:#325f73}
    @media(max-width:800px){#mqCommandCenter .mq-grid{grid-template-columns:1fr}}
    @media(max-width:520px){#mqCommandCenter .mq-panel{padding:18px}#mqCommandCenter .mq-actions{grid-template-columns:1fr 1fr}#mqCommandCenter .mq-action{min-height:100px}}
    @media(prefers-reduced-motion:reduce){#mqCommandCenter .mq-progress i{transition:none}}
  `;
  document.head.appendChild(style);
  const section=document.createElement('section');
  section.id='mqCommandCenter';
  section.setAttribute('aria-label','MARINE QUO Command Center');
  section.innerHTML=`
    <div class="mq-top"><div><div class="mq-eyebrow">MARINE QUO · BY KONTES MARINE</div><h2>COMMAND CENTER</h2></div><span class="mq-refresh">Your operations at a glance</span></div>
    <div class="mq-grid">
      <div class="mq-panel"><h3>Quick actions</h3><div class="mq-actions">
        <a class="mq-action" href="#fleetSection"><span aria-hidden="true">⚓</span>Add a vessel<span aria-hidden="true">↗</span></a>
        <a class="mq-action" href="#rfqSection"><span aria-hidden="true">◇</span>New RFQ<span aria-hidden="true">↗</span></a>
        <a class="mq-action" href="#trackingSection"><span aria-hidden="true">▤</span>Track requests<span aria-hidden="true">↗</span></a>
        <a class="mq-action" href="#offersSection"><span aria-hidden="true">✧</span>My offers<span aria-hidden="true">↗</span></a>
        <a class="mq-action" href="#messageSection"><span aria-hidden="true">✉</span>Messages<span aria-hidden="true">↗</span></a>
        <a class="mq-action" href="#companySection"><span aria-hidden="true">◈</span>Company profile<span aria-hidden="true">↗</span></a>
      </div></div>
      <div class="mq-panel"><h3>Workspace overview</h3>
        <p class="mq-status" id="mqOverviewStatus" aria-live="polite">Your account overview will appear when your workspace loads.</p>
        <div class="mq-progress" role="progressbar" aria-label="RFQs with available offers" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="mqProgressFill"></i></div>
        <div class="mq-totals"><span class="mq-pill" id="mqFleet">0 vessels</span><span class="mq-pill" id="mqRequests">0 RFQs</span><span class="mq-pill" id="mqOffers">0 offers</span></div>
      </div>
    </div>`;
  const stats=workspace.querySelector('.dashboard-stats');
  if(stats)stats.insertAdjacentElement('afterend',section);else workspace.prepend(section);
  const getCount=id=>{const n=Number(document.getElementById(id)?.textContent);return Number.isFinite(n)&&n>=0?n:0};
  let last='';
  function update(){
    if(workspace.classList.contains('portal-hidden'))return;
    const fleet=getCount('fleetCount'),rfqs=getCount('rfqCount'),pending=getCount('pendingCount'),offers=getCount('offersCount');
    const signature=[fleet,rfqs,pending,offers].join('/');if(signature===last)return;last=signature;
    document.getElementById('mqFleet').textContent=`${fleet} vessel${fleet===1?'':'s'}`;
    document.getElementById('mqRequests').textContent=`${rfqs} RFQ${rfqs===1?'':'s'}`;
    document.getElementById('mqOffers').textContent=`${offers} offer${offers===1?'':'s'}`;
    const message=!fleet?'Start by registering your first vessel.':!rfqs?'Your fleet is ready. Submit your first RFQ to begin.':pending?`${pending} request${pending===1?' is':'s are'} awaiting review. ${offers} approved offer${offers===1?'':'s'} available.`:`${rfqs} request${rfqs===1?'':'s'} recorded. ${offers} approved offer${offers===1?'':'s'} available.`;
    document.getElementById('mqOverviewStatus').textContent=message;
    const percentage=rfqs?Math.min(100,Math.round(offers/rfqs*100)):0;
    document.getElementById('mqProgressFill').style.width=percentage+'%';
    section.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(percentage));
  }
  const observer=new MutationObserver(update);
  for(const id of ['fleetCount','rfqCount','pendingCount','offersCount']){const node=document.getElementById(id);if(node)observer.observe(node,{childList:true,characterData:true,subtree:true})}
  observer.observe(workspace,{attributes:true,attributeFilter:['class']});
  update();
})();
