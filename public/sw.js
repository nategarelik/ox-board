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
    const r = (e) => c(e, t),
      f = { module: { uri: t }, exports: a, require: r };
    s[t] = Promise.all(i.map((e) => f[e] || r(e))).then((e) => (n(...e), a));
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
          revision: "2a67d272eb75b282c72fd8b87da5fcd3",
        },
        {
          url: "/_next/static/3YbWjhnbHQlHcb3XsrgrT/_buildManifest.js",
          revision: "07e1ab420b3d62241633c2d138b433ef",
        },
        {
          url: "/_next/static/3YbWjhnbHQlHcb3XsrgrT/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/108.e81ebdb231b96abc.js",
          revision: "e81ebdb231b96abc",
        },
        {
          url: "/_next/static/chunks/139.7a5a8e93a21948c1.js",
          revision: "7a5a8e93a21948c1",
        },
        {
          url: "/_next/static/chunks/196.c66ffb7b04f808e9.js",
          revision: "c66ffb7b04f808e9",
        },
        {
          url: "/_next/static/chunks/204-047610f2c8712043.js",
          revision: "047610f2c8712043",
        },
        {
          url: "/_next/static/chunks/248.43196da67d53de34.js",
          revision: "43196da67d53de34",
        },
        {
          url: "/_next/static/chunks/255-4efeec91c7871d79.js",
          revision: "4efeec91c7871d79",
        },
        {
          url: "/_next/static/chunks/263.c978a65124dd3f93.js",
          revision: "c978a65124dd3f93",
        },
        {
          url: "/_next/static/chunks/32.74b1c2c2bd446cab.js",
          revision: "74b1c2c2bd446cab",
        },
        {
          url: "/_next/static/chunks/352.ea2b003dca6002a6.js",
          revision: "ea2b003dca6002a6",
        },
        {
          url: "/_next/static/chunks/360.134672f153571a18.js",
          revision: "134672f153571a18",
        },
        {
          url: "/_next/static/chunks/369.34e3a5ee3b84df3c.js",
          revision: "34e3a5ee3b84df3c",
        },
        {
          url: "/_next/static/chunks/378.178bd68923c1499b.js",
          revision: "178bd68923c1499b",
        },
        {
          url: "/_next/static/chunks/387-a5020658ddd4203c.js",
          revision: "a5020658ddd4203c",
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
          url: "/_next/static/chunks/750.bc9a3c8d9d431e15.js",
          revision: "bc9a3c8d9d431e15",
        },
        {
          url: "/_next/static/chunks/790.5ccd8269b9726bfd.js",
          revision: "5ccd8269b9726bfd",
        },
        {
          url: "/_next/static/chunks/884-3329b2c2de23b07b.js",
          revision: "3329b2c2de23b07b",
        },
        {
          url: "/_next/static/chunks/938.9cee5d3cc3cd1ecb.js",
          revision: "9cee5d3cc3cd1ecb",
        },
        {
          url: "/_next/static/chunks/965.63b64ca303125094.js",
          revision: "63b64ca303125094",
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
          url: "/_next/static/chunks/app/layout-5abcb31b635fefbf.js",
          revision: "5abcb31b635fefbf",
        },
        {
          url: "/_next/static/chunks/app/page-7cf951c4bf3394d7.js",
          revision: "7cf951c4bf3394d7",
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
          url: "/_next/static/chunks/pages/_app-998bbbd7f930ffe9.js",
          revision: "998bbbd7f930ffe9",
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
          url: "/_next/static/chunks/webpack-d6acf0df4aa00802.js",
          revision: "d6acf0df4aa00802",
        },
        {
          url: "/_next/static/css/6b702c6ec034e9db.css",
          revision: "6b702c6ec034e9db",
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
