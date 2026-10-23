(() => {
  'use strict';
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/marinequo-sw.js', {scope: '/'})
        .catch(error => console.warn('MARINE QUO app registration failed:', error));
    });
  }
})();
