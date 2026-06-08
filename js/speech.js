// Speech I/O for Newrosama: microphone -> text (STT) and text -> voice (TTS).
// Built entirely on the browser-native Web Speech API, so it works for free
// with no server and no API key. Best support is in Chrome / Edge.

export const LANGUAGES = {
  ko: { code: 'ko-KR', label: '한국어' },
  ja: { code: 'ja-JP', label: '日本語' },
  en: { code: 'en-US', label: 'English' },
};

// Name fragments that usually belong to female-sounding system/browser voices.
// Used to prefer a "girl" voice automatically when one is available.
const FEMALE_VOICE_HINTS = [
  'female', 'woman', 'girl',
  'kyoko', 'o-ren', 'haruka', 'sayaka', 'ayumi', 'nanami', 'mizuki', 'yuna', 'madoka',
  'google 日本語', 'google uk english female', 'google us english',
  'siri', 'samantha', 'yuna', 'sora',
];

function pickVoice(langCode) {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;

  const base = langCode.split('-')[0];
  const sameLang = voices.filter((v) => v.lang === langCode);
  const sameBase = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  const pool = sameLang.length ? sameLang : sameBase.length ? sameBase : voices;

  const female = pool.find((v) =>
    FEMALE_VOICE_HINTS.some((hint) => v.name.toLowerCase().includes(hint))
  );
  return female || pool[0];
}

export class SpeechController {
  constructor({ onResult, onListenChange, onSpeakChange, onError } = {}) {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SpeechRecognitionImpl;
    this.lang = 'ko';
    this.onSpeakChange = onSpeakChange;
    this.onError = onError;

    if (this.supported) {
      this.recognition = new SpeechRecognitionImpl();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const text = last[0].transcript.trim();
        if (text) onResult?.(text);
      };
      this.recognition.onend = () => onListenChange?.(false);
      this.recognition.onerror = (event) => {
        onListenChange?.(false);
        onError?.(event.error);
      };
    }

    // Some browsers populate the voice list asynchronously.
    if (window.speechSynthesis) {
      speechSynthesis.onvoiceschanged = () => {};
    }
  }

  setLanguage(key) {
    if (!LANGUAGES[key]) return;
    this.lang = key;
    if (this.recognition) this.recognition.lang = LANGUAGES[key].code;
  }

  startListening() {
    if (!this.recognition) return;
    speechSynthesis?.cancel();
    this.recognition.lang = LANGUAGES[this.lang].code;
    try {
      this.recognition.start();
    } catch (err) {
      // start() throws if it's already running; ignore.
    }
  }

  stopListening() {
    this.recognition?.stop();
  }

  speak(text, langKey = this.lang) {
    if (!window.speechSynthesis || !text) return;
    speechSynthesis.cancel();

    const langCode = (LANGUAGES[langKey] || LANGUAGES.en).code;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 1.02;
    utterance.pitch = 1.15; // slightly higher pitch -> friendlier "girl character" tone

    const voice = pickVoice(langCode);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => this.onSpeakChange?.(true);
    utterance.onend = () => this.onSpeakChange?.(false);
    utterance.onerror = () => this.onSpeakChange?.(false);

    speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    speechSynthesis?.cancel();
  }
}
