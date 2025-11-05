

# Spelling AAC with Prediction (Aka Echo Lite.. )

A simple spelling system with one or two switch scanning for accessibility. Features next-letter prediction powered by PPM (Prediction by Partial Matching) to speed up communication. Users can compose messages letter by letter, with options to add a space, undo the last character, or have the message spoken aloud.

https://willwade.github.io/letter-by-letter-AAC/

## Features

- 🔤 Letter-by-letter spelling with scanning
- 🎯 One-switch or two-switch scanning modes
- 🤖 Next-letter prediction using PPM algorithm
- 📝 Word completion suggestions
- 🔊 Text-to-speech output
- 📱 Progressive Web App (PWA) with offline support
- ♿ Accessibility-focused design

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## Build for Production

Build the app for production deployment:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The built files will be in the `dist/` directory.

## Deploy to GitHub Pages

This app is a **100% static site** - no server required! It runs entirely in the browser.

## Project Structure

```
.
├── App.tsx                      # Main application component
├── index.tsx                    # Application entry point
├── components/                  # React components
│   ├── Controls.tsx            # Control panel
│   ├── Display.tsx             # Message display
│   └── Scanner.tsx             # Scanning interface
├── public/                      # Static assets
│   ├── sw.js                   # Service worker (PWA)
│   ├── manifest.json           # PWA manifest
│   ├── icon.svg                # App icon
│   └── data/                   # Training data
│       ├── aac_lexicon_en_gb.txt
│       └── default_corpus.txt
├── .github/workflows/           # GitHub Actions
│   └── deploy.yml              # Auto-deployment workflow
└── vite.config.ts              # Vite build configuration
```

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Prediction**: [@willwade/ppmpredictor](https://www.npmjs.com/package/@willwade/ppmpredictor) (client-side PPM algorithm)
- **Text-to-Speech**: Web Speech API (browser native)
- **PWA**: Service Worker for offline support
- **Styling**: Tailwind CSS (via CDN)
- **Deployment**: GitHub Pages (static hosting)


## Troubleshooting


### Service Worker Issues

To clear the service worker cache:

1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Click "Unregister" for the service worker
4. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Prediction Not Working

If predictions aren't showing:

1. Check browser console for errors
2. Verify data files loaded correctly (check Network tab)
3. Try disabling and re-enabling prediction in settings
4. Upload a custom training file to retrain the model

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
