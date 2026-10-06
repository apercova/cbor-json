# CBOR to JSON Converter

A modern, responsive React application that converts CBOR (Concise Binary Object Representation) files to JSON with a beautiful, professional interface.

![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-4.9.0-blue?logo=typescript) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎯 Core Functionality
- **🖥️ CLI Tool**: Convert CBOR files to JSON with required `--in`, optional `--out`, and overwrite protection
- **📏 Input Limit**: Accepts CBOR files up to 100 MiB in both the browser and CLI
- **🚀 Drag & Drop Interface**: Simply drag CBOR files onto the upload area
- **📁 File Browser**: Click to browse and select CBOR files (.cbor, .bin)
- **⚡ Live Conversion**: Real-time conversion from CBOR to JSON with loading indicators
- **🔄 Quick File Switching**: "New" button for rapid file uploads without clearing current data
- **💾 Save to Disk**: Download converted JSON files with sanitized filenames
- **🧹 Smart Clear**: Reset to upload new files or return to upload interface

### 📝 Professional JSON Editor
- **🎨 Syntax Highlighting**: Beautiful JSON display powered by CodeMirror 6
- **📊 Line Numbers**: Easy navigation with line count display
- **⚙️ Smart File Handling**: 
  - JSON up to 100,000 formatted characters: Editable with syntax highlighting
  - JSON over 100,000 formatted characters: Uses the large-output editor configuration
- **⚠️ Large Output Warnings**: Shown when formatted JSON exceeds 100,000 characters
- **⌨️ Keyboard Shortcuts**: Standard editor shortcuts (Cmd+A, Escape, etc.)
- **🔍 Code Folding**: Collapse JSON objects and arrays for better navigation

### 🎨 Modern UI/UX
- **📱 Responsive Design**: Perfect on desktop, tablet, and mobile devices
- **🖥️ Single Panel Interface**: Clean, focused UI that switches between upload and display
- **⏳ Loading States**: Professional loading indicators during file processing
- **✨ Glass Morphism**: Modern design with backdrop blur effects
- **📏 Adaptive Header**: Title and description adapt to different screen sizes
- **🎯 Intuitive Navigation**: Clear visual feedback and smooth transitions

### 🛡️ Robust Error Handling
- **❌ Invalid CBOR Format**: Clear messaging for malformed files
- **🔧 Corrupted Files**: Helpful guidance for incomplete uploads
- **⚠️ Unsupported Features**: Informative messages for edge cases
- **🔍 Processing Errors**: User-friendly error descriptions

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (recommended: current LTS)
- **npm** 8+ or **yarn** 1.22+

### Installation

```bash
# Clone the repository
git clone https://github.com/apercova/cbor-json.git
cd cbor-json

# Install dependencies (this will install everything needed)
npm install

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

# Format CBOR timestamps (tags 0, 1) as ISO 8601 strings
npm run cbor2json -- --in sample.cbor --fd --tz UTC

# Format timestamps in a specific timezone
npm run cbor2json -- --in sample.cbor --fd --tz "-06:00"
npm run cbor2json -- --in sample.cbor --fd --tz America/Mexico_City

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
| `--fd` | Format CBOR timestamp tags (0, 1) as ISO 8601 strings |
| `--tz <tz>` | Timezone for formatted dates (optional; defaults to UTC). Examples: `UTC`, `-06:00`, `+05:30`, `America/Mexico_City` |
| `--force` | Allow overwriting an existing output file |
| `--help`, `-h` | Print CLI usage |

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
   - Click the upload area to choose a file
   - Select the same file again after a previous conversion if needed
   - Files larger than 100 MiB are rejected before being read

3. **Quick Upload**: 
   - Use "📁 New" button from JSON panel for rapid file switching
   - No need to clear current data first

### 📋 Working with JSON Output

- **📝 Short JSON** (up to 100,000 formatted characters):
  - Fully editable with syntax highlighting
  - Copy, select all, and standard editor features
  
- **👁️ Longer JSON** (over 100,000 formatted characters):
  - Displayed using the large-output editor configuration
  
- **📊 File Information**: 
  - Line count displayed in header
  - File size warnings when applicable
  
- **💾 Export Options**: 
  - Save as `.json` file with a sanitized filename based on the upload name

### 🔧 Advanced Features

- **⌨️ Keyboard Shortcuts**:
  - `Cmd/Ctrl + A`: Select all JSON content
  - `Escape`: Clear selection
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
- **🔢 cbor-js** 0.1.0 - Browser-compatible CBOR decoder
- **📝 @types/cbor-js** 0.1.1 - TypeScript declarations

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
└── small.cbor                # 📄 26-byte example CBOR file
public/
└── _headers                  # 🛡️ Netlify security response headers
vercel.json                   # 🛡️ Vercel security response headers
src/
├── components/               # React components
│   ├── FileUploadPanel.tsx   # 📤 Upload interface with drag & drop
│   ├── FileUploadPanel.css   # Upload panel styling
│   ├── JsonDisplayPanel.tsx  # 📋 JSON viewer with CodeMirror
│   ├── JsonDisplayPanel.css  # JSON panel styling
│   ├── LoadingIndicator.tsx  # ⏳ Reusable loading component
│   └── LoadingIndicator.css  # Loading indicator styles
├── hooks/                    # Custom React hooks
│   └── useFileHandler.ts     # 🔄 Reusable file processing logic
├── utils/                    # Utility functions
│   ├── cborProcessor.ts      # 🔢 CBOR to JSON conversion
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

## 🌍 Browser Compatibility

### ✅ Fully Supported
- **Chrome** 88+ (Recommended)
- **Firefox** 85+
- **Safari** 14+
- **Edge** 88+

### 🔧 Required Web APIs
- **File API** - Reading uploaded files
- **Drag and Drop API** - File upload interface
- **ArrayBuffer/Uint8Array** - Binary data processing
- **Blob API** - File download functionality
- **ES6+ Features** - Modern JavaScript support

### 📱 Mobile Support
- **iOS Safari** 14+
- **Chrome Mobile** 88+
- **Firefox Mobile** 85+

## 🚀 Deployment

Ready to deploy your own instance? See the [deployment guide](docs/DEPLOY.md).
Vercel and Netlify header configuration is included in this repository. GitHub
Pages receives CSP and referrer meta policies, but cannot set all response
headers.

- 🚀 **Vercel**
- 🌐 **Netlify**
- 🐙 **GitHub Pages**

## 🔧 Development

### 🛠️ Available Scripts

```bash
# Development
npm start          # Start development server
npm test -- --watchAll=false  # Run tests once
npm run type-check  # Check TypeScript
npm run lint        # Lint source files
npm run build      # Create production build
npm run eject      # Eject from Create React App (irreversible)

# CLI
npm run cbor2json -- --help  # Show CLI options

# Deployment
npm run predeploy  # Build before deployment
npm run deploy     # Deploy to GitHub Pages
```

### 🧪 Code Quality Features

- **📘 TypeScript** - Static type checking for the TypeScript application code
- **🔍 ESLint** - Code linting with React and TypeScript rules
- **🧪 Jest tests** - Input limits, download names, CLI safety, and CSP generation
- **🎯 DRY Principles** - Reusable components, hooks, and utilities
- **⚛️ Modern React Patterns** - Hooks, forwardRef, useImperativeHandle
- **🏗️ Component Architecture** - Modular, maintainable code structure

### 🧪 Testing Production Build

```bash
# Build and test locally
npm run build
npx serve -s build

```

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

## 📏 File Size and Performance

The browser and CLI reject inputs larger than 100 MiB before reading them.
This is an input limit, not a performance guarantee. Browser decoding and JSON
formatting can use substantially more memory than the source CBOR file.

## 🛡️ Security & Privacy

- **🔒 Client-Side Processing** - Files never leave your browser
- **🚫 No Data Collection** - Zero tracking or analytics
- **🔐 Secure File Handling** - Modern Web APIs with security best practices
- **🛡️ Content Security Policy** - Production builds add a policy that blocks
  inline scripts. Vercel and Netlify configurations also set CSP,
  `Referrer-Policy`, and `X-Content-Type-Options: nosniff` response headers.

## 📄 License

This project is open source and available under the **[MIT License](LICENSE)**.

```
MIT License - feel free to use, modify, and distribute
Commercial use, modification, and distribution permitted
No warranty provided - use at your own risk
```

## 🙏 Acknowledgments

### 🚀 Built With
- **[cbor-js](https://www.npmjs.com/package/cbor-js)** - Browser-compatible CBOR decoding
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
