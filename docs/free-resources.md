# 무료로 Live2D 모델 · JP 여성 목소리 · 3D 아바타 구하기

## 0. Live2D 모델 — 어디서 구하나요?

이 앱은 `.model3.json` 파일(Cubism 4 포맷)을 로드하면 뉴로사마가 진짜로
살아 움직여요. 아래 곳에서 무료 모델을 구할 수 있어요.

### 📥 무료 Live2D 모델 다운로드 목록

| 사이트 | 내용 | 주소 |
|---|---|---|
| **Live2D 공식 샘플** | Haru, Mao, Natori 등 공식 무료 샘플 모델 5종+ | https://www.live2d.com/download/sample-data/ |
| **nizima (니지마)** | Live2D 공식 마켓, "무료" 필터로 검색 | https://nizima.com/ |
| **Booth.pm** | 동인 마켓, "Live2D 무료" 검색 | https://booth.pm/ |
| **GitHub 검색** | `"live2d model free"` 키워드로 오픈소스 모델 검색 | https://github.com/ |

### 📦 모델 파일 구조 (로드 방법)
Live2D 모델 폴더를 받으면 아래처럼 생겼어요:
```
model-folder/
  ├── model.model3.json   ← 이 파일을 앱 설정에서 로드해요
  ├── textures/
  │   └── texture_00.png
  ├── motions/
  └── ...
```
⚙ 설정 창 → "model3.json URL 입력" 또는 "파일 선택"에서
**model.model3.json** (폴더 안의 `.model3.json` 파일)을 지정하면 돼요.

단, **CORS 제한** 때문에 원격 URL은 서버가 `Access-Control-Allow-Origin: *`
헤더를 허용해야 로드될 수 있어요. 로컬 파일 선택(파일 업로드 방식)이 가장
간단해요.

### 🛠️ SDK 파일 설치 (라이브러리가 로드 안 될 때)
앱이 `live2dcubismcore.min.js`를 CDN(`cubism.live2d.com`)에서 받아오는데,
일부 환경(방화벽, 오프라인)에서 막힐 수 있어요. 그럴 때:
1. https://www.live2d.com/download/cubism-sdk/ 에서
   "Cubism SDK for Web" 무료 다운로드 (계정 필요)
2. 받은 압축 파일 안의 `Core/live2dcubismcore.min.js`를
   이 프로젝트의 **`libs/` 폴더** 에 복사
3. `index.html` 안의 CDN 주소를 `libs/live2dcubismcore.min.js` 로 교체

---

## 1. 일본어 "여자아이" 목소리 (TTS)

### ① 가장 빠른 방법 — 브라우저 내장 음성 (이미 이 앱에 적용됨)
이 프로젝트의 `js/speech.js`는 별도 설정 없이 **브라우저 내장
`speechSynthesis`**를 사용해요. Chrome/Edge에는 보통 "Google 日本語" 같은
일본어 여성 음성이 기본 포함되어 있어서, 일본어 모드로 전환하면 바로
여자 목소리로 답해줘요. 완전 무료, 설정 0개.
- 단점: 음색이 다소 기계적이고, 운영체제/브라우저마다 보유한 목소리가 다름.

### ② VOICEVOX — 무료 애니메 캐릭터 보이스 엔진 (추천)
- https://voicevox.hiroshiba.jp/
- 즌다몬, 시코쿠 메탄 등 귀여운 캐릭터 목소리를 무료로 제공하는 일본어 TTS
  소프트웨어예요. 개인/상업적 이용 모두 무료(사용 시 크레딧 표기 정도만 권장).
- 로컬에서 실행하면 HTTP API(`http://localhost:50021`)를 제공해서, 우리
  `brain.js` → 응답 텍스트를 VOICEVOX API로 보내고 받은 음성을 재생하도록
  `speech.js`의 `speak()`를 교체하면 훨씬 캐릭터다운 목소리를 낼 수 있어요.

### ③ Microsoft Azure AI Speech 무료 플랜
- https://azure.microsoft.com/products/ai-services/ai-speech
- `ja-JP-NanamiNeural`, `ja-JP-MayuNeural` 등 자연스러운 일본어 여성 뉴럴
  음성을 매월 일정량 무료로 제공해요(가입 필요, 신용카드 등록 조건이 있을
  수 있으니 가입 시 무료 등급 조건을 꼭 확인하세요).

### ④ つくよみちゃん(Tsukuyomi-chan) 음성 코퍼스
- https://tyc.rei-yumesaki.net/
- 비상업/상업 이용 가이드라인을 따르면 무료로 사용 가능한 일본어 여성
  음성 데이터(코퍼스)예요. 직접 TTS 모델을 학습시키고 싶을 때 참고하면 좋아요.

> 추천 진행 순서: 지금은 ①(브라우저 내장)으로 바로 테스트 → 캐릭터성을
> 더 살리고 싶을 때 ②(VOICEVOX)로 교체.

---

## 2. 무료 3D 아바타 (VRM)

이 앱은 `.vrm` 파일을 업로드/URL로 불러오면 바로 3D 아바타로 적용돼요
(설정 ⚙ → "아바타 불러오기"). VRM은 VR/버추얼 캐릭터 업계에서 널리 쓰이는
표준 3D 아바타 포맷이에요.

### ① VRoid Studio — 내 캐릭터를 직접 만들기 (가장 추천)
- https://vroid.com/studio
- 무료 데스크톱 앱으로, 마우스 클릭만으로 머리카락/눈/옷 등을 커스터마이즈해
  애니메 스타일 3D 캐릭터를 만들 수 있어요. 완성하면 `.vrm`으로 내보내기 →
  바로 이 앱에 로드하면 끝. "뉴로사마"를 원하는 모습으로 직접 디자인할 수
  있다는 게 가장 큰 장점이에요.

### ② VRoid Hub — 커뮤니티가 만든 아바타 다운로드
- https://hub.vroid.com/
- 다른 사람들이 만들어 공개한 VRM 아바타를 무료로 받을 수 있는 곳이에요.
  모델마다 "다운로드 허용 여부"와 "이용 조건(상업적 이용 가능 여부 등)"이
  다르니, 받기 전에 해당 모델의 라이선스 표시를 꼭 확인하세요.

### ③ Booth.pm
- https://booth.pm/
- 일본의 동인/창작 마켓플레이스로, "VRM 無料"로 검색하면 무료로 배포되는
  VRM 아바타가 다수 있어요. 역시 각 작품의 이용 약관을 확인하세요.

### ④ Ready Player Me
- https://readyplayer.me/
- 웹에서 사진이나 클릭만으로 스타일라이즈드 아바타를 만들고 GLB로 내보낼 수
  있는 무료 서비스예요. (VRM이 아니라 GLB이므로, 이 앱에 쓰려면 `avatar.js`의
  로더를 일반 GLTF 로더로 바꾸거나 VRM으로 변환하는 과정이 필요해요.)

### ⑤ Mixamo — 무료 애니메이션
- https://www.mixamo.com/
- 아바타에 입힐 수 있는 무료 모션/애니메이션 라이브러리예요(Adobe 계정
  필요). Phase 5(표정·제스처)에서 활용하면 좋아요.

> 추천 진행 순서: ①(VRoid Studio)로 나만의 뉴로사마를 직접 만들어 `.vrm`으로
> 내보내기 → 이 앱의 설정 창에서 바로 불러와 적용.

---

## 3. JARVIS 같은 "AI 비서" 목소리 만들기

아이언맨의 자비스(JARVIS)는 차분하고 절제된 영국식 남성 목소리가 특징이에요.
이 앱의 ⚙ 설정 → "목소리 스타일"에서 **"차분한 집사 AI — JARVIS 스타일"**을
선택하면, 시스템에 깔린 음성 중 남성/영국식 음성을 자동으로 골라 더 낮은
피치·느린 속도로 말하도록 조정해줘요.

### ① 가장 빠른 방법 — 운영체제에 영국식 남성 음성 추가 (무료)
- **Windows**: 설정 → 시간 및 언어 → 음성 → "음성 추가"에서
  `English (United Kingdom)`을 추가하면 "George", "Ryan" 같은 남성 음성이
  생겨요. 추가 후 Chrome을 재시작하면 이 앱에서도 바로 선택돼요.
- **macOS / iOS / iPadOS**: 시스템 설정 → 손쉬운 사용 → 낭독 콘텐츠 → 음성에서
  영어(영국)의 남성 음성(예: "Daniel", "Arthur")을 내려받을 수 있어요.
- **Android**: 설정 → 접근성 → 텍스트 음성 변환에서 Google TTS 언어팩 중
  영어(영국) 음성을 추가할 수 있어요.

### ② 더 자연스러운 음색이 필요하다면 — 무료 등급이 있는 클라우드 TTS
- **ElevenLabs** (https://elevenlabs.io/) — 매우 자연스러운 음성을 만드는
  서비스로, 매월 일정량의 무료 사용량을 제공해요. 차분하고 권위 있는
  남성 목소리(또는 직접 만든 커스텀 보이스)를 골라 JARVIS 느낌을 낼 수
  있어요. 무료 한도를 넘으면 유료로 전환돼요.
- **Microsoft Azure AI Speech** (https://azure.microsoft.com/products/ai-services/ai-speech) —
  `en-GB-RyanNeural`, `en-GB-ThomasNeural` 같은 차분한 영국식 남성 뉴럴 음성을
  매월 일정량 무료로 제공해요.
- 두 경우 모두, 이 앱의 `js/speech.js`의 `speak()`를 해당 서비스의 TTS API
  호출로 바꿔주면 (오디오 파일을 받아 `<audio>`로 재생) 훨씬 영화 속
  자비스에 가까운 음색을 들을 수 있어요.

> 참고: "목소리"와 "성격"은 별개예요. 자비스처럼 정중하고 격식 있는 말투를
> 원한다면, `js/brain.js`의 `SYSTEM_PROMPT`도 함께 다듬어서 캐릭터의 성격을
> 정의해주세요.

---

## 라이선스 주의사항
무료라고 해도 "개인 사용만 가능", "출처 표기 필수", "상업적 이용 시 별도
허가 필요" 등 조건이 다양해요. 다운로드하기 전에 항상 해당 사이트의
이용약관/라이선스 표기를 확인하고, 필요한 경우 크레딧을 표기하세요.
