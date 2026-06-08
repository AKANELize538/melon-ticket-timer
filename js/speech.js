// Speech I/O for Newrosama: microphone -> text (STT) and text -> voice (TTS).
// Built entirely on the browser-native Web Speech API, so it works for free
// with no server and no API key. Best support is in Chrome / Edge.

export const LANGUAGES = {
  ko: { code: 'ko-KR', label: '한국어' },
  ja: { code: 'ja-JP', label: '日本語' },
  en: { code: 'en-US', label: 'English' },
};

// Two voice "personas" Newrosama can speak in. Each lists name fragments that
// usually belong to that kind of system/browser voice, plus a pitch/rate that
// pushes the built-in voice toward that character.
//   - girl:   bright, friendly anime-character tone (default)
//   - jarvis: calm, composed "AI butler" tone, à la Iron Man's J.A.R.V.I.S.
//             (works best in English — pick a UK male voice if your system has one)
export const VOICE_PERSONAS = {
  girl: {
    label: '발랄한 소녀',
    pitch: 1.15,
    rate: 1.02,
    hints: [
      'female', 'woman', 'girl',
      'kyoko', 'o-ren', 'haruka', 'sayaka', 'ayumi', 'nanami', 'mizuki', 'yuna', 'madoka',
      'google 日本語', 'google uk english female', 'google us english',
      'siri', 'samantha', 'sora',
    ],
  },
  jarvis: {
    label: '차분한 집사 AI (JARVIS 스타일)',
    pitch: 0.86,
    rate: 0.95,
    hints: [
      'male', 'man', 'daniel', 'george', 'ryan', 'arthur', 'oliver', 'fred',
      'aaron', 'guy', 'gordon', 'james', 'alex',
      'google uk english male', 'microsoft george', 'microsoft ryan',
    ],
  },
};

function pickVoice(langCode, persona) {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;

  const base = langCode.split('-')[0];
  const sameLang = voices.filter((v) => v.lang === langCode);
  const sameBase = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  const pool = sameLang.length ? sameLang : sameBase.length ? sameBase : voices;

  const hints = (VOICE_PERSONAS[persona] || VOICE_PERSONAS.girl).hints;
  const matched = pool.find((v) =>
    hints.some((hint) => v.name.toLowerCase().includes(hint))
  );
  return matched || pool[0];
}

export class SpeechController {
  constructor({ onResult, onListenChange, onSpeakChange, onError } = {}) {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SpeechRecognitionImpl;
    this.lang = 'ko';
    this.persona = 'girl';
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

  setPersona(key) {
    if (!VOICE_PERSONAS[key]) return;
    this.persona = key;
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

  speak(text, langKey = this.lang, personaKey = this.persona) {
    if (!window.speechSynthesis || !text) return;
    speechSynthesis.cancel();

    const langCode = (LANGUAGES[langKey] || LANGUAGES.en).code;
    const persona = VOICE_PERSONAS[personaKey] || VOICE_PERSONAS.girl;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = persona.rate;
    utterance.pitch = persona.pitch;

    const voice = pickVoice(langCode, personaKey);
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
