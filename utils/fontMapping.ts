/**
 * Maps language codes to their appropriate Playpen Sans font variant.
 * Playpen Sans has different font families for different scripts:
 * - Playpen Sans: Latin scripts
 * - Playpen Sans Arabic: Arabic script
 * - Playpen Sans Hebrew: Hebrew script (not yet available, but planned)
 * - Playpen Sans Deva: Devanagari script
 * - Playpen Sans Thai: Thai script
 */

/**
 * Get the appropriate Playpen Sans font family for a given language and script.
 * @param languageCode - ISO 639-1 language code (e.g., 'en', 'ar', 'he')
 * @param scriptCode - ISO 15924 script code (e.g., 'Arab', 'Hebr', 'Deva', 'Thai')
 * @returns The appropriate Playpen Sans font family CSS string
 */
export function getPlaypenSansVariant(languageCode: string, scriptCode: string | null): string {
  // Map script codes to Playpen Sans variants
  const scriptToFont: Record<string, string> = {
    Arab: "'Playpen Sans Arabic', cursive",
    Hebr: "'Playpen Sans', cursive", // Hebrew variant not yet available, fallback to base
    Deva: "'Playpen Sans Deva', cursive",
    Thai: "'Playpen Sans Thai', cursive",
  };

  // If we have a script code, use it
  if (scriptCode && scriptCode in scriptToFont) {
    return scriptToFont[scriptCode];
  }

  // Language-based fallback for common cases
  const languageToFont: Record<string, string> = {
    ar: "'Playpen Sans Arabic', cursive", // Arabic
    fa: "'Playpen Sans Arabic', cursive", // Persian (uses Arabic script)
    ur: "'Playpen Sans Arabic', cursive", // Urdu (uses Arabic script)
    he: "'Playpen Sans', cursive", // Hebrew (variant not yet available)
    hi: "'Playpen Sans Deva', cursive", // Hindi (Devanagari)
    mr: "'Playpen Sans Deva', cursive", // Marathi (Devanagari)
    ne: "'Playpen Sans Deva', cursive", // Nepali (Devanagari)
    sa: "'Playpen Sans Deva', cursive", // Sanskrit (Devanagari)
    th: "'Playpen Sans Thai', cursive", // Thai
  };

  if (languageCode in languageToFont) {
    return languageToFont[languageCode];
  }

  // Default to base Playpen Sans for Latin and other scripts
  return "'Playpen Sans', cursive";
}

/**
 * Resolve the actual font family to use based on the user's font selection.
 * If the user selected "Playpen Sans", this will return the appropriate variant
 * based on the current language and script.
 *
 * @param selectedFont - The font family selected by the user
 * @param languageCode - Current language code
 * @param scriptCode - Current script code (if available)
 * @returns The resolved font family CSS string
 */
export function resolveFontFamily(
  selectedFont: string,
  languageCode: string,
  scriptCode: string | null
): string {
  // Check if user selected Playpen Sans
  if (selectedFont.includes('Playpen Sans')) {
    return getPlaypenSansVariant(languageCode, scriptCode);
  }

  // For all other fonts, return as-is
  return selectedFont;
}
