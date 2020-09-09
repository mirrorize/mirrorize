/* global importScripts, workbox, self */
(global => {
  importScripts('/_/node_modules/workbox-sw/build/workbox-sw.js')

  workbox.routing.registerRoute(
    new RegExp('/_/.*$'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )
  workbox.routing.registerRoute(
    /^\/\w+\.\w+$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'client',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )
  workbox.routing.registerRoute(
    new RegExp('/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'root',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  )

  // Set a default network-first strategy to use when
  // there is no explicit matching route:
  // workbox.routing.setDefaultHandler(new workbox.strategies.NetworkFirst())
})(self)
