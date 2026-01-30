# Error Correction & Reaction Time Inference - Technical Documentation

## Overview

This document explains how the error correction and reaction time inference features work in the letter-by-letter-AAC application.
NB: totally stolen ideas from Nomon for this Thanks Nomon peeps!

---

## Part 1: Error Correction System

### Purpose
Automatically detect and suggest corrections for typos using PPM (Prediction by Partial Matching) prediction and keyboard adjacency analysis.

### When Error Correction Runs

Error correction suggestions are generated **after each selection** when:
1. Error correction is enabled in settings
2. The PPM predictor is loaded and ready
3. There is text in the message buffer (message.length > 0)
4. The last selected character triggers a re-evaluation

### How Error Correction Works

#### Step 1: Analyze the Current Message

The system looks at the last character typed and the full current message.

**Example**:
- User types: "helo"
- Last character: 'o'
- Full message: "helo"

#### Step 2: Check for Adjacent Key Errors

The system builds a keyboard adjacency map from the alphabet based on scan order.

**Adjacency Map Construction**:
```javascript
For scan items ['a', 'b', 'c', '_', 'd', 'e', 'SPEAK', 'UNDO', 'CLEAR']:
  'a' → ['b']              // Only has next neighbor
  'b' → ['a', 'c']         // Has both previous and next
  'c' → ['b', '_']         // Adjacent to SPACE
  '_' → ['c', 'd']         // SPACE has adjacent items too!
  'd' → ['_', 'e']
  'e' → ['d', 'SPEAK']
  'SPEAK' → ['e', 'UNDO']
  ...
```

**Important**: In AAC scanning, ALL items have neighbors based on scan order, not keyboard layout. Users are SCANNING through items, not typing on a keyboard.

**Detecting Adjacent Errors**:
```javascript
If last selected item is 'o':
  - Get neighbors from adjacency map: ['n', 'p']
  - For each neighbor, create correction by replacing last selection
  - "helo" → ["heln", "help"]

If last selected item is SPACE ('_'):
  - Get neighbors from adjacency map: ['c', 'd']  (assuming scan order [..., 'c', '_', 'd', ...])
  - For each neighbor, create correction by replacing last selection (space)
  - "abc " → ["abc", "abcd"]  (remove space or replace with next letter)
```

**Case Preservation**:
```javascript
Original message: "Helo"  (capital H)
Correction maintains case: "Help"
```

#### Step 3: Fuzzy Matching with PPM

The system uses PPM predictor to find similar words based on context.

**Process**:
1. Split message into words: ["helo"]
2. Get last word: "helo"
3. Get predictions from PPM with context ""
4. For each prediction, calculate similarity
5. If similarity ≥ threshold, add as correction

**Example**:
```javascript
Message: "helo"
PPM predictions for "": ["hello", "help", "held", ...]
Similarity("helo", "hello") = 0.8  // High similarity
Similarity("helo", "help") = 0.6    // Medium similarity
Similarity("helo", "held") = 0.4    // Below threshold (0.6)

Result: ["hello", "help"] qualify as corrections
```

#### Step 4: Calculate Edit Distance & Similarity

Uses **Levenshtein Distance** to measure how many changes needed to transform one string to another.

**Operations**:
- Insertion: Add a character
- Deletion: Remove a character
- Substitution: Replace a character

**Distance Examples**:
```javascript
LevenshteinDistance("helo", "hello") = 1     // Insert 'l'
LevenshteinDistance("helo", "help") = 2       // Substitute 'o'→'p', delete 'o'
LevenshteinDistance("helo", "held") = 2       // Substitute 'o'→'d', delete 'o'
```

**Similarity Score**:
```javascript
Similarity = 1.0 - (distance / max_length)

Similarity("helo", "hello") = 1.0 - (1/5) = 0.8
Similarity("helo", "help") = 1.0 - (2/4) = 0.5
```

#### Step 5: Calculate Probability Using PPM

Checks if the corrected word exists in PPM's predictions.

**Probability Scoring**:
```javascript
if (PPM.contains(correctedLastWord)) {
  probability = 0.8  // High probability - word exists in language model
} else {
  probability = 0.5  // Lower probability - word might not exist
}
```

**Fuzzy matching gets higher probability**:
```javascript
if (fromFuzzyMatching) {
  probability = predictions.includes(lastWord) ? 0.9 : 0.6
}
```

#### Step 6: Rank & Filter Suggestions

**Composite Score**:
```javascript
score = similarity × probability

"hello": 0.8 × 0.8 = 0.64  // High score
"help":  0.5 × 0.5 = 0.25  // Lower score
```

**Filtering**:
- Only show suggestions with similarity ≥ threshold (default 0.6)
- Sort by composite score (descending)
- Take top 3 suggestions

#### Step 7: Display Suggestions as Scannable Items

Suggestions are added to the scan items with special prefix:
```javascript
scanItems = [
  "ec-suggestion-0",  // "Did you mean 'hello'?"
  "ec-suggestion-1",  // "Did you mean 'help'?"
  "ec-suggestion-2",  // ...
  // ... rest of alphabet and actions
]
```

**Visual Indication**:
- Orange border (#FFA500)
- Display text from suggestion.text
- Read aloud: "Did you mean hello?"

#### Step 8: Handle Suggestion Selection

When user selects a suggestion:
```javascript
1. Get suggestion by index
2. Extract correctedMessage
3. Update message state
4. Reset PPM context with corrected message
5. Dismiss all suggestions
6. Continue scanning
```

**Auto-Dismiss**:
- Suggestions auto-dismiss on ANY selection (not just another suggestion)
- This prevents suggestions from persisting too long
- Keeps scan list clean

### Integration with Scanning Modes

**Linear Scanning**:
- Suggestions added at start of scanItems
- Appear before predictions and alphabet
- Full integration with scan cycle

**Block Scanning**:
- Suggestions added at start of block items (items stage)
- Integrated into each block's item list
- Works with block scanning flow

---

## Part 2: Reaction Time Inference

### Purpose
Use measured reaction times to determine selection confidence and infer the user's intended selection.

### When Inference Runs

Inference runs **on every selection** when:
1. Inference is enabled in settings
2. Reaction time stats exist (user has taken the test)
3. Selection timing data is recorded

### How Inference Works

#### Step 1: Record Timing Data

**What's Tracked**:
```javascript
{
  itemIndex: 5,           // Position in scanItems
  item: "e",             // The character
  timestamp: 1234567890,  // When selection occurred
  dwellTime: 450,         // Time item was highlighted before selection (ms)
  timeSinceLastSelection: 1200  // Time since previous selection (ms)
}
```

**Recording Process**:
1. `recordItemStart()` called when scanIndex changes (item becomes highlighted)
2. `recordSelection()` called when user presses switch
3. Calculate dwell time: `now - itemStartTime`
4. Store last 10 selections in state

#### Step 2: Calculate Confidence Based on Dwell Time

**Confidence Levels**:

| Dwell Time | Confidence | Interpretation |
|-----------|-----------|----------------|
| < 50% of lower bound | 0.3 (Low) | Too fast - accidental or adjacent key |
| 50%-100% of lower bound | 0.7 (Medium) | Slightly fast - might be error |
| Within bounds (95% CI) | 0.95 (High) | Normal timing - confident |
| 100%-150% of upper bound | 0.85 (Good) | Slightly slow - hesitation but confident |
| > 150% of upper bound | 0.6 (Medium) | Very slow - uncertainty or distraction |

**95% Confidence Interval**:
```javascript
mean = 500ms
stdDev = 100ms
samples = 30

margin = 1.96 × (100 / √30) = 35.8ms
lower = 500 - 35.8 = 464.2ms
upper = 500 + 35.8 = 535.8ms
```

**Example Calculations**:
```javascript
User's stats: mean=500ms, stdDev=100ms
Bounds: [464ms, 536ms]

Selection 1: dwell=232ms (464 × 0.5)
→ Below 50% of lower bound
→ Confidence: 0.3 (LOW)
→ Suggest adjacent items

Selection 2: dwell=500ms
→ Within bounds
→ Confidence: 0.95 (HIGH)
→ Accept selection

Selection 3: dwell=800ms (536 × 1.5)
→ Above 150% of upper bound
→ Confidence: 0.6 (MEDIUM)
→ Accept but note hesitation
```

#### Step 3: Generate Alternatives for Low Confidence

When confidence < threshold (default 0.6):

```javascript
alternatives = [
  { item: scanItems[prevIndex], probability: 0.3 },    // Previous item
  { item: scanItems[nextIndex], probability: 0.2 },    // Next item
  { item: scanItems[prev2Index], probability: 0.1 },   // Two items back
]
```

**Adjacent Item Logic**:
```javascript
 currentIndex = 5
 numItems = 27

 prevIndex = (5 - 1 + 27) % 27 = 4
 nextIndex = (5 + 1) % 27 = 6
 prev2Index = (5 - 2 + 27) % 27 = 3
```

#### Step 4: Determine Intended Selection

```javascript
if (confidence >= threshold) {
  intendedItem = selectedItem  // Accept current selection
} else {
  intendedItem = undefined     // Low confidence, check alternatives
}
```

**Inference Result**:
```javascript
{
  intendedItem?: "e",      // If high confidence
  confidence: 0.95,
  alternatives: [
    { item: "r", probability: 0.3 },
    { item: "w", probability: 0.2 }
  ]
}
```

#### Step 5: Calculate Recommended Scan Speed

**Formula**:
```javascript
targetSpeed = mean × 0.8  // 80% of mean reaction time
rounded = round(targetSpeed / 100) × 100  // Nearest 100ms
```

**Example**:
```javascript
mean = 500ms
targetSpeed = 500 × 0.8 = 400ms
recommended = 400ms (already rounded)

if (currentScanSpeed = 1000ms) {
  difference = 600ms
  appropriate = false  // Show warning!
}
```

**Speed Warning Display**:
```javascript
if (abs(currentSpeed - recommended) > recommended × 0.2) {
  showWarning("Recommended scan speed: 400ms")
}
```

#### Step 6: Display Confidence Indicator

**Visual Display** (bottom-right corner):
```javascript
┌─────────────────────┐
│ ● 95% confident    │  Green dot (≥80%)
│ ○ 65% confident    │  Yellow dot (50-79%)
│ ○ 30% confident    │  Red dot (<50%)
└─────────────────────┘

If speed inappropriate:
┌─────────────────────┐
│ ● 45% confident    │
⚠ Recommended: 400ms│  Speed warning
└─────────────────────┘
```

**Styling**:
- Subtle: 70% opacity
- Small: 0.5rem dot
- Compact: Minimal padding
- Positioned: bottom-right corner (10px from edges)

---

## Part 3: Reaction Time Test

### Purpose
Calibrate the inference system by measuring the user's actual reaction time.

### Test Design

**One-Switch Test**:
1. Show "Wait for it..."
2. Random delay: 1000-3000ms
3. Display smiley face (😊)
4. Play ding sound
5. Speak "Select now!"
6. Wait for user to press Space/Enter
7. Record reaction time
8. Repeat for 3 trials

**Two-Switch Test**:
1. Show 3 buttons horizontally:
   - Button 0: ⚫ (or 😊 if target)
   - Button 1: ⚫ (or 😊 if target)
   - Button 2: ⚫ (or 😊 if target)
2. Target position randomized each trial
3. User presses Space to scan between buttons
4. Highlighted button gets larger (scale: 1.1) and different color
5. User presses Enter when smiley highlighted
6. Must select correct button (smiley face)
7. If wrong button selected: "Wrong position. Try again."
8. Record reaction time on correct selection
9. Repeat for 3 successful trials

### Auditory Feedback

**Sounds Generated**:
- Ding sound (Web Audio API oscillator): 880Hz → 1760Hz rising tone
- Click sound: When scanning between buttons (two-switch)
- Beep sound: Confirmation feedback

**Voice Announcements**:
- "Starting one switch test. Press your switch when you see the smiley face."
- "Select now!"
- "One switch test complete. Starting two switch test."
- "Target appeared"
- "Wrong position. Try again."
- "Test complete!"

### Statistics Calculation

```javascript
samples = [450, 480, 520]  // Reaction times in ms

mean = (450 + 480 + 520) / 3 = 483.33ms
variance = ((450-483)² + (480-483)² + (520-483)²) / 3 = 755.56
stdDev = √755.56 = 27.49ms
min = 450ms
max = 520ms
```

**Data Storage**:
```javascript
{
  mean: 483.33,
  stdDev: 27.49,
  min: 450,
  max: 520,
  samples: [450, 480, 520],
  testDate: 1234567890,
  switchType: 'one-switch' | 'two-switch'
}
```

Stored in `localStorage` with key: `'reactionTimeStats'`

---

## Part 4: Known Issues & Future Improvements

### Current Issues

1. **Space Character Handling**
   - Space is not processed for adjacent errors
   - This is intentional but could be documented better

2. **Suggestions Re-offered**
   - If user rejects a suggestion and types another character, it might appear again
   - No tracking of dismissed suggestions

3. **Confidence Threshold**
   - Fixed at 0.6 by default
   - Could be adaptive based on user behavior

### Future Improvements

1. **Learn from Rejections**
   - Track which suggestions user rejects
   - Lower probability for repeated rejections
   - Build user-specific correction model

2. **Context-Aware Thresholds** (aka Nomon)
   - Adjust threshold based on message context
   - Lower threshold for common words
   - Higher threshold for rare words

3. **Adaptive Confidence**
   - Start with conservative threshold (0.6)
   - Adjust based on user acceptance rate
   - Personalize to individual user patterns

4. **Error Recovery**
   - If user repeatedly rejects suggestions, auto-disable
   - If user frequently accepts, become more aggressive
   - Learn optimal settings per user

5. **Multi-Language Support**
   - Currently optimized for English
   - Could adapt to different language patterns
   - Language-specific adjacency rules

---

## Part 5: Integration Points

### Files Modified

**Core Logic**:
- `hooks/useErrorCorrection.ts` - Main error correction logic
- `hooks/useReactionTimeInference.ts` - Timing tracking and inference
- `hooks/useScanning.ts` - Integration with scan items
- `App.tsx` - Main application integration

**UI Components**:
- `components/Scanner.tsx` - Display suggestions
- `components/ConfidenceIndicator.tsx` - Show confidence
- `components/ReactionTimeTest.tsx` - Calibration test
- `components/settings/ErrorCorrectionSettings.tsx` - Settings UI
- `components/HelpTooltip.tsx` - Help tooltips

**Types**:
- `types.ts` - Type definitions for all new features

### Data Flow

```
User Types → useErrorCorrection → Generate Suggestions → useScanning → Add to scanItems
                                                                        ↓
                                              User Selects → App.tsx → Apply Correction
                                                                        ↓
                                              Timing → useReactionTimeInference → Confidence Score
                                                                                ↓
                                              ConfidenceIndicator → Display to User
```

