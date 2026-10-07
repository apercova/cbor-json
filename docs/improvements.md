# Remaining Improvements

This file tracks work that is still open. Decoder correctness, file safety,
P3 UI behavior, CLI settings parity, and P4 documentation updates have been
implemented; those completed items are omitted here.

## Engineering hygiene

- Add CI to pull requests. Run `npm ci`, `npm run type-check`, `npm run lint`,
  and `npm test` on Node 22.
- Raise the `engines` requirement from Node `>=16` to `>=22`.
- Move `@types/*` and TypeScript packages to `devDependencies`.
- Declare `@codemirror/state` as a direct dependency; `editorConfig.ts` imports
  it directly.
- Replace remaining application `any` types with the JSON output type.
- Review `tsconfig`'s `target: es5` during a build-toolchain update.
- Plan migration from Create React App / `react-scripts@5` to a maintained
  bundler such as Vite. Keep the existing component tree and do not eject.
- Re-run `npm audit` after dependency or bundler changes. Avoid
  `npm audit fix --force`.

## Accessibility and loading follow-ups

- WCAG 2.1 AA conformance has not been audited. The implemented keyboard and
  screen-reader behaviors do not establish conformance.
- Components are not lazy-loaded; `App.tsx` imports the UI panels statically.
  Assess whether code splitting is useful as part of the bundler migration.
