/* global importScripts, workbox, self */

self.__WB_DISABLE_DEV_LOGS = true;

(global => {
  importScripts('/_/node_modules/workbox-sw/build/workbox-sw.js')

  workbox.setConfig({ debug: false })

  const registerRoute = workbox.routing.registerRoute
  const StaleWhileRevalidate = workbox.strategies.StaleWhileRevalidate
  const CacheableResponsePlugin = workbox.cacheableResponse.CacheableResponsePlugin

  registerRoute(
    new RegExp('/_/.*$'),
    new StaleWhileRevalidate({
      cacheName: 'static',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )
  /*
  registerRoute(
    /^\/\w+\.\w+$/,
    new StaleWhileRevalidate({
      cacheName: 'client',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )
  registerRoute(
    new RegExp('/'),
    new StaleWhileRevalidate({
      cacheName: 'root',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )
  */

  // Set a default network-first strategy to use when
  // there is no explicit matching route:
  // workbox.routing.setDefaultHandler(new workbox.strategies.NetworkFirst())
})(self)
