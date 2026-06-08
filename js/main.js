import { AvatarStage } from './avatar.js';
import { SpeechController } from './speech.js';
import { Brain } from './brain.js';

const stage = new AvatarStage(document.getElementById('stage'));
const brain = new Brain();

const userLine = document.getElementById('user-line');
const aiLine = document.getElementById('ai-line');
const micBtn = document.getElementById('mic-btn');
const langButtons = [...document.querySelectorAll('#lang-switch button')];

let currentLang = 'ko';

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

if (!speech.supported) {
  micBtn.disabled = true;
  micBtn.title = '이 브라우저는 음성 인식을 지원하지 않아요. Chrome이나 Edge를 사용해보세요.';
  aiLine.textContent = '이 브라우저는 음성 인식을 지원하지 않아. Chrome이나 Edge에서 열어줘!';
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

// ---- Settings dialog: avatar (VRM) loader + AI brain credentials ----------

const settingsBtn = document.getElementById('settings-btn');
const settingsDialog = document.getElementById('settings');
const closeSettingsBtn = document.getElementById('close-settings');

const vrmFileInput = document.getElementById('vrm-file');
const vrmUrlInput = document.getElementById('vrm-url');
const loadVrmBtn = document.getElementById('load-vrm');
const vrmStatus = document.getElementById('vrm-status');

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

vrmFileInput.addEventListener('change', async () => {
  const file = vrmFileInput.files?.[0];
  if (!file) return;
  await applyVrm(URL.createObjectURL(file), file.name);
});

loadVrmBtn.addEventListener('click', async () => {
  const url = vrmUrlInput.value.trim();
  if (!url) return;
  await applyVrm(url, url);
});

async function applyVrm(url, label) {
  vrmStatus.textContent = `"${label}" 불러오는 중...`;
  try {
    await stage.loadVRM(url);
    vrmStatus.textContent = '아바타 적용 완료! ✓';
  } catch (err) {
    console.error(err);
    vrmStatus.textContent = `불러오기 실패: ${err.message || err}`;
  }
}

saveCredsBtn.addEventListener('click', () => {
  brain.setCredentials(apiKeyInput.value, apiEndpointInput.value, apiModelInput.value);
  saveCredsBtn.textContent = '저장됨 ✓';
  setTimeout(() => (saveCredsBtn.textContent = '저장'), 1500);
});
