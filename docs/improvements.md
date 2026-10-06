# Improvements

Assessment of the application and its improvement backlog. P1 safety changes
are implemented on this branch; P0 and P2–P4 work remains open unless noted.

Audit date: 2026-10-06. `npm audit` on the lockfile: 3 critical, 80 high,
15 moderate, 5 low (103).

## Threat model

The UI decodes in the browser and does not send the file anywhere.
Outbound links are GitHub and Buy Me a Coffee only.

A malicious CBOR file can only hurt the person who opens it: tab freeze,
memory growth, wrong JSON. The CLI reads and writes paths the operator
passes. It is a local tool. Treat decoded output as untrusted data.
Never merge it into config, HTML, or a shell command.

Most npm advisories are inside Create React App's dev server, Jest, and
SVGO. They do not ship in the static `build/` the site serves. Fix them
by leaving CRA, not by `npm audit fix --force`.

## Inventory

| Path | Role | Notes |
| --- | --- | --- |
| `src/index.tsx` | CRA entry | StrictMode only. No error boundary. |
| `src/App.tsx` | Screen switch | Upload panel or JSON panel. State is `jsonData: any`, a filename, and a processing flag. |
| `src/components/FileUploadPanel.tsx` | Drop/click upload | Clickable `div`. No keyboard path. Hidden file input. |
| `src/hooks/useFileHandler.ts` | File input wiring | Rejects files over 100 MiB before `arrayBuffer()` and resets the input after selection. No extension check. |
| `src/utils/cborProcessor.ts` | Browser decode | `cbor-js` then `JSON.parse(JSON.stringify(...))`. |
| `src/components/JsonDisplayPanel.tsx` | CodeMirror view + save | "Large file" means formatted string length > 100000, not file bytes. |
| `src/utils/editorConfig.ts` | Editor setup | Escape shortcut does nothing. Imports `@codemirror/state`, which is not a direct dependency. |
| `src/constants/index.ts` | Three constants | Threshold comment says 100KB. The value is a character count. |
| `bin/cbor2json.js` | CLI | Second decoder. Adds `--fd` / `--tz`, a 100 MiB pre-read size check, required `--in`, strict flags, `--help`, and guarded overwrites. Not typechecked (`tsconfig` includes only `src`). |
| `public/index.html` | Shell | References `favicon.ico`, which is not in `public/`. Production CSP is injected at build time; host header files set CSP, Referrer-Policy, and X-Content-Type-Options. |
| `requirements.txt` | `cbor2>=5.4.0` | Python package. Nothing in the repo imports it. |
| `docs/DEPLOY.md` | Host guide | Repo name `cbor_json`, missing `CONTRIBUTING.md`, demo URLs, service worker that does not exist. |
| Tests, CI | Partial / absent | P1 size, download-name, CLI safety, and CSP metadata tests exist. There is no CI. `.gitignore` ignores `*.test.cbor`. |

Two pipelines decode CBOR and do not share code:

```
browser: File → cborProcessor.ts → cbor-js → JSON.parse(JSON.stringify) → CodeMirror
CLI:     --in  → bin/cbor2json.js → cbor-js (+ optional date tags) → write JSON
```

The UI has no `--fd` / `--tz`. Error text is copied in both places and matched
by substring (`invalid`, `unexpected end`, `not supported`).

## Doc claims the tree does not implement

- A Content-Security-Policy. `public/index.html` has none.
- WCAG 2.1 AA. There are no `aria-*`, `role`, or keyboard handlers. The upload
  target is a `div` with `onClick`. The file input is `display: none`.
- Lazy-loaded components. `App.tsx` imports both panels statically.
- A measured bundle under 200KB, 50MB files, Lighthouse 95, or load time under
  2s. Decode runs on the main thread, then the result is cloned and
  pretty-printed again.
- Full type safety. `strict` is on, and the decoded value is `any` in every
  TypeScript site that holds it.
- The deployment link `DEPLOY.md` from the README root. The file is
  `docs/DEPLOY.md`. Issues and the fork guide use `cbor_json`. This repo is
  `cbor-json`.

## P0 — Decoder correctness

`cbor-js@0.1.0` (lockfile) is the 2015 package. It is unmaintained and covers
an old slice of RFC 7049.

`JSON.parse(JSON.stringify(decoded))` then drops or corrupts common CBOR:

- Byte strings (major type 2) become `{}` because `cbor-js` returns an
  `ArrayBuffer`.
- `NaN` and `Infinity` become `null`.
- `BigInt` throws. Tags 2 and 3 (bignums) are not preserved.
- Tags other than the CLI's optional 0 and 1 are stripped.
- Map keys that are not strings are coerced. Duplicate keys keep the last
  value with no warning.
- A map key `__proto__` changes that object's prototype. Today the page only
  displays the result. A later deep-merge into app state would turn this into
  prototype pollution.

`CBOR.decode(uint8Array.buffer)` decodes the whole underlying `ArrayBuffer`,
ignoring `byteOffset` and `byteLength`. `File.arrayBuffer()` and
`fs.readFileSync` currently allocate a dedicated buffer, so this is latent.
A sliced or pooled `Buffer` would decode neighboring bytes. Copy into a fresh
`Uint8Array` before decode.

There is no max size. Decode is synchronous, then the value is cloned and
pretty-printed. A large or deeply nested file blocks the tab. The README line
about 50MB files is not backed by a limit or a test.

The CLI and the UI do not share this function. Date formatting exists only in
`bin/cbor2json.js`. An invalid `--tz` is caught and the timestamp is written
as UTC with no error, so the file looks converted in the requested zone.

### Target

One pure function, used by the UI and the CLI:

`decodeCbor(bytes: Uint8Array, options) -> { jsonText, warnings }`

- Copy bytes before decode.
- Represent byte strings as base64 or as an explicit tagged form, and record
  a warning. Do not emit `{}`.
- Preserve or explicitly reject bignums, decimals, and unknown tags. Warnings
  go to stderr on the CLI and into the error panel in the UI.
- Cap input size and nesting. Refuse with a clear message.
- Run the browser decode in a worker so the tab stays responsive.
- Apply `--fd` / `--tz` in the shared function. Unknown timezones are errors.
- Add RFC 8949 appendix vectors as fixtures. Stop gitignoring `*.test.cbor`,
  or store fixtures under `fixtures/` with a different name.

Replace `cbor-js` only behind that function and those vectors. Candidates to
evaluate: `cborg`, `cbor-x`. Pick with a short spike, not a rewrite.
`requirements.txt` (`cbor2`) is unused Python. Delete it when the decoder
decision is recorded.

## P1 — Safety around the file (implemented on this branch)

- [x] Reject files over 100 MiB before `arrayBuffer()` / `readFileSync`.
- [x] Reset the file input after selection so the same file can be chosen again.
- [x] Sanitize the download basename. Do not pass the raw upload name through to
  `saveAs` with `../` intact. Browsers usually strip this. Do it here too.
- [x] CLI: require `--in`, reject unknown flags, and provide `--help`. Existing
  `--out` paths require `--force`. Help and errors document that the CLI uses
  the operator's paths with their permissions.
- Keep decoded objects out of `dangerouslySetInnerHTML`, `eval`, and object
  merges. React text nodes are fine for the error string and the filename.
  Leave them as text.
- [x] Add a production CSP with `default-src 'self'`, reject inline scripts at
  build time, and provide Referrer-Policy and `X-Content-Type-Options: nosniff`
  host headers for Vercel and Netlify. GitHub Pages receives the CSP and
  Referrer-Policy meta tags; it cannot set the other response headers.
- [x] Turn production source maps off (`GENERATE_SOURCEMAP=false`).
- [x] Bind `npm start` to `127.0.0.1`, not a public interface.

P1 implementation files include `src/constants/limits.js`,
`src/utils/downloadName.ts`, `scripts/inject-csp.js`, `vercel.json`,
`public/_headers`, and `src/cli.safety.test.ts`. Production build output is
checked for inline scripts before the CSP is inserted. The CSP permits inline
styles for the current input styling and CodeMirror behavior.

## P2 — Engineering hygiene

- Tests: decoder vectors, CLI args (missing `--in`, bad timezone, byte
  string), and one UI test that an error string renders. There are zero test
  files today.
- CI on pull request: `npm ci`, `npm run type-check`, `npm run lint`,
  `npm test -- --watchAll=false`. Node 22.
- `engines` says `node >= 16`. Node 16 and 18 are end of life. Set `>=22`.
- Move `@types/*` and `typescript` to `devDependencies`. Add
  `@codemirror/state` as a direct dependency. `editorConfig.ts` imports it
  through a transitive package.
- Replace `any` with a `CborJson` type (JSON value plus the explicit binary
  form you choose).
- Delete the duplicated error-message switch after the shared decoder returns
  stable error codes.
- `tsconfig` `target: es5` fights the browsers listed in the README
  (Chrome 88+). Raising it is a build change. Do it with the toolchain move.
- Plan the move off Create React App. `react-scripts@5` is unmaintained and
  is why the audit is 103 items deep. Vite (or another current bundler) is
  the remediation. Keep the component tree. Do not eject.

## P3 — UI behavior and accessibility

- The upload control cannot be reached from the keyboard. Use a real
  `<button>` or `<label>` associated with the file input.
- Give the loading and error regions `aria-live`. The progress bar is
  indeterminate. Mark it that way.
- Buttons are emoji with a `title`. Add a visible or `aria-label` name:
  Save, New, Clear.
- `handleNewFile` opens the dialog inside `setTimeout(..., 100)`. The
  user-gesture token can expire, so the dialog may not open. Open it in the
  click handler.
- Large-file mode sets CodeMirror `editable={true}` and also
  `EditorState.readOnly`. Pick one. The 100000 cutoff is the formatted string
  length. The warning says ">100KB". Make the copy match the check.
- The Escape keymap returns `true` and does not clear the selection.
- No React error boundary. A throw in render blanks the page.
- `public/index.html` requests `favicon.ico`. The file is not in `public/`.

## P4 — Docs

Rewrite the security, performance, and architecture sections after P0 so they
describe this program.

- Fix the repo name `cbor_json` → `cbor-json` in README and `docs/DEPLOY.md`.
- Point the deployment link at `docs/DEPLOY.md`.
- Remove the CSP, WCAG, lazy-loading, virtual-scrolling, 50MB, and Lighthouse
  claims, or replace them with a command someone can re-run.
- Cut `docs/DEPLOY.md` down to the hosts you actually use. It tells people to
  register a service worker and a `CONTRIBUTING.md` that are not in the repo,
  and it links demo hosts that are not this project.
- State CBOR types the converter preserves, types it rewrites, and types it
  rejects.

## Suggested order

1. Shared decoder, byte-string policy, fixtures, size cap.
2. Wire the UI and the CLI through it. Delete `requirements.txt`.
3. CI and the type/`any` cleanup.
4. Accessibility and the file-dialog bugs.
5. Leave Create React App. Re-run `npm audit` and keep the production
   dependency set separate from the dev-server set.
6. Rewrite README and trim `docs/DEPLOY.md`.

## Do not do in the first pass

- `npm audit fix --force` or `npm run eject`.
- A redesign, dark mode, PWA, i18n, or analytics. The deploy guide lists
  these. They are new product scope.
- A backend for decoding. A server that accepts CBOR would expand the threat
  model to everyone on the internet.
