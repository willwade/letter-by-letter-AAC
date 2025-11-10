// Mapping from language codes to training file names in data/training/
// Training data files are now bundled with the app instead of fetched from npm package

export const trainingDataMap: Record<string, string> = {
  // Albanian
  sq: 'training_albanian_SQ.txt',

  // Basque
  eu: 'training_basque_ES.txt',

  // Bengali
  bn: 'training_bengali_BD.txt',

  // Czech
  cs: 'training_czech_CS.txt',

  // Danish
  da: 'training_danish_DK.txt',

  // Dutch
  nl: 'training_dutch_NL.txt',

  // English
  en: 'training_english_GB.txt',

  // Finnish
  fi: 'training_finnish_FI.txt',

  // French
  fr: 'training_french_FR.txt',

  // German
  de: 'training_german_DE.txt',

  // Greek
  el: 'training_greek_GR.txt',

  // Hebrew
  he: 'training_hebrew_IL.txt',

  // Hungarian
  hu: 'training_hungarian_HU.txt',

  // Italian
  it: 'training_italian_IT.txt',

  // Japanese (Hiragana)
  ja: 'training_hiragana83_JP.txt',

  // Mongolian
  mn: 'training_mongolian_MN.txt',

  // Persian
  fa: 'training_persian_IR.txt',

  // Polish
  pl: 'training_polish_PL.txt',

  // Portuguese
  pt: 'training_portuguese_BR.txt',

  // Russian
  ru: 'training_russian_RU.txt',

  // Spanish
  es: 'training_spanish_ES.txt',

  // Swahili
  sw: 'training_swahili_KE.txt',

  // Swedish
  sv: 'training_swedish_SE.txt',

  // Turkish
  tr: 'training_turkish_TR.txt',

  // Welsh
  cy: 'training_welsh_GB.txt',
};

export const hasTrainingData = (languageCode: string): boolean => {
  return languageCode in trainingDataMap;
};

export const getTrainingFileName = (languageCode: string): string | null => {
  return trainingDataMap[languageCode] || null;
};

