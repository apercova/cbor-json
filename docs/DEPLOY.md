# Deployment

The app builds to a static site in `build/`. It decodes files in the browser
and does not require an application server. The repository has deployment
configuration for GitHub Pages, Vercel, and Netlify.

## Build locally

Requirements: Node.js and npm versions allowed by `package.json`.

```bash
npm ci
npm run build
npx serve -s build
```

The build script disables source maps, checks that the generated HTML has no
inline scripts, and injects the production Content Security Policy. Open the
local URL printed by `serve` to inspect the result.

## GitHub Pages

The repository's `homepage` field and `npm run deploy` script are configured
for the project site `https://apercova.github.io/cbor-json`.

```bash
npm ci
npm run deploy
```

The `predeploy` lifecycle builds the site, then `gh-pages -d build` publishes
it to the `gh-pages` branch. In the repository's **Settings → Pages**, select
deployment from the `gh-pages` branch and its root directory if it is not
already selected. GitHub Pages serves the CSP and referrer policy from HTML
metadata; it does not provide the other response headers configured for the
header-capable hosts below.

## Vercel

Import this repository into Vercel and use these Create React App build
settings:

- Build command: `npm run build`
- Output directory: `build`

The root `vercel.json` configures Content Security Policy,
`Referrer-Policy`, and `X-Content-Type-Options: nosniff` response headers.

## Netlify

Import this repository into Netlify and use:

- Build command: `npm run build`
- Publish directory: `build`

The `public/_headers` file is copied into the build output and configures
Content Security Policy, `Referrer-Policy`, and
`X-Content-Type-Options: nosniff` response headers.

## Deployment notes

- Use HTTPS for public deployments.
- The app is a client-side static site. There is no backend, API, service
  worker, or server-side CBOR processing to configure.
- No deployment workflow is included; the GitHub Pages `npm run deploy`
  command publishes from the local checkout.
- The CLI is a local tool and is not part of the static site deployment. It
  reads and writes the paths passed by its operator.
