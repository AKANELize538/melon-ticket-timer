import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// Drop a .vrm file named "avatar.vrm" in the project root (see README for free sources).
const AVATAR_URL = './avatar.vrm';

const canvas = document.getElementById('scene');
const subtitle = document.getElementById('subtitle');
const statusEl = document.getElementById('status');
const micBtn = document.getElementById('mic-btn');
const langSelect = document.getElementById('lang-select');

function setStatus(text) {
  statusEl.textContent = text;
}

// ---------- 3D scene ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(0, 1.4, 2.2);

scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(1, 1, 1);
scene.add(keyLight);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let currentVRM = null;
let mouthOpen = 0;
let mouthTarget = 0;

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
loader.load(
  AVATAR_URL,
  (gltf) => {
    const vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);
    scene.add(vrm.scene);
    currentVRM = vrm;
    setStatus('Avatar loaded. Click "Talk" and speak.');
  },
  undefined,
  () => setStatus('No avatar.vrm found — add one to the project root (see README "Free 3D avatars").')
);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (currentVRM) {
    mouthOpen += (mouthTarget - mouthOpen) * Math.min(1, delta * 12);
    currentVRM.expressionManager?.setValue('aa', mouthOpen);
    currentVRM.update(delta);
  }

  renderer.render(scene, camera);
}
animate();

// ---------- Speech recognition: microphone -> text ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    subtitle.textContent = `You: ${transcript}`;
    handleUserSpeech(transcript);
  };
  recognition.onerror = (event) => setStatus(`Mic error: ${event.error}`);
  recognition.onend = () => micBtn.classList.remove('listening');
} else {
  setStatus('This browser does not support speech recognition. Try Chrome or Edge.');
  micBtn.disabled = true;
}

micBtn.addEventListener('click', () => {
  if (!recognition) return;
  recognition.lang = langSelect.value;
  recognition.start();
  micBtn.classList.add('listening');
  setStatus(`Listening (${langSelect.value})…`);
});

// ---------- Brain: text -> reply ----------
// Stub. Replace with a real LLM call — see README "Step 3: give Kaguya a brain".
// Note: never call an LLM API directly from this static page with a secret key;
// route it through a small backend/proxy that holds the key server-side.
async function getAIResponse(userText) {
  return `I heard you say: "${userText}". Wire up an LLM in getAIResponse() (main.js) to make me smarter.`;
}

async function handleUserSpeech(transcript) {
  setStatus('Thinking…');
  const reply = await getAIResponse(transcript);
  subtitle.textContent = `Kaguya: ${reply}`;
  speak(reply, langSelect.value);
}

// ---------- Text-to-speech: reply -> voice ----------
function pickVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const femaleHint = /female|woman|girl|haruka|kyoko|sayaka|ayumi|nanami|o-ren/i;
  return (
    voices.find((v) => v.lang === lang && femaleHint.test(v.name)) ||
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
  );
}

function speak(text, lang) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.voice = pickVoice(lang) || null;
  utterance.onstart = () => { mouthTarget = 1; setStatus('Speaking…'); };
  utterance.onend = () => { mouthTarget = 0; setStatus('Ready.'); };

  speechSynthesis.speak(utterance);
}

// Some browsers populate the voice list asynchronously; this triggers that.
speechSynthesis.onvoiceschanged = () => {};

setStatus('Ready. Click "Talk" and speak.');
