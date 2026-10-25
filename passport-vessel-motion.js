/* MARINE QUO Vessel Passport — decorative vessel & animated sea.
   Keeps existing portal, authentication, RFQ and Supabase logic unchanged. */
(() => {
  'use strict';
  const css = `
    .auth-intro{isolation:isolate}
    .mq-vessel-scene{position:absolute;inset:0;overflow:hidden;z-index:-1;pointer-events:none}
    .mq-vessel-scene::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#031d30d9 0%,#031d30b0 55%,#031d3070 100%);z-index:1}
    .mq-ship{position:absolute;right:-5%;bottom:11%;width:min(86%,510px);height:auto;opacity:.5;filter:drop-shadow(0 16px 20px #00152277);animation:mq-ship-bob 8s ease-in-out infinite;transform-origin:50% 75%}
    .mq-ship svg{display:block;width:100%;height:auto}
    .mq-sea{position:absolute;bottom:-3px;left:-10%;width:220%;height:125px;opacity:.75}
    .mq-sea svg{display:block;width:100%;height:100%}
    .mq-sea-back{fill:#3c9bb7;opacity:.3;animation:mq-sea-shift 20s linear infinite}
    .mq-sea-front{fill:#b0d9e1;opacity:.22;animation:mq-sea-shift 14s linear infinite reverse}
    @keyframes mq-sea-shift{to{transform:translateX(-50%)}}
    @keyframes mq-ship-bob{0%,100%{transform:translateY(0) rotate(-.5deg)}50%{transform:translateY(8px) rotate(.7deg)}}
    @media(max-width:700px){.mq-ship{width:75%;bottom:7%;right:-12%;opacity:.28}.mq-sea{height:80px}}
    @media(prefers-reduced-motion:reduce){.mq-ship,.mq-sea-back,.mq-sea-front{animation:none!important}}
  `;
  const style=document.createElement('style');style.id='mq-vessel-motion-styles';style.textContent=css;
  document.head.appendChild(style);
  const scene=document.createElement('div');scene.className='mq-vessel-scene';scene.setAttribute('aria-hidden','true');
  scene.innerHTML=`<div class="mq-ship"><svg viewBox="0 0 620 280" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path d="M56 173h506l-53 61H121L56 173Z" fill="#c8dbe0" stroke="#f1e6cc" stroke-width="4"/>
  <path d="M93 185h437l-32 37H130l-37-37Z" fill="#224a60"/>
  <path d="M146 144h310v30H146z" fill="#d5e4e5"/><path d="M194 108h223v36H194z" fill="#c5d8dc"/>
  <path d="M238 78h138v30H238z" fill="#dce9e9"/><path d="M276 45h65v33h-65z" fill="#d9bd8b"/>
  <path d="M308 45V14" stroke="#e7d5af" stroke-width="5"/><path d="M308 14l34 13h-34" fill="#d9bd8b"/>
  <path d="M170 155h260M211 120h190M252 91h111" stroke="#3c6e81" stroke-width="7" stroke-dasharray="14 12"/>
  <path d="M35 235q26-11 52 0t52 0t52 0t52 0t52 0t52 0t52 0t52 0t52 0t52 0t52 0" stroke="#d7eaf0" stroke-width="5" opacity=".7"/>
  </svg></div><div class="mq-sea"><svg viewBox="0 0 1440 130" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path class="mq-sea-back" d="M0 50Q180 0 360 50T720 50Q900 0 1080 50T1440 50V130H0Z"/><path class="mq-sea-front" d="M0 85Q180 30 360 85T720 85Q900 30 1080 85T1440 85V130H0Z"/></svg></div>`;
  const intro=document.querySelector('.auth-intro');
  if(intro)intro.prepend(scene);
})();
