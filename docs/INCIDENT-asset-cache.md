# Asset cache incident (2026-07-28)

## Symptom

On `https://holopinch.lizliz.xyz/`, the app shell rendered but JS never ran:
no demo orbs, canvas stuck at default 300×150, status stayed at static HTML copy.

## Root cause

Browser module scripts include Vite's `crossorigin` attribute → every script
request sends an `Origin` header.

| Request | Custom domain response |
|---|---|
| GET `/assets/index-*.js` **without** `Origin` | correct `application/javascript` (~547KB) |
| GET same URL **with** `Origin: https://holopinch.lizliz.xyz` | **poisoned** `text/html` (~3.4KB old `index.html`), `cf-cache-status: HIT`, `Cache-Control: immutable` |

`https://holopinch.pages.dev/` served the same hashed JS correctly **with** Origin.

So: edge cache on the **custom domain** held an HTML body for the asset URL
under the Origin-variant (likely captured during a deploy race or SPA-style
fallback), then `_headers` marked `/assets/*` as `immutable` for a year.

## Why users saw "broken after last change"

Not "CF never deployed". Production deploy `9bd3ccb` succeeded. The custom
domain edge served HTML for module scripts whenever the browser sent Origin —
i.e. always for real users. Curl without Origin looked healthy (false green).

## Fix

1. Ship a new build so asset hashes change (new URLs bypass poisoned entries).
2. Narrow immutable cache rules to `/assets/*.js` and `/assets/*.css` only.
3. Prefer verifying with:  
   `curl -sSI -H 'Origin: https://holopinch.lizliz.xyz' https://holopinch.lizliz.xyz/assets/<file>.js`  
   and assert `content-type: application/javascript`.
4. Zone cache purge was unavailable (API tokens lack `Zone.Cache Purge`).

## Prevention

- After every production deploy, run the Origin-header check above.
- Never treat "curl asset without Origin = 200 js" as proof the site boots.
- If HTML is ever observed under `/assets/*`, purge custom-domain cache or
  bump hashes immediately; do not only re-test pages.dev.
