# Bug: `sendRedirect()` ignores `app.baseURL` — server/client redirect inconsistency

Nuxt issue: https://github.com/nuxt/nuxt/issues/35424

## Summary

When `app.baseURL` is set to a sub-path (e.g. `/myapp/`), client-side navigation
(`navigateTo`, `useRouter().push()`, `<NuxtLink>`) correctly prepends the base URL.
Server-side `sendRedirect()` in Nitro event handlers does **not**.

This is silent when `baseURL` is `/` (the default) because `/dashboard` is correct.
It silently breaks as soon as you deploy under a sub-path — `sendRedirect(event, '/dashboard')`
sends the browser to `/dashboard` instead of `/myapp/dashboard`, producing a 404.

## Reproduce

```bash
npm install
npm run dev
# or: NUXT_APP_BASE_URL=/myapp/ npm run dev
```

Visit `http://localhost:3000/myapp/` and click the two links:

| Navigation | Destination | Result |
|---|---|---|
| `<NuxtLink to="/dashboard">` (client-side) | `/myapp/dashboard` | ✅ correct |
| `/myapp/signin` → `sendRedirect(event, '/dashboard')` (server-side) | `/dashboard` | ❌ 404 |

## Minimal example

**`nuxt.config.ts`**
```ts
export default defineNuxtConfig({
  app: {
    // Try changing this to '/' — sendRedirect accidentally works because
    // '/dashboard' is the correct destination. Change to any sub-path and it breaks.
    baseURL: process.env.NUXT_APP_BASE_URL || '/myapp/',
  },
})
```

**`server/routes/signin.get.ts`**
```ts
export default defineEventHandler((event) => {
  // Any developer naturally writes this. Works when baseURL is '/'.
  // Silently broken when baseURL is '/myapp/' — redirects to /dashboard, not /myapp/dashboard.
  return sendRedirect(event, '/dashboard', 302)
})
```

**`pages/dashboard.vue`** — a normal page, reachable at `/myapp/dashboard` via client router.

## Root cause

`sendRedirect()` (h3) passes the path through as-is. It has no knowledge of
`app.baseURL`. The Vue Router integration that runs on the client does know about
`baseURL` and prepends it automatically to every navigation.

## Why this matters

In any sub-path deployment (IIS virtual application, nginx `location /app/`,
GitHub Pages sub-directory) every server route that issues a redirect must
manually prepend the base URL as a workaround:

```ts
// Workaround — should not be necessary
const base = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/$/, '')
return sendRedirect(event, `${base}/dashboard`, 302)
```

This affects every Nuxt app that:
- uses server routes with `sendRedirect()`
- deploys under a sub-path via `app.baseURL`

The silent failure mode (works at `/`, breaks at `/myapp/`) means this is easy
to miss in development and testing, and only surfaces in production deployments.

## Suggested fix

`sendRedirect()` could accept the Nuxt `app.baseURL` and prepend it when the
path starts with `/`, mirroring what Vue Router already does. Alternatively,
the docs should prominently warn that `sendRedirect()` paths are **not** relative
to `app.baseURL`, unlike all client-side navigation APIs.

## IIS deployment context (original report)

See `environments/iis/web.config` for the HttpPlatformHandler config.
The app is deployed as an IIS virtual application at `/VenditClientVue/`, so
`NUXT_APP_BASE_URL=/VenditClientVue/` is set. HttpPlatformHandler forwards
the **full** original URL path to Node (including the virtual-app prefix) —
it does not strip it. So Nuxt must be configured with `baseURL: '/VenditClientVue/'`
to route correctly. Once that is done, every `sendRedirect()` call in server routes
that omits the prefix redirects the browser outside the virtual application.
