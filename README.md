# CBOR to JSON Converter

A browser application and local CLI for converting CBOR (Concise Binary Object Representation) files to JSON.

![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9.0-blue?logo=typescript) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Core Functionality
- **🖥️ CLI Tool**: Convert CBOR files to JSON with required `--in`, optional `--out`, and overwrite protection
- **📏 Input Limit**: Accepts CBOR files up to 100 MiB in both the browser and CLI
- **🚀 Drag & Drop Interface**: Simply drag CBOR files onto the upload area
- **📁 File Browser**: Use the keyboard-accessible Open file or Choose a file button to select CBOR files (.cbor, .bin)
- **⚡ Live Conversion**: Real-time conversion from CBOR to JSON with loading indicators
- **🔄 Quick File Switching**: Open file button for rapid file uploads
- **💾 Save to Disk**: Download converted JSON files with sanitized filenames
- **🧹 Clear**: Close the current output and return to the upload interface

### 📝 JSON Output
- **🎨 Syntax Highlighting**: JSON display powered by CodeMirror 6
- **📊 Line Numbers**: Easy navigation with line count display
- **⚙️ Smart File Handling**: 
  - JSON up to 100,000 formatted characters: Editable with syntax highlighting
  - JSON over 100,000 formatted characters: Read-only editor configuration for viewing large output
- **⚠️ Large Output Warnings**: States the 100,000-character formatted JSON threshold
- **⌨️ Keyboard Shortcuts**: Select all with Cmd/Ctrl+A; Escape collapses the selection
- **🔍 Code Folding**: Collapse JSON objects and arrays for better navigation

### 🎨 Interface
- **📱 Responsive Design**: Layout adapts to desktop, tablet, and mobile screens
- **🖥️ Single Panel Interface**: Clean, focused UI that switches between upload and display
- **⏳ Loading States**: Professional loading indicators during file processing
- **⌨️ Accessible Status**: Loading is announced to assistive technology; decoding errors are announced as alerts
- **🛟 Render Recovery**: An error boundary displays a recovery message if the interface fails to render
- **⚙️ Decoder Settings**: Configure tag, timestamp, large-integer, and map-key output behavior
- **❔ Help pane**: Find a short service description and library attributions

### 🛡️ Robust Error Handling
- **❌ Invalid CBOR Format**: Clear messaging for malformed files
- **🔧 Corrupted Files**: Helpful guidance for incomplete uploads
- **⚠️ Unsupported Features**: Informative messages for edge cases
- **🔍 Processing Errors**: User-friendly error descriptions

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (matches the `engines` field in `package.json`)
- **npm** 8+ or **yarn** 1.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/apercova/cbor-json.git
cd cbor-json

# Install dependencies
npm ci

# Verify installation
npm run type-check

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app. The
development server binds to `127.0.0.1` and is available only on the local
machine by default.

### CLI Usage

Convert CBOR files to JSON from the command line:

```bash
# With explicit output file
npm run cbor2json -- --in sample.cbor --out output.json

# Output to current directory (saves as <input-name>.json)
npm run cbor2json -- --in sample.cbor

# CBOR timestamps (tags 0, 1) are epoch seconds by default
npm run cbor2json -- --in sample.cbor

# Format timestamps as ISO 8601 strings in a specific timezone
npm run cbor2json -- --in sample.cbor --fd --tz "-06:00"
npm run cbor2json -- --in sample.cbor --fd --tz America/Mexico_City

# Preserve all CBOR tags as tagged JSON objects
npm run cbor2json -- --in sample.cbor --preserve-tags

# Use JavaScript Number conversion for large integers (may round; warns on stderr)
npm run cbor2json -- --in sample.cbor --large-integer-mode number

# Reject maps containing non-string keys instead of coercing them
npm run cbor2json -- --in sample.cbor --strict-map-keys

# Show all CLI options and the input size limit
npm run cbor2json -- --help

# Overwrite an existing output file
npm run cbor2json -- --in sample.cbor --out output.json --force

# Convert the included sample
npm run cbor2json -- --in samples/small.cbor --out /tmp/small.json
```

Inputs larger than 100 MiB are rejected before being read. Existing output
files are preserved unless `--force` is supplied. The CLI reads and writes the
paths you provide with your user permissions; it does not restrict writes to
the current directory.

After `npm link`, you can run the CLI globally:

```bash
cbor2json --in sample.cbor --out output.json
```

| Flag | Description |
|------|-------------|
| `--in <file>` | CBOR input file (required) |
| `--out <file>` | JSON output file (optional; defaults to current directory with `.json` extension) |
| `--fd` | Format timestamp tags (0, 1) as ISO 8601 strings; timestamps are epoch seconds by default |
| `--tz <tz>` | Timezone for ISO timestamp strings (optional; defaults to UTC). Examples: `UTC`, `-06:00`, `+05:30`, `America/Mexico_City` |
| `--preserve-tags` | Preserve every CBOR tag as a tagged JSON object; overrides timestamp formatting |
| `--large-integer-mode <exact\|number>` | Choose exact unquoted decimal tokens (default) or JavaScript Number conversion, which may round values |
| `--strict-map-keys` | Reject non-string map keys instead of coercing them to strings |
| `--force` | Allow overwriting an existing output file |
| `--help`, `-h` | Print CLI usage |

### CBOR Conversion Policy

- The browser and CLI use the same decoder; browser decoding runs in a Web
  Worker. Both reject inputs above 100 MiB and nesting deeper than 128 levels.

| CBOR value | Default JSON output |
| --- | --- |
| Null, booleans, text, arrays, finite numbers | Corresponding JSON value |
| Maps | JSON objects; non-string keys are coerced to strings. Collisions after coercion are errors. |
| Byte strings | `{ "$cbor": "bytes", "base64": "..." }`, with a warning |
| Native integers beyond JavaScript's exact range | Exact, unquoted decimal JSON number token |
| Negative zero | `{ "$cbor": "float", "value": "-0" }`, with a warning |
| Tags 0 and 1 (timestamps) | Epoch seconds; tag 0 date strings are converted to epoch seconds |
| Tags 2 and 3 (bignums) | Explicit tagged object, with a warning |
| Undefined, NaN, infinities, duplicate map keys, tags 4 and 5, and other tags | Rejected with an error |

Warnings are logged to the browser console and written to CLI stderr. Exact
integer tokens preserve the CBOR value in the JSON text, though consumers that
parse them as JavaScript numbers may round them. The CLI flags in the option
table expose the same decoder policies as the Settings pane; both interfaces
use the same defaults.

### Decoder Settings

Open **Settings** in the header. Settings apply to the next file you decode.
The CLI equivalents are listed alongside each setting; pass the flags on each
conversion command.

| Setting | Default | Behavior and CLI option |
| --- | --- | --- |
| **Tag representation** | Off | Emit every CBOR tag as `{ "$cbor": "tag", "tag": ..., "value": ... }`. Overrides timestamp formatting and allows otherwise unsupported tags, including tags 4 and 5, to be preserved. Enabling it resets the timezone choice to disabled/UTC. CLI: `--preserve-tags`. |
| **Timestamp tags** | Epoch seconds | Choose epoch seconds or ISO 8601 strings for tags 0 and 1. The selector is overridden while Tag representation is on. CLI: `--fd` selects ISO. |
| **Timezone** | Disabled; UTC when enabled | Available for ISO output. Enable the searchable timezone picker to format the local time and applicable offset. It resets to UTC when toggled or when timestamp format changes. Epoch output is unchanged. CLI: `--tz <timezone>` (used with `--fd`). |
| **Large integers** | Exact JSON number | Exact mode emits the integer as an unquoted decimal token. JavaScript Number mode can round it and warns when conversion changes the value. CLI: `--large-integer-mode exact\|number`. |
| **Non-string map keys** | Coerce to strings | Compatibility mode stringifies non-string keys. Strict mode rejects any map containing one. Duplicate keys and collisions after coercion are rejected in either mode. CLI: `--strict-map-keys` enables strict mode. |

Byte strings remain base64 objects and negative zero remains an explicit float
object in all settings modes.

#### ✅ Installation Verification
If `npm install` completed successfully, you should have:
- All dependencies installed in `node_modules/` (ignored by git)
- TypeScript compilation working (`npm run type-check`)
- Development server starting without errors (`npm start`)

### Production Build

```bash
# Create optimized build
npm run build

# Test production build locally
npx serve -s build
```

## 📖 Usage Guide

### 📤 Uploading CBOR Files

1. **Drag & Drop**: 
   - Drag `.cbor` or `.bin` files directly onto the upload area
   - Visual feedback with drag-over effects

2. **File Browser**: 
   - Activate **Choose a file** or **Open file** with a mouse or keyboard
   - Select the same file again after a previous conversion if needed
   - Files larger than 100 MiB are rejected before being read

3. **Quick Upload**:
   - Use the **Open file** button in the header to choose another file

### 📋 Working with JSON Output

- **📝 Short JSON** (up to 100,000 formatted characters):
  - Fully editable with syntax highlighting
  - Copy, select all, and standard editor features
  
- **👁️ Longer JSON** (over 100,000 formatted characters):
  - Read-only in the large-output editor configuration
  
- **📊 File Information**: 
  - Line count displayed in header
  - Large-output warning when formatted JSON exceeds 100,000 characters
  
- **💾 Export Options**: 
  - Save as `.json` file with a sanitized filename based on the upload name

### 🔧 Advanced Features

- **⌨️ Keyboard Shortcuts**:
  - `Cmd/Ctrl + A`: Select all JSON content
  - `Escape`: Collapse the current selection
  - Standard editor navigation

- **🎯 Smart Navigation**:
  - Line number navigation
  - Code folding for complex JSON structures
  - Smooth scrolling for large files

## 🛠️ Technology Stack

### Core Framework
- **⚛️ React** 18.2.0 - Modern React with hooks and concurrent features
- **📘 TypeScript** 4.9.0 - Static type checking and editor support
- **🏗️ Create React App** 5.0.1 - Zero-config build tooling

### CBOR Processing
- **🔢 cborg** - Strict CBOR decoder shared by the browser and CLI

### Code Editor
- **⚡ @uiw/react-codemirror** 4.25.1 - Professional code editor component
- **🎨 @codemirror/lang-json** 6.0.2 - JSON syntax highlighting and parsing
- **⌨️ @codemirror/commands** 6.8.1 - Editor commands and shortcuts
- **👁️ @codemirror/view** 6.38.1 - Editor view layer and interaction

### File Handling
- **💾 file-saver** 2.0.5 - Client-side file downloads
- **📝 @types/file-saver** 2.0.5 - TypeScript support

### Development & Build
- **🔧 @types/react** 18.2.0 - React TypeScript declarations
- **🔧 @types/react-dom** 18.2.0 - React DOM TypeScript support
- **🔧 @types/node** 16.18.0 - Node.js TypeScript definitions
- **📦 gh-pages** 6.1.1 - GitHub Pages deployment utility

## 📁 Project Architecture

```
bin/
└── cbor2json.js             # 🖥️ CLI executable for CBOR → JSON conversion
scripts/
└── inject-csp.js            # 🛡️ Add and validate CSP in production HTML
samples/
└── small.cbor                # 📄 37-byte example CBOR file
public/
├── favicon.svg               # Browser icon
└── _headers                  # 🛡️ Netlify security response headers
vercel.json                   # 🛡️ Vercel security response headers
src/
├── components/               # React components
│   ├── FileUploadPanel.tsx   # 📤 Upload interface with drag & drop
│   ├── ErrorBoundary.tsx     # 🛟 Recovery UI for render errors
│   ├── JsonDisplayPanel.tsx  # 📋 JSON viewer with CodeMirror
│   ├── SettingsPane.tsx      # ⚙️ Decoder options
│   ├── TimezoneSelector.tsx  # Searchable timezone control
│   ├── HelpPane.tsx          # About and library attributions
│   ├── LoadingIndicator.tsx  # ⏳ Reusable loading component
│   └── ...                   # Component styles and tests
├── hooks/                    # Custom React hooks
│   └── useFileHandler.ts     # 🔄 Reusable file processing logic
├── utils/                    # Utility functions
│   ├── cborProcessor.ts      # 🧵 Worker-based browser decoder
│   ├── cbor.worker.ts         # Browser worker entry
│   ├── decodeCbor.mjs        # 🔢 Shared CBOR-to-JSON policy and decoder
│   ├── downloadName.ts       # 🧹 Safe JSON download filenames
│   └── editorConfig.ts       # ⚙️ CodeMirror configuration
├── constants/                # Application constants
│   ├── index.ts             # 📊 UI constants and thresholds
│   └── limits.js            # 📏 Shared 100 MiB input limit
├── App.tsx                  # 🏠 Main application component
├── App.css                  # 🎨 Global application styles
├── index.tsx               # 🚀 React application entry point
└── index.css               # 🌐 Global CSS reset and base styles
```

## 🌍 Browser Requirements

The app uses the File API, Web Workers, typed arrays, Blob downloads, and
`Intl.DateTimeFormat` for timezone formatting. The project does not maintain a
verified browser-version compatibility matrix; see the `browserslist` field in
`package.json` for build targets.

## 🚀 Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for GitHub Pages, Vercel, and Netlify
instructions. The repository includes configuration for these static hosting
options.

## 🔧 Development

### 🛠️ Available Scripts

```bash
# Development
npm start          # Start development server
npm test            # Run the full test suite once
npm run type-check  # Check TypeScript
npm run lint        # Lint source files
npm run build      # Create production build
# CLI
npm run cbor2json -- --help  # Show CLI options

# GitHub Pages deployment
npm run deploy     # Builds and publishes build/ to the gh-pages branch
```

### 🧪 Code Quality Features

- **📘 TypeScript** - Static type checking for the TypeScript application code
- **🔍 ESLint** - Code linting with React and TypeScript rules
- **🧪 Jest tests** - Decoder behavior, input limits, UI controls, and CLI safety
- **📚 RFC fixtures** - Decoder coverage using RFC 8949 Appendix A vectors
- **🎯 DRY Principles** - Reusable components, hooks, and utilities
- **⚛️ Modern React Patterns** - Hooks, forwardRef, useImperativeHandle
- **🏗️ Component Architecture** - Modular, maintainable code structure

### Production Build

`npm run build` creates the static site in `build/`, checks for inline scripts,
and injects the production Content Security Policy. Inspect it locally with
`npx serve -s build`.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports
- Use GitHub Issues to report bugs
- Include steps to reproduce
- Provide browser and OS information

### 💡 Feature Requests
- Suggest new features via GitHub Issues
- Explain the use case and benefits
- Consider implementation complexity

### 🔧 Pull Requests
- Fork the repository
- Create a feature branch
- Follow existing code style
- Add tests for new features
- Update documentation as needed

### 📝 Documentation
- Improve README or deployment guides
- Fix typos or clarify instructions
- Add examples or use cases

## 📏 Input Size and Runtime

The browser and CLI reject inputs larger than 100 MiB before reading them.
This is an input limit, not a performance guarantee. Browser decoding and JSON
formatting can use substantially more memory than the source CBOR file. Browser
decoding runs in a Web Worker. JSON output over 100,000 formatted characters
uses a read-only editor configuration. The app does not implement virtual
scrolling or publish performance benchmarks.

## 🛡️ Security & Privacy

- **🔒 Local Processing** - Browser files are decoded locally in a Web Worker;
  the app does not upload them. The CLI reads and writes the paths you provide
  with your operating-system permissions.
- **🚫 No Analytics** - This repository contains no analytics integration.
- **🛡️ Production Policy** - The build injects a Content Security Policy and
  rejects inline scripts. Vercel and Netlify configurations set CSP,
  `Referrer-Policy`, and `X-Content-Type-Options: nosniff` response headers.
  GitHub Pages receives the CSP and referrer policy through HTML metadata but
  cannot set all response headers.

## 📄 License

This project is open source and available under the **[MIT License](LICENSE)**.

```
MIT License - feel free to use, modify, and distribute
Commercial use, modification, and distribution permitted
No warranty provided - use at your own risk
```

## 🙏 Acknowledgments

### 🚀 Built With
- **[cborg](https://github.com/rvagg/cborg)** - Strict CBOR decoding shared by the browser and CLI
- **[CodeMirror 6](https://codemirror.net/)** - Professional code editing experience
- **[React](https://reactjs.org/)** - UI library for building interactive interfaces
- **[Create React App](https://create-react-app.dev/)** - Zero-config React build tooling

### 👨‍💻 Created By
**[apercova](https://github.com/apercova)** - Full Stack Developer

[![GitHub](https://img.shields.io/badge/GitHub-apercova-black?logo=github)](https://github.com/apercova) [![Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-orange?logo=buy-me-a-coffee)](https://buymeacoffee.com/apercova)

---

**⭐ Star this repo** if you found it helpful!

**🍴 Fork and deploy** your own instance using our [deployment guide](docs/DEPLOY.md)

**🐛 Report issues** or **💡 suggest features** via [GitHub Issues](https://github.com/apercova/cbor-json/issues)

---

**Version:** 1.0.0  
**Last Updated:** October 2026
