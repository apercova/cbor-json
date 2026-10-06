---
paths:
  - "src/**"
  - "bin/**"
  - "scripts/**"
  - "package.json"
  - "tsconfig.json"
---

# Tests and checks

- Add or update tests for every behavior change and bug fix. Cover the changed
  behavior, including relevant boundary and failure cases.
- Keep tests runnable with `npm test -- --watchAll=false` and ensure the
  changed source and test files pass `npm run type-check` where they use
  TypeScript.
- Run the relevant tests and checks after changing code. At minimum, run
  `npm run type-check` and `npm test -- --watchAll=false` when changes affect
  application or CLI behavior.
- Do not leave test failures unexplained or weaken an assertion solely to make
  a check pass.
