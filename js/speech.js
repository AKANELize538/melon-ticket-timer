// Speech I/O for Newrosama.
//
// Two TTS providers, used in this priority order:
//   1. VOICEVOX (enabled in Settings) — high-quality anime-character voice,
//      requires the VOICEVOX app running locally on port 50021.
//      Only activates for Japanese; other languages fall through to provider 2.
//   2. Browser SpeechSynthesis — built-in, free, works everywhere, no setup.
//
// STT uses the browser's SpeechRecognition API (Chrome / Edge only).

export const LANGUAGES = {
  ko: { code: 'ko-KR', label: '한국어' },
  ja: { code: 'ja-JP', label: '日本語' },
  en: { code: 'en-US', label: 'English' },
};

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

// Default VOICEVOX configuration.
// Speaker 14 = 冥鳴ひまり (ノーマル) — selected for Mao.
const VOICEVOX_DEFAULTS = {
  enabled: false,
  speakerId: 14,
  endpoint: 'http://localhost:50021',
};

function pickBrowserVoice(langCode, persona) {
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
    this.lang = 'ja';
    this.persona = 'girl';
    this.onSpeakChange = onSpeakChange;
    this.onError = onError;
    this.voicevox = { ...VOICEVOX_DEFAULTS };

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

  configureVoicevox(enabled, speakerId, endpoint) {
    this.voicevox = {
      enabled: !!enabled,
      speakerId: Number(speakerId) || VOICEVOX_DEFAULTS.speakerId,
      endpoint: endpoint || VOICEVOX_DEFAULTS.endpoint,
    };
  }

  startListening() {
    if (!this.recognition) return;
    speechSynthesis?.cancel();
    this.recognition.lang = LANGUAGES[this.lang].code;
    try {
      this.recognition.start();
    } catch {
      // already running — ignore
    }
  }

  stopListening() {
    this.recognition?.stop();
  }

  async speak(text, langKey = this.lang, personaKey = this.persona) {
    if (!text) return;
    speechSynthesis?.cancel();

    // Use VOICEVOX for Japanese when it's enabled.
    if (this.voicevox.enabled && langKey === 'ja') {
      try {
        await this._speakVoicevox(text, this.voicevox.speakerId, this.voicevox.endpoint);
        return;
      } catch (err) {
        console.warn('VOICEVOX 연결 실패 — 브라우저 TTS로 대체:', err.message);
        // fall through to browser TTS
      }
    }

    this._speakBrowser(text, langKey, personaKey);
  }

  stopSpeaking() {
    speechSynthesis?.cancel();
  }

  // ---- private ---------------------------------------------------------------

  async _speakVoicevox(text, speakerId, endpoint) {
    // Step 1: generate pronunciation/timing query
    const queryRes = await fetch(
      `${endpoint}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
      { method: 'POST' }
    );
    if (!queryRes.ok) throw new Error(`audio_query ${queryRes.status}`);
    const query = await queryRes.json();

    // Tweak prosody for a slightly brighter, warmer sound
    query.speedScale = 1.05;
    query.pitchScale = 0.04;
    query.intonationScale = 1.1;
    query.volumeScale = 1.0;

    // Step 2: synthesize WAV
    const synthRes = await fetch(
      `${endpoint}/synthesis?speaker=${speakerId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      }
    );
    if (!synthRes.ok) throw new Error(`synthesis ${synthRes.status}`);

    const blob = await synthRes.blob();
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.onSpeakChange?.(true);
      audio.onended = () => {
        this.onSpeakChange?.(false);
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        this.onSpeakChange?.(false);
        URL.revokeObjectURL(url);
        reject(e);
      };
      audio.play().catch(reject);
    });
  }

  _speakBrowser(text, langKey, personaKey) {
    if (!window.speechSynthesis) return;
    const langCode = (LANGUAGES[langKey] || LANGUAGES.en).code;
    const persona = VOICE_PERSONAS[personaKey] || VOICE_PERSONAS.girl;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = persona.rate;
    utterance.pitch = persona.pitch;

    const voice = pickBrowserVoice(langCode, personaKey);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => this.onSpeakChange?.(true);
    utterance.onend = () => this.onSpeakChange?.(false);
    utterance.onerror = () => this.onSpeakChange?.(false);

    speechSynthesis.speak(utterance);
  }
}
