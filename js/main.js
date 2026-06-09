import { AvatarStage } from './avatar.js';
import { SpeechController } from './speech.js';
import { Brain } from './brain.js';
import { CONFIG } from './config.js';

const stage = new AvatarStage(document.getElementById('stage'));
const brain = new Brain();

const userLine = document.getElementById('user-line');
const aiLine = document.getElementById('ai-line');
const micBtn = document.getElementById('mic-btn');
const langButtons = [...document.querySelectorAll('#lang-switch button')];

let currentLang = CONFIG.defaultLang || 'ja'; // Newrosama speaks Japanese by default

const speech = new SpeechController({
  onResult: handleUserSpeech,
  onListenChange: (listening) => micBtn.classList.toggle('listening', listening),
  onSpeakChange: (talking) => stage.setTalking(talking),
  onError: (err) => {
    if (err === 'not-allowed' || err === 'service-not-allowed') {
      userLine.textContent = '🎤 마이크 권한이 필요해요. 브라우저 설정에서 허용해주세요.';
    }
  },
});
speech.setLanguage(currentLang);
speech.setPersona('girl');

// Reflect default language in the buttons
langButtons.forEach((b) => b.classList.toggle('active', b.dataset.lang === currentLang));

if (!speech.supported) {
  micBtn.disabled = true;
  micBtn.title = '이 브라우저는 음성 인식을 지원하지 않아요. Chrome이나 Edge를 사용해보세요.';
  aiLine.textContent = 'このブラウザは音声認識に対応していないよ。ChromeかEdgeを使ってね！';
}

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentLang = btn.dataset.lang;
    speech.setLanguage(currentLang);
    langButtons.forEach((b) => b.classList.toggle('active', b === btn));
  });
});

micBtn.addEventListener('click', () => {
  if (micBtn.classList.contains('listening')) {
    speech.stopListening();
    return;
  }
  userLine.textContent = '';
  speech.startListening();
});

async function handleUserSpeech(text) {
  userLine.textContent = `🗣️ ${text}`;
  aiLine.textContent = '...';
  const reply = await brain.reply(text, currentLang);
  aiLine.textContent = reply;
  speech.speak(reply, currentLang);
}

// ---- Settings dialog --------------------------------------------------------

const settingsBtn = document.getElementById('settings-btn');
const settingsDialog = document.getElementById('settings');
const closeSettingsBtn = document.getElementById('close-settings');

const modelFileInput = document.getElementById('model-file');
const modelUrlInput = document.getElementById('model-url');
const loadModelBtn = document.getElementById('load-model');
const modelStatus = document.getElementById('model-status');

const apiKeyInput = document.getElementById('api-key');
const apiEndpointInput = document.getElementById('api-endpoint');
const apiModelInput = document.getElementById('api-model');
const saveCredsBtn = document.getElementById('save-creds');
const personaSelect = document.getElementById('voice-persona');

apiKeyInput.value = brain.apiKey;
apiEndpointInput.value = brain.endpoint;
apiModelInput.value = brain.model;

const savedPersona = localStorage.getItem('kaguya_voice_persona') || 'girl';
personaSelect.value = savedPersona;
speech.setPersona(savedPersona);

personaSelect.addEventListener('change', () => {
  speech.setPersona(personaSelect.value);
  localStorage.setItem('kaguya_voice_persona', personaSelect.value);
});

settingsBtn.addEventListener('click', () => settingsDialog.showModal());
closeSettingsBtn.addEventListener('click', () => settingsDialog.close());

modelFileInput.addEventListener('change', async () => {
  const files = [...(modelFileInput.files || [])];
  if (!files.length) return;
  const settings = files.find((f) => f.name.endsWith('.model3.json'));
  if (!settings) {
    modelStatus.textContent =
      '폴더 안에 .model3.json 파일이 없어요. 모델 폴더 전체를 선택했는지 확인해주세요.';
    return;
  }
  // pixi-live2d-display accepts the whole File[] and resolves siblings itself.
  await applyModel(files, settings.name);
});

loadModelBtn.addEventListener('click', async () => {
  const url = modelUrlInput.value.trim();
  if (!url) return;
  await applyModel(url, url);
});

async function applyModel(source, label) {
  modelStatus.textContent = `"${label}" 불러오는 중...`;
  loadModelBtn.disabled = true;
  try {
    await stage.loadModel(source);
    modelStatus.textContent = '모델 적용 완료! ✓';
  } catch (err) {
    console.error(err);
    modelStatus.textContent = `불러오기 실패: ${err.message || err}`;
  }
  loadModelBtn.disabled = false;
}

// Auto-load the configured model on startup (best for the tablet demo).
// If the file isn't uploaded yet, fail quietly and keep the placeholder.
if (CONFIG.autoLoadModel && CONFIG.modelPath) {
  (async () => {
    try {
      const head = await fetch(CONFIG.modelPath, { method: 'HEAD' });
      if (head.ok) await stage.loadModel(CONFIG.modelPath);
    } catch {
      // model not uploaded yet — placeholder stays, no noise
    }
  })();
}

saveCredsBtn.addEventListener('click', () => {
  brain.setCredentials(apiKeyInput.value, apiEndpointInput.value, apiModelInput.value);
  saveCredsBtn.textContent = '저장됨 ✓';
  setTimeout(() => (saveCredsBtn.textContent = '저장'), 1500);
});

// ---- VOICEVOX settings ------------------------------------------------------

const voicevoxMode = document.getElementById('voicevox-mode');
const voicevoxSpeaker = document.getElementById('voicevox-speaker');
const voicevoxKey = document.getElementById('voicevox-key');
const saveVoicevoxBtn = document.getElementById('save-voicevox');
const voicevoxStatus = document.getElementById('voicevox-status');

// Restore saved settings (key is kept only in localStorage, never committed)
voicevoxMode.value = localStorage.getItem('kaguya_vv_mode') || CONFIG.voicevox.mode || 'web';
voicevoxSpeaker.value = localStorage.getItem('kaguya_vv_speaker') || String(CONFIG.voicevox.speakerId || 14);
voicevoxKey.value = localStorage.getItem('kaguya_vv_webkey') || '';

// Apply on load
speech.configureVoicevox({
  mode: voicevoxMode.value,
  speakerId: voicevoxSpeaker.value,
  webKey: voicevoxKey.value,
});

saveVoicevoxBtn.addEventListener('click', async () => {
  const mode = voicevoxMode.value;
  const speakerId = parseInt(voicevoxSpeaker.value) || 14;
  const webKey = voicevoxKey.value.trim();

  localStorage.setItem('kaguya_vv_mode', mode);
  localStorage.setItem('kaguya_vv_speaker', String(speakerId));
  localStorage.setItem('kaguya_vv_webkey', webKey);
  speech.configureVoicevox({ mode, speakerId, webKey });

  saveVoicevoxBtn.textContent = '저장됨 ✓';
  setTimeout(() => (saveVoicevoxBtn.textContent = '저장'), 1500);

  // Quick reachability check so you know it'll work before the demo.
  if (mode === 'web') {
    voicevoxStatus.textContent = '웹 VOICEVOX 사용 — 마이크로 한 번 말해보면 히마리 목소리가 나와요.';
  } else if (mode === 'local') {
    voicevoxStatus.textContent = 'VOICEVOX 앱 연결 테스트 중...';
    try {
      const res = await fetch('http://localhost:50021/speakers');
      voicevoxStatus.textContent = res.ok
        ? '로컬 VOICEVOX 연결 성공 ✓'
        : `서버 응답 오류: ${res.status}`;
    } catch {
      voicevoxStatus.textContent =
        '로컬 연결 실패 — VOICEVOX 앱이 실행 중인지 확인하세요(태블릿에선 불가, 웹 모드를 쓰세요).';
    }
  } else {
    voicevoxStatus.textContent = '브라우저 기본 음성을 사용해요.';
  }
});
