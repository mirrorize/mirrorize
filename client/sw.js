(global => {
  importScripts('/_/node_modules/sw-toolbox/sw-toolbox.js')

  toolbox.router.get('/_/(.*)', global.toolbox.fastest)


  // Ensure that our service worker takes control of the page as soon as possible.
  global.addEventListener('install', event => event.waitUntil(global.skipWaiting()));
  global.addEventListener('activate', event => event.waitUntil(global.clients.claim()));
})(self)