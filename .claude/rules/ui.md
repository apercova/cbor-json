---
paths:
  - "src/components/**"
  - "src/hooks/**"
  - "src/App.tsx"
  - "src/index.tsx"
---

# UI

- The app has two screens: the upload panel and the JSON panel. Keep that.
- New controls need a keyboard path and an accessible name. The upload
  target is still a clickable `div`. Do not add another one.
- File processing reports errors through the existing error panel. Leave
  error text and filenames as React text. No `dangerouslySetInnerHTML`.
- Do not open a file dialog from `setTimeout`. The user-gesture token expires.
- Reset the file input after capturing the selected `File`, so the same file
  can be selected again while asynchronous processing continues.
- "Large file" copy must match the check. Today the check is formatted
  string length, and the warning says 100KB.
- Do not add analytics or any request that sends file contents off the machine.
