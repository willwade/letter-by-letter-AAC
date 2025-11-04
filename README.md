<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Spelling AAC with Prediction

A simple spelling system with one or two switch scanning for accessibility. Features next-letter prediction powered by PPM (Prediction by Partial Matching) to speed up communication. Users can compose messages letter by letter, with options to add a space, undo the last character, or have the message spoken aloud.

View your app in AI Studio: https://ai.studio/apps/drive/1DFRZNDWFA_53DS0ta5v-Aw4wGCeLWSHG

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

2. (Optional) Set the `GEMINI_API_KEY` in [.env.local](.env.local) if using Gemini features

3. Run the development server:
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

### Automatic Deployment (Recommended)

The repository is configured for automatic deployment to GitHub Pages:

1. **Enable GitHub Pages** in your repository:
   - Go to Settings > Pages
   - Under "Source", select "GitHub Actions"

2. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

3. **Wait for deployment** (usually 1-2 minutes)
   - Check the Actions tab to see deployment progress
   - Your app will be available at: `https://willwade.github.io/letter-by-letter-AAC/`

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the app
npm run build

# Deploy the dist folder to gh-pages branch
npx gh-pages -d dist
```

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public/` directory with your domain
2. Configure DNS settings with your domain provider
3. Enable custom domain in GitHub Pages settings

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

## Why This is a Static Site

This app requires **no server** because:

- ✅ **Prediction runs client-side** using the PPM algorithm in `@willwade/ppmpredictor`
- ✅ **Text-to-speech uses browser APIs** (Web Speech API)
- ✅ **All data is static files** (lexicon and corpus are `.txt` files)
- ✅ **No database needed** - everything runs in the browser
- ✅ **No API calls** - completely self-contained

This means:
- 🚀 **Free hosting** on GitHub Pages
- ⚡ **Fast loading** - no server round trips
- 🔒 **Privacy** - all processing happens locally
- 📱 **Works offline** - PWA with service worker
- 🌍 **Works anywhere** - just HTML, CSS, and JavaScript

## Troubleshooting

### GitHub Pages 404 Errors

If you get 404 errors after deploying:

1. Check that GitHub Pages is enabled in Settings > Pages
2. Verify the `base` URL in `vite.config.ts` matches your repo name
3. Wait a few minutes for GitHub Pages to update
4. Clear browser cache

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
