/**
 * Language detection and TTS utilities for Quantuma.
 */

export interface DetectedLanguage {
  code: string;
  name: string;
  flag: string;
}

/**
 * Detect language of a text string based on character sets and common linguistic patterns.
 */
export function detectLanguage(text: string): DetectedLanguage {
  const clean = text.trim();
  if (!clean) {
    return { code: 'en-US', name: 'English', flag: '🌐' };
  }

  // Arabic / Urdu / Farsi Perso-Arabic scripts
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // Specific Urdu Nastaliq letters (ٹ, ڈ, ڑ, ں, ے, ھ, وغیرہ)
  const urduSpecificRegex = /[ٹڈڑںےھہ]/;

  if (arabicRegex.test(clean)) {
    if (urduSpecificRegex.test(clean) || clean.includes('ہیں') || clean.includes('کیا') || clean.includes('کون')) {
      return { code: 'ur-PK', name: 'Urdu', flag: '🇵🇰' };
    }
    return { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' };
  }

  // Devanagari script (Hindi, Marathi, Sanskrit)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(clean)) {
    return { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' };
  }

  // German specific umlauts & eszett
  if (/[äöüßÄÖÜ]/.test(clean) || /\b(und|der|die|das|nicht|ich|sie|wir|haben|ist)\b/i.test(clean)) {
    return { code: 'de-DE', name: 'German', flag: '🇩🇪' };
  }

  // French specific accents & common words
  if (/[éèêëàâùûîïçœæÉÈÊËÀÂÙÛÎÏÇŒÆ]/.test(clean) || /\b(bonjour|merci|avec|dans|pour|vous|nous|est|sont|cette)\b/i.test(clean)) {
    return { code: 'fr-FR', name: 'French', flag: '🇫🇷' };
  }

  // Spanish accents & inverted punctuation & common words
  if (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(clean) || /\b(hola|gracias|buenos|por|para|está|como|pero|muy)\b/i.test(clean)) {
    return { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' };
  }

  // Japanese
  if (/[\u3040-\u30ff\u3400-\u4dbf]/.test(clean)) {
    return { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' };
  }

  // Chinese
  if (/[\u4e00-\u9fff]/.test(clean)) {
    return { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' };
  }

  // Russian / Cyrillic
  if (/[\u0400-\u04FF]/.test(clean)) {
    return { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' };
  }

  // Italian
  if (/\b(ciao|grazie|per favore|bene|sono|questo|molto)\b/i.test(clean)) {
    return { code: 'it-IT', name: 'Italian', flag: '🇮🇹' };
  }

  // Portuguese
  if (/[ãõÃÕ]/.test(clean) || /\b(obrigado|você|para|com|não|mais)\b/i.test(clean)) {
    return { code: 'pt-BR', name: 'Portuguese', flag: '🇧🇷' };
  }

  return { code: 'en-US', name: 'English', flag: '🌐' };
}

/**
 * Remove markdown symbols and format text for natural, conversational speech synthesis.
 */
export function cleanMarkdownForSpeech(markdown: string): string {
  return markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' [code omitted] ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown links: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove image tags: ![alt](url) -> ""
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove headers (#, ##, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italics
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers (- , * , 1. )
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Normalize extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the optimal voice for a language code from available synthesis voices.
 */
export function getBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const prefix = langCode.slice(0, 2).toLowerCase();

  // 1. Exact match e.g. "ur-PK"
  const exact = voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase());
  if (exact) return exact;

  // 2. Starts with primary prefix e.g. "ur", "ar", "es", "de", "fr"
  const prefixMatch = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  // 3. Natural / Google / Premium voice if available for language
  const premium = voices.find(
    (v) =>
      v.lang.toLowerCase().startsWith(prefix) &&
      (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))
  );
  if (premium) return premium;

  // 4. Default system voice
  return voices.find((v) => v.default) || voices[0] || null;
}
