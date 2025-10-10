if (!self.define) {
  let e,
    s = {};
  const c = (c, i) => (
    (c = new URL(c + ".js", i).href),
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
  self.define = (i, n) => {
    const t =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[t]) return;
    let a = {};
    const f = (e) => c(e, t),
      r = { module: { uri: t }, exports: a, require: f };
    s[t] = Promise.all(i.map((e) => r[e] || f(e))).then((e) => (n(...e), a));
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
          revision: "c1d539f7d3ccc1167a396c970e2d988d",
        },
        {
          url: "/_next/static/4H53DZqBL0Ce1T6qOoGAS/_buildManifest.js",
          revision: "07e1ab420b3d62241633c2d138b433ef",
        },
        {
          url: "/_next/static/4H53DZqBL0Ce1T6qOoGAS/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/135-d8435cfab501bfbe.js",
          revision: "d8435cfab501bfbe",
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
          url: "/_next/static/chunks/922-239df3ba0f238495.js",
          revision: "239df3ba0f238495",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-a005cc110feb5d5e.js",
          revision: "a005cc110feb5d5e",
        },
        {
          url: "/_next/static/chunks/app/api/generate/route-f20df77449d8950f.js",
          revision: "f20df77449d8950f",
        },
        {
          url: "/_next/static/chunks/app/api/jobs/%5Bid%5D/route-f20df77449d8950f.js",
          revision: "f20df77449d8950f",
        },
        {
          url: "/_next/static/chunks/app/api/recommendations/route-f20df77449d8950f.js",
          revision: "f20df77449d8950f",
        },
        {
          url: "/_next/static/chunks/app/api/silent-audio/route-f20df77449d8950f.js",
          revision: "f20df77449d8950f",
        },
        {
          url: "/_next/static/chunks/app/api/stemify/route-f20df77449d8950f.js",
          revision: "f20df77449d8950f",
        },
        {
          url: "/_next/static/chunks/app/layout-d1b8ca188ce33901.js",
          revision: "d1b8ca188ce33901",
        },
        {
          url: "/_next/static/chunks/app/page-955da56d57389fc1.js",
          revision: "955da56d57389fc1",
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
          url: "/_next/static/css/a021610425eaf15f.css",
          revision: "a021610425eaf15f",
        },
        {
          url: "/_next/static/css/eb943cc888015d9c.css",
          revision: "eb943cc888015d9c",
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
        { url: "/manifest.json", revision: "99d0308ddb732454a0c9516134c2f7c1" },
        { url: "/offline.html", revision: "89a32baa32af97b47da7b8e20547592e" },
        {
          url: "/worklets/advanced-stem-processor.js",
          revision: "43c177290a1de12a49c9278e37f762a3",
        },
        {
          url: "/worklets/stem-processor.js",
          revision: "3a8dd207b44cc4fc6d34d23c4a3c5866",
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
              state: i,
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
