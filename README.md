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

## Deploy to Google Cloud Run

### Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- A Google Cloud project with billing enabled
- Cloud Run API enabled

### Quick Deploy

1. Make sure you're logged in to gcloud:
   ```bash
   gcloud auth login
   ```

2. Deploy using the deployment script:
   ```bash
   ./deploy.sh YOUR_PROJECT_ID us-west1
   ```

   Replace `YOUR_PROJECT_ID` with your actual Google Cloud project ID.

### Manual Deploy

Alternatively, deploy manually:

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy spelling-aac-with-prediction \
  --source . \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080
```

## Project Structure

```
.
├── App.tsx                 # Main application component
├── index.tsx              # Application entry point
├── components/            # React components
│   ├── Controls.tsx       # Control panel
│   ├── Display.tsx        # Message display
│   └── Scanner.tsx        # Scanning interface
├── data/                  # Training data
│   ├── aac_lexicon_en_gb.txt
│   └── default_corpus.txt
├── public/                # Static assets
│   ├── sw.js             # Service worker
│   ├── manifest.json     # PWA manifest
│   └── icon.svg          # App icon
├── Dockerfile            # Docker configuration
├── nginx.conf            # Nginx configuration
└── vite.config.ts        # Vite build configuration
```

## Troubleshooting

### Production Build Issues

If you encounter 404 errors in production:

1. Ensure you're deploying the `dist/` folder, not the source files
2. Check that the service worker is being served correctly
3. Verify that all static assets are in the `public/` directory
4. Clear browser cache and service worker cache

### Service Worker Issues

To clear the service worker cache:

1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Click "Unregister" for the service worker
4. Refresh the page

## License

MIT
