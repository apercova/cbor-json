# Improvements

Assessment of the application and its improvement backlog. P0 decoder
correctness and P1 file-safety changes are implemented on this branch; P2–P4
work remains open unless noted.

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
| `src/App.tsx` | Screen switch | Upload panel or JSON panel. State is formatted JSON text, decoder warnings, a filename, and a processing flag. |
| `src/components/FileUploadPanel.tsx` | Drop/click upload | Clickable `div`. No keyboard path. Hidden file input. |
| `src/hooks/useFileHandler.ts` | File input wiring | Rejects files over 100 MiB before `arrayBuffer()` and resets the input after selection. No extension check. |
| `src/utils/cborProcessor.ts` | Browser decode | Reads the file and transfers its buffer to a Web Worker. |
| `src/utils/decodeCbor.mjs` | Shared decoder | `cborg`, bounded depth, JSON conversion policy, stable errors, and date-tag formatting used by browser worker and CLI. |
| `src/components/JsonDisplayPanel.tsx` | CodeMirror view + save | "Large file" means formatted string length > 100000, not file bytes. |
| `src/utils/editorConfig.ts` | Editor setup | Escape shortcut does nothing. Imports `@codemirror/state`, which is not a direct dependency. |
| `src/constants/index.ts` | Three constants | Threshold comment says 100KB. The value is a character count. |
| `bin/cbor2json.js` | CLI | Uses the shared decoder with epoch-second timestamp numbers by default and optional ISO output with `--fd` / `--tz`; includes a 100 MiB pre-read size check, required `--in`, strict flags, `--help`, and guarded overwrites. |
| `public/index.html` | Shell | References `favicon.ico`, which is not in `public/`. Production CSP is injected at build time; host header files set CSP, Referrer-Policy, and X-Content-Type-Options. |
| `fixtures/rfc8949-appendix-a.json` | Decoder fixtures | RFC 8949 Appendix A byte vectors and expected JSON values. |
| `docs/DEPLOY.md` | Host guide | Repo name `cbor_json`, missing `CONTRIBUTING.md`, demo URLs, service worker that does not exist. |
| Tests, CI | Partial / absent | RFC vector, decoder policy, P1 safety, and CSP metadata tests exist. There is no CI. |

The browser and CLI use one decoder:

```
browser: File → cborProcessor.ts → Web Worker → decodeCbor.mjs → CodeMirror
CLI:     --in  → bin/cbor2json.js → decodeCbor.mjs (+ --fd / --tz) → write JSON
```

The UI uses the shared decoder's default epoch-second timestamp policy. Decoder
errors have stable codes; warnings appear with the converted JSON and on CLI
stderr.

## Remaining documentation gaps

- WCAG 2.1 AA conformance has not been established. The upload target is a
  clickable `div` and the file input is visually hidden.
- Components are not lazy-loaded; `App.tsx` imports both panels statically.
- `docs/DEPLOY.md` still contains stale host instructions, service-worker
  directions, and repository links. The README links to the correct path.

## P0 — Decoder correctness (implemented on this branch)

`cborg` replaces `cbor-js` behind the shared `decodeCbor(bytes, options)`
function. The decoder copies input bytes, preflights nesting (maximum 128),
and enforces the shared 100 MiB limit. It rejects duplicate map keys,
including collisions after non-string-key coercion, undefined,
non-finite numbers, decimal/bigfloat tags, and unknown tags. Non-string map
keys are coerced to strings by default for compatibility; strict mode rejects
them. Byte strings and tags are represented explicitly with warnings; large
native integers are emitted as exact unquoted decimal JSON number tokens by
default. `largeIntegerMode: 'number'` opts into JavaScript number conversion
and warns if conversion changes the integer. `__proto__` remains a data key on a
null-prototype object during serialization. Timestamp tags become epoch-second
numbers by default. CLI `--fd` enables ISO 8601 strings with optional timezone
formatting through `--tz`; invalid timezones fail. The shared decoder can
preserve timestamp tags as explicit JSON objects in tagged mode.

The browser calls the same decoder inside a Web Worker. RFC 8949 Appendix A
vectors and decoder policy cases live in `fixtures/` and
`src/utils/decodeCbor.node-test.mjs`. The unused Python `requirements.txt` and
`cbor-js` dependency have been removed.

`cborg` was selected in a focused integration spike: its byte-array support,
custom tag callbacks, typed map decoding, duplicate-key rejection, and strict
unknown-tag errors fit this converter's explicit JSON policy. No throughput
benchmark was run; the goal was correctness and predictable rejection.

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
`public/_headers`, and `src/cli.safety.test.js`. Production build output is
checked for inline scripts before the CSP is inserted. The CSP permits inline
styles for the current input styling and CodeMirror behavior.

## P2 — Engineering hygiene

- Tests: decoder vectors and CLI safety coverage exist. Add the planned UI
  error-render test and CI.
- CI on pull request: `npm ci`, `npm run type-check`, `npm run lint`,
  `npm test`. Node 22.
- `engines` says `node >= 16`. Node 16 and 18 are end of life. Set `>=22`.
- Move `@types/*` and `typescript` to `devDependencies`. Add
  `@codemirror/state` as a direct dependency. `editorConfig.ts` imports it
  through a transitive package.
- Finish replacing remaining application `any` types with the JSON output
  type.
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
- Add a settings pane toggle for timestamp representation: epoch-second number
  (the default), ISO 8601 string, or a nested JSON object that preserves the
  CBOR tag and value.
- Add a settings pane toggle for map-key handling: coerce non-string keys to
  strings (the default) or enable strict mode, which rejects those keys.
- Add a settings pane toggle for large integer output: exact decimal JSON
  number tokens (the default) or JavaScript Number conversion, with a warning
  whenever that mode rounds an integer.

## Suggested order

1. [x] Shared decoder, byte-string policy, RFC fixtures, and size/depth caps.
2. [x] Wire UI and CLI through the decoder, run browser decoding in a worker,
   and remove unused Python/legacy decoder dependencies.
3. CI and remaining type cleanup.
4. Accessibility and file-dialog behavior.
5. Leave Create React App. Re-run `npm audit` and keep the production
   dependency set separate from the dev-server set.
6. Trim `docs/DEPLOY.md` and finish documentation cleanup.

## Do not do in the first pass

- `npm audit fix --force` or `npm run eject`.
- A redesign, dark mode, PWA, i18n, or analytics. The deploy guide lists
  these. They are new product scope.
- A backend for decoding. A server that accepts CBOR would expand the threat
  model to everyone on the internet.
