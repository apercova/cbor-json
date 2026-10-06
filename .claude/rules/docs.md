---
paths:
  - "README.md"
  - "docs/**"
---

# Docs

- Repository URL is `https://github.com/apercova/cbor-json`. The name is
  `cbor-json`, not `cbor_json`.
- The deployment guide is `docs/DEPLOY.md`.
- Describe only behavior the code implements. Production CSP, host response
  headers, and the 100 MiB input cap are implemented. WCAG conformance, lazy
  loading, virtual scrolling, measured bundle size, and Lighthouse scores are
  not established; do not claim them.
- Do not add host guides, demo URLs, or performance numbers that this repo
  does not run.
- Decoder limits and type conversions belong next to the feature that
  performs them. Point security and architecture edits at
  `docs/improvements.md` until that backlog is done.
