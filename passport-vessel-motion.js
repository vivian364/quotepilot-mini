/* MARINE QUO Vessel Passport — decorative animated sea.
   Keeps existing portal, authentication, RFQ and Supabase logic unchanged. */
(() => {
  'use strict';
  const css = `
    .auth-intro{isolation:isolate}
    .mq-vessel-scene{position:absolute;inset:0;overflow:hidden;z-index:-1;pointer-events:none}
    .mq-vessel-scene::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#031d30d9 0%,#031d30b0 55%,#031d3070 100%);z-index:1}
    .mq-sea{position:absolute;bottom:-3px;left:-10%;width:220%;height:125px;opacity:.75}
    .mq-sea svg{display:block;width:100%;height:100%}
    .mq-sea-back{fill:#3c9bb7;opacity:.3;animation:mq-sea-shift 20s linear infinite}
    .mq-sea-front{fill:#b0d9e1;opacity:.22;animation:mq-sea-shift 14s linear infinite reverse}
    @keyframes mq-sea-shift{to{transform:translateX(-50%)}}
    @media(max-width:700px){.mq-sea{height:80px}}
    @media(prefers-reduced-motion:reduce){.mq-sea-back,.mq-sea-front{animation:none!important}}
  `;
  const style=document.createElement('style');style.id='mq-vessel-motion-styles';style.textContent=css;
  document.head.appendChild(style);
  const scene=document.createElement('div');scene.className='mq-vessel-scene';scene.setAttribute('aria-hidden','true');
  scene.innerHTML=`<div class="mq-sea"><svg viewBox="0 0 1440 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path class="mq-sea-back" d="M0 50Q180 0 360 50T720 50Q900 0 1080 50T1440 50V130H0Z"/><path class="mq-sea-front" d="M0 85Q180 30 360 85T720 85Q900 30 1080 85T1440 85V130H0Z"/></svg></div>`;
  const intro=document.querySelector('.auth-intro');
  if(intro)intro.prepend(scene);
})();
