if (!self.define) {
  let e,
    s = {};
  const c = (c, a) => (
    (c = new URL(c + ".js", a).href),
    s[c] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = c), (e.onload = s), document.head.appendChild(e));
        } else ((e = c), importScripts(c), s());
      }).then(() => {
        let e = s[c];
        if (!e) throw new Error(`Module ${c} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, i) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[t]) return;
    let n = {};
    const r = (e) => c(e, t),
      d = { module: { uri: t }, exports: n, require: r };
    s[t] = Promise.all(a.map((e) => d[e] || r(e))).then((e) => (i(...e), n));
  };
}
define(["./workbox-67e23458"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "a833d38d4d879fdf16412899bb5796c8",
        },
        {
          url: "/_next/static/6rLAUoLC6e_tUBEW3AFtk/_buildManifest.js",
          revision: "bd290f264fbca368a9451e4a384825d8",
        },
        {
          url: "/_next/static/6rLAUoLC6e_tUBEW3AFtk/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/139.7a5a8e93a21948c1.js",
          revision: "7a5a8e93a21948c1",
        },
        {
          url: "/_next/static/chunks/255-4efeec91c7871d79.js",
          revision: "4efeec91c7871d79",
        },
        {
          url: "/_next/static/chunks/4bd1b696-c023c6e3521b1417.js",
          revision: "c023c6e3521b1417",
        },
        {
          url: "/_next/static/chunks/646.f342b7cffc01feb0.js",
          revision: "f342b7cffc01feb0",
        },
        {
          url: "/_next/static/chunks/797-cb3690c4b8d39735.js",
          revision: "cb3690c4b8d39735",
        },
        {
          url: "/_next/static/chunks/963-f34089a80d95cbdf.js",
          revision: "f34089a80d95cbdf",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-a005cc110feb5d5e.js",
          revision: "a005cc110feb5d5e",
        },
        {
          url: "/_next/static/chunks/app/api/generate/route-be195d364d79cd7a.js",
          revision: "be195d364d79cd7a",
        },
        {
          url: "/_next/static/chunks/app/api/recommendations/route-be195d364d79cd7a.js",
          revision: "be195d364d79cd7a",
        },
        {
          url: "/_next/static/chunks/app/api/silent-audio/route-be195d364d79cd7a.js",
          revision: "be195d364d79cd7a",
        },
        {
          url: "/_next/static/chunks/app/api/stemify/route-be195d364d79cd7a.js",
          revision: "be195d364d79cd7a",
        },
        {
          url: "/_next/static/chunks/app/layout-70ddf699fe2a8382.js",
          revision: "70ddf699fe2a8382",
        },
        {
          url: "/_next/static/chunks/app/page-1e3b0dfd1bd9e0e3.js",
          revision: "1e3b0dfd1bd9e0e3",
        },
        {
          url: "/_next/static/chunks/framework-fffd2192ef0a6589.js",
          revision: "fffd2192ef0a6589",
        },
        {
          url: "/_next/static/chunks/main-3d049419258eb85b.js",
          revision: "3d049419258eb85b",
        },
        {
          url: "/_next/static/chunks/main-app-c1a81c2da93a3f52.js",
          revision: "c1a81c2da93a3f52",
        },
        {
          url: "/_next/static/chunks/pages/_app-82835f42865034fa.js",
          revision: "82835f42865034fa",
        },
        {
          url: "/_next/static/chunks/pages/_error-013f4188946cdd04.js",
          revision: "013f4188946cdd04",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-28f31fee4b93a027.js",
          revision: "28f31fee4b93a027",
        },
        {
          url: "/_next/static/css/64ca5f2e937cd2b2.css",
          revision: "64ca5f2e937cd2b2",
        },
        {
          url: "/_next/static/css/a021610425eaf15f.css",
          revision: "a021610425eaf15f",
        },
        {
          url: "/icons/icon-16x16.png",
          revision: "d08dcc699e791ccbd51d4a20f5de86d3",
        },
        {
          url: "/icons/icon-32x32.png",
          revision: "b96aaf3e8214b6b7df99a89147e9e196",
        },
        {
          url: "/icons/icon.svg",
          revision: "9b53a115a24bc8070bffce77a8c62d08",
        },
        { url: "/manifest.json", revision: "84f5599584b471af32da91113cd9f0ba" },
        { url: "/offline.html", revision: "89a32baa32af97b47da7b8e20547592e" },
        {
          url: "/worklets/advanced-stem-processor.js",
          revision: "e8552f9972c4b15c34aa806b247ccb50",
        },
        {
          url: "/worklets/stem-processor.js",
          revision: "421fd421fb01a70111401691faa1d487",
        },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: c,
              state: a,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https?.*/,
      new e.NetworkFirst({
        cacheName: "offlineCache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      new e.CacheFirst({
        cacheName: "images",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js|css|woff|woff2|ttf|eot)$/,
      new e.CacheFirst({
        cacheName: "static-resources",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 2592e3 }),
        ],
      }),
      "GET",
    ));
});
