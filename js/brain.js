// Newrosama's "brain" — turns recognized speech into a reply.
//
// This is intentionally pluggable: with no API key configured it uses a small
// built-in responder so the demo works offline and for free. Once you add an
// API key + endpoint in Settings (see index.html), it forwards the
// conversation to that endpoint (e.g. a small serverless proxy in front of
// Claude / OpenAI / any chat-completion API) and uses the real reply instead.
//
// Keys are stored only in the browser's localStorage — never commit one to
// the repo.

const STORAGE_KEYS = {
  apiKey: 'kaguya_api_key',
  endpoint: 'kaguya_api_endpoint',
};

export const SYSTEM_PROMPT = [
  'You are "Newrosama", a cheerful 3D virtual character who can understand and',
  'speak Korean, Japanese, and English fluently. Always reply in the same',
  'language the user spoke in. Keep replies short (1-3 sentences) and warm —',
  'they will be read aloud by a text-to-speech voice.',
].join(' ');

const FALLBACK_REPLIES = {
  ko: [
    (text) => `"${text}" 라고 말했지? 아직 AI 두뇌가 연결되지 않아서 미리 준비된 답변을 들려주고 있어!`,
    () => '음... 좋은 질문이네! 설정에서 API 키를 연결하면 훨씬 똑똑하게 대답할 수 있어.',
    () => '오늘도 만나서 반가워! 마이크 버튼을 눌러서 또 말해줘~',
  ],
  ja: [
    (text) => `「${text}」って言ったね!まだAIの頭脳が繋がっていないから、サンプルの返事をしているの。`,
    () => 'んー、いい質問だね!設定でAPIキーを繋げると、もっと賢く答えられるようになるよ。',
    () => '今日も会えて嬉しいな!マイクボタンを押して、また話しかけてね~',
  ],
  en: [
    (text) => `You said "${text}"! My AI brain isn't connected yet, so I'm using a sample reply.`,
    () => 'Hmm, good question! Connect an API key in Settings and I can answer for real.',
    () => "Glad to see you today! Press the mic button and talk to me again~",
  ],
};

export class Brain {
  constructor() {
    this.apiKey = localStorage.getItem(STORAGE_KEYS.apiKey) || '';
    this.endpoint = localStorage.getItem(STORAGE_KEYS.endpoint) || '';
    this.history = [];
  }

  setCredentials(apiKey, endpoint) {
    this.apiKey = apiKey.trim();
    this.endpoint = endpoint.trim();
    localStorage.setItem(STORAGE_KEYS.apiKey, this.apiKey);
    localStorage.setItem(STORAGE_KEYS.endpoint, this.endpoint);
  }

  async reply(userText, langKey) {
    this.history.push({ role: 'user', content: userText });

    const text = (this.apiKey && this.endpoint)
      ? await this._callApi(userText, langKey)
      : this._fallback(userText, langKey);

    this.history.push({ role: 'assistant', content: text });
    if (this.history.length > 20) this.history = this.history.slice(-20);
    return text;
  }

  async _callApi(userText, langKey) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          language: langKey,
          messages: this.history.slice(-10),
        }),
      });

      if (!response.ok) throw new Error(`API ${response.status}`);
      const data = await response.json();
      return data.reply || data.text || data.message || this._fallback(userText, langKey);
    } catch (err) {
      console.warn('Brain API call failed, falling back:', err);
      return this._fallback(userText, langKey);
    }
  }

  _fallback(userText, langKey) {
    const pool = FALLBACK_REPLIES[langKey] || FALLBACK_REPLIES.en;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return pick(userText);
  }
}
