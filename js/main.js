import { AvatarStage } from './avatar.js';
import { SpeechController } from './speech.js';
import { Brain } from './brain.js';

const stage = new AvatarStage(document.getElementById('stage'));
const brain = new Brain();

const userLine = document.getElementById('user-line');
const aiLine = document.getElementById('ai-line');
const micBtn = document.getElementById('mic-btn');
const langButtons = [...document.querySelectorAll('#lang-switch button')];

let currentLang = 'ja'; // Newrosama speaks Japanese by default

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
  const file = modelFileInput.files?.[0];
  if (!file) return;
  await applyModel(URL.createObjectURL(file), file.name);
});

loadModelBtn.addEventListener('click', async () => {
  const url = modelUrlInput.value.trim();
  if (!url) return;
  await applyModel(url, url);
});

async function applyModel(url, label) {
  modelStatus.textContent = `"${label}" 불러오는 중...`;
  loadModelBtn.disabled = true;
  try {
    await stage.loadModel(url);
    modelStatus.textContent = '모델 적용 완료! ✓';
  } catch (err) {
    console.error(err);
    modelStatus.textContent = `불러오기 실패: ${err.message || err}`;
  }
  loadModelBtn.disabled = false;
}

saveCredsBtn.addEventListener('click', () => {
  brain.setCredentials(apiKeyInput.value, apiEndpointInput.value, apiModelInput.value);
  saveCredsBtn.textContent = '저장됨 ✓';
  setTimeout(() => (saveCredsBtn.textContent = '저장'), 1500);
});

// ---- VOICEVOX settings ------------------------------------------------------

const voicevoxEnable = document.getElementById('voicevox-enable');
const voicevoxSpeaker = document.getElementById('voicevox-speaker');
const voicevoxEndpoint = document.getElementById('voicevox-endpoint');
const saveVoicevoxBtn = document.getElementById('save-voicevox');
const voicevoxStatus = document.getElementById('voicevox-status');

// Restore saved settings
voicevoxEnable.checked = localStorage.getItem('kaguya_vv_enabled') === 'true';
voicevoxSpeaker.value = localStorage.getItem('kaguya_vv_speaker') || '8';
voicevoxEndpoint.value = localStorage.getItem('kaguya_vv_endpoint') || 'http://localhost:50021';

// Apply on load
speech.configureVoicevox(voicevoxEnable.checked, voicevoxSpeaker.value, voicevoxEndpoint.value);

saveVoicevoxBtn.addEventListener('click', async () => {
  const enabled = voicevoxEnable.checked;
  const speakerId = parseInt(voicevoxSpeaker.value) || 8;
  const endpoint = voicevoxEndpoint.value.trim() || 'http://localhost:50021';

  localStorage.setItem('kaguya_vv_enabled', enabled);
  localStorage.setItem('kaguya_vv_speaker', speakerId);
  localStorage.setItem('kaguya_vv_endpoint', endpoint);
  speech.configureVoicevox(enabled, speakerId, endpoint);

  if (enabled) {
    voicevoxStatus.textContent = '연결 테스트 중...';
    try {
      const res = await fetch(`${endpoint}/speakers`, { method: 'GET' });
      if (res.ok) {
        const speakers = await res.json();
        voicevoxStatus.textContent =
          `연결 성공 ✓ — 사용 가능한 보이스 ${speakers.length}개`;
      } else {
        voicevoxStatus.textContent = `서버 응답 오류: ${res.status}`;
      }
    } catch {
      voicevoxStatus.textContent =
        '연결 실패 — VOICEVOX가 실행 중인지 확인해주세요 (또는 HTTPS 혼합 콘텐츠 차단)';
    }
  } else {
    voicevoxStatus.textContent = '';
    saveVoicevoxBtn.textContent = '저장됨 ✓';
    setTimeout(() => (saveVoicevoxBtn.textContent = '저장'), 1500);
  }
});
