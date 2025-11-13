# Spelling AAC with Prediction (Aka Echo Lite.. )

A simple spelling system with one or two switch scanning for accessibility. Features next-letter prediction powered by PPM (Prediction by Partial Matching) to speed up communication. Users can compose messages letter by letter, with options to add a space, undo the last character, or have the message spoken aloud.

https://willwade.github.io/letter-by-letter-AAC/

## Features

- 🔤 Letter-by-letter spelling with scanning
- 🎯 One-switch or two-switch scanning modes
- 🤖 Next-letter prediction using PPM algorithm
- 📝 Word completion suggestions
- 🔊 Text-to-speech output
- 🎮 Game mode for practice and learning
- 🎨 Multiple themes and fonts for accessibility
- 🔊 Optional audio feedback (click sounds)
- 🌍 Multi-language support (100+ languages)
- 📱 Progressive Web App (PWA) with offline support
- 🔒 100% private - all processing happens locally in your browser
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

3. Open http://localhost:3000 in your browser

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

## Privacy & Data

**🔒 Your data never leaves your device!**

- All prediction models run **locally in your browser**
- No data is sent to any server
- No analytics or tracking
- Training data is stored only in your browser's local storage
- You can export/import your learned data at any time
- Perfect for sensitive communication needs (medical, personal, etc.)

## How to Use

### Scanning Modes

**One-Switch Mode:**

- Press **Space** to start/stop scanning
- When scanning stops on a letter, press **Space** again to select it
- Scanning automatically cycles through all available letters and actions

**Two-Switch Mode:**

- Press **Space** to advance to the next letter
- Press **Enter** to select the current letter
- Hold **Space** to rapidly advance (speed configurable in settings)

### Settings Overview

Access settings by clicking the **⚙️ Settings** button in the control bar.

#### **Scanning Settings**

| Setting              | Description                                                               | Default    |
| -------------------- | ------------------------------------------------------------------------- | ---------- |
| **Scan Mode**        | Choose between one-switch or two-switch                                   | One-switch |
| **Scan Speed**       | How fast the scanner moves (100-2000ms)                                   | 1000ms     |
| **First Item Delay** | Extra pause on first item (100-5000ms)                                    | 2000ms     |
| **Hold Speed**       | How fast letters advance when holding Space in two-switch mode (50-500ms) | 100ms      |

#### **Prediction Settings**

| Setting                  | Description                                   | Default |
| ------------------------ | --------------------------------------------- | ------- |
| **Enable Prediction**    | Turn next-letter prediction on/off            | On      |
| **Show Word Prediction** | Display word completion suggestions           | On      |
| **Upload Training Data** | Upload a text file to personalize predictions | -       |
| **Export Learned Data**  | Download your learned vocabulary              | -       |
| **Clear Learned Data**   | Reset the prediction model                    | -       |

#### **Appearance Settings**

| Setting               | Description                                                  | Default        |
| --------------------- | ------------------------------------------------------------ | -------------- |
| **Theme**             | Color scheme (Default, High Contrast, Yellow on Black, etc.) | Default        |
| **Font Family**       | Choose from accessible fonts                                 | System Default |
| **Border Width**      | Add colored borders to letters (0-20px)                      | 0px            |
| **Message Font Size** | Size of typed message (16-72px)                              | 32px           |
| **Scanner Font Size** | Size of letters in scanner (16-72px)                         | 48px           |
| **Hide Control Bar**  | Minimize controls for more screen space                      | Off            |
| **Audio Effects**     | Play click sounds during scanning                            | Off            |
| **Game Mode**         | Practice mode with target words                              | Off            |

#### **Language Settings**

| Setting      | Description                                    | Default   |
| ------------ | ---------------------------------------------- | --------- |
| **Language** | Choose from 100+ languages                     | English   |
| **Script**   | Writing system (Latin, Arabic, Cyrillic, etc.) | Latin     |
| **Case**     | Uppercase or lowercase letters                 | Lowercase |

#### **Voice Settings**

| Setting   | Description                    | Default        |
| --------- | ------------------------------ | -------------- |
| **Voice** | Text-to-speech voice selection | System default |

### Game Mode

Game mode helps users practice typing specific words or phrases:

1. Enable **Game Mode** in Settings → Appearance
2. Edit the **Word List** (comma-separated): `hi, hello, cold, hot, tea please`
3. The app will display one target word at a time in the control bar
4. Type the word letter by letter
5. Get confetti feedback for correct letters! 🎉
6. Auto-advance to the next word when complete

Perfect for:

- Learning to use the scanner
- Practicing common phrases
- Building typing confidence
- Therapy and training sessions

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

## Prediction & Learning

**🎯 The app uses high-quality training data and adaptive learning for excellent predictions!**

The prediction engine uses multiple data sources:

1. **Built-in Training Data** - Automatically loaded for 35+ languages
   - Contains realistic example text for each language
   - Provides excellent predictions from the first use
   - No setup required!

2. **Worldalphabets Frequency Lists** - Common words for each language (1000+ words)
   - Used for word completion and error-tolerant matching
   - Helps catch typos and suggest corrections

3. **Adaptive Learning** - Learns from everything you type
   - Personalizes to your vocabulary and writing style
   - Stored locally in your browser
   - Can be exported/imported

4. **Custom Training Data** - Upload your own text files for even better personalization
   - Add names, phrases, and vocabulary specific to the user
   - See "Creating Custom Training Data" below

### How Adaptive Learning Works

As you type, the app automatically learns:

- Your common letter sequences
- Your frequently used words
- Your personal vocabulary (names, places, phrases)
- Your writing style and patterns

All learned data is stored locally in your browser and can be exported/imported.

## Creating Custom Training Data

**🎯 Upload personalized training data to improve predictions even more!**

Training data is simply a text file containing realistic examples of what the user might want to say.

### What is Training Data?

Training data is simply a text file containing realistic examples of what the user might want to say. The PPM algorithm analyzes this text to learn:

- Common letter sequences
- Frequently used words
- Personal vocabulary (names, places, phrases)
- Writing style and patterns

### How to Create Great Training Data

**✅ DO Include:**

1. **Family & Friend Names**

   ```
   Hi Sarah, how are you today?
   Can you tell Mom I need help?
   I want to call Grandma later.
   Where is Dad?
   ```

2. **Common Phrases the User Says**

   ```
   I'm hungry
   I need the bathroom
   I'm tired
   Can I have a drink please
   I want to watch TV
   ```

3. **Favorite Topics & Interests**

   ```
   I love playing Minecraft
   Can we go to the park?
   I want to read my dinosaur book
   Let's play with the trains
   ```

4. **Daily Routine Vocabulary**

   ```
   Good morning
   Time for breakfast
   I need my medicine
   Can you help me get dressed
   I'm ready for bed
   ```

5. **Questions They Ask**

   ```
   What time is it?
   Where are we going?
   When is lunch?
   Can I have a snack?
   Who is coming over?
   ```

6. **Feelings & Needs**
   ```
   I'm happy
   I feel sad
   My arm hurts
   I'm cold
   I need a blanket
   ```

**❌ DON'T Include:**

- Random text from books or websites (unless relevant to the user)
- Formal or academic writing (unless the user needs it)
- Vocabulary the user would never use
- Very long, complex sentences (keep it realistic)

### Example Training File

Here's a complete example for a child who loves dinosaurs and has a sister named Emma:

```text
Hi Mom, I'm hungry
Can I have a snack please
I want to play with Emma
Where is my dinosaur book
I love T-Rex
Can we go to the park today
I need help please
I'm tired
Time for bed
Good morning Dad
I want to watch my favorite show
Can Emma play with me
I feel happy
My tummy hurts
I need the bathroom
Let's read the dinosaur book
I want juice please
Can you help me
Thank you
I love you Mom
I love you Dad
I love you Emma
What time is it
When is lunch
I'm cold
Can I have a blanket
I want to play outside
Let's build with blocks
I'm ready
Yes please
No thank you
```

### How to Use Your Training File

1. Create a text file (`.txt`) with your training data
2. Open the app and click **⚙️ Settings**
3. Go to **Prediction** section
4. Click **Upload Training Data**
5. Select your text file
6. The model will immediately retrain with your data!

**💡 Tips:**

- Start with 50-100 realistic sentences
- Add more over time as you learn what the user says most
- Include variations of common phrases
- Use the user's actual vocabulary and speech patterns
- Update the file periodically as their needs change

### Exporting & Sharing Training Data

**Export Learned Data:**

- The app learns from everything the user types
- Click **Export Learned Data** to download what it has learned
- Share this file with other devices or therapists
- Keep backups for safety

**Import on Another Device:**

- Upload the exported file as training data
- The user's personalized vocabulary transfers instantly
- Perfect for using the app on multiple devices

### Privacy Note

**🔒 All training happens in your browser!**

- Training files are processed locally
- No data is uploaded to any server
- Learned data stays in your browser's storage
- You have complete control over your data

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
5. Make sure "Enable Prediction" is turned on in settings

### Audio Not Playing

If click sounds aren't working:

1. Make sure "Audio Effects" is enabled in Settings → Appearance
2. Check your device volume
3. Some browsers require user interaction before playing audio
4. Try clicking in the app first, then enable audio effects

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
