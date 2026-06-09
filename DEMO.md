# 📱 내일 시연 가이드 (갤럭시 탭 S11 + GitHub Pages)

태블릿에서 URL만 열면 뉴로사마(Mao 아바타 + 히마리 목소리)가 작동하도록
구성했어요. 아래 순서대로만 하면 돼요.

---

## ✅ 환경 정리 (왜 이렇게 했는지)

| 항목 | 태블릿 + 웹에서 작동? | 이 프로젝트의 처리 |
|---|---|---|
| Live2D Mao 아바타 | ✅ (저장소에 업로드 시) | 시작 시 자동 로드 |
| 히마리 목소리 | ✅ **웹 VOICEVOX(tts.quest)** 사용 | 기본 모드 = `web` |
| 마이크 음성인식 | ✅ Chrome(안드로이드) | 그대로 작동 |
| AI 대화(Groq) | ⚠️ 키 필요 | 데모 답변으로도 작동 |
| VOICEVOX 데스크톱 앱 | ❌ 태블릿 설치 불가 | 웹 모드로 대체 |

> 핵심: 태블릿엔 VOICEVOX 앱을 깔 수 없어서, **HTTPS로 호출되는 웹
> VOICEVOX(tts.quest)** 로 히마리 목소리를 냅니다. 설치가 전혀 필요 없어요.

---

## 1단계 — Mao 모델을 저장소에 올리기 (사장님이 직접)

> ⚠️ 저는 클라우드에서 작업 중이라 사장님 PC의 `바탕화면\mao_pro_ko`에
> 접근할 수 없어요. 이 단계는 직접 해주셔야 해요.

### 방법 A — GitHub Codespace에 드래그 (가장 쉬움)
1. GitHub 저장소 → `Code` ▸ `Codespaces` ▸ 새 Codespace 열기
2. 왼쪽 파일 탐색기에서 `models/` 폴더 위에 마우스 우클릭 → `Upload...`
   (또는 `mao_pro_ko` 폴더를 통째로 드래그 앤 드롭)
3. 사장님 모델은 `mao_pro_ko\runtime\` 안에 들어있어요. 그 **runtime 폴더
   안의 내용물 전부(하위 폴더 포함)** 를 `models/mao/` 에 올려야 해요.
   model3.json을 분석해보니 정확히 이 구조가 필요해요:
   ```
   models/mao/
     mao_pro.model3.json        ← 진짜 모델 파일 (★ 핵심)
     mao_pro.moc3               ← 모델 데이터
     mao_pro.cdi3.json          ← 보조(파라미터 이름)
     mao_pro.physics3.json      ← 흔들림(머리/모자/로브 16종)
     mao_pro.pose3.json         ← 팔 파트
     mao_pro.4096/
       texture_00.png           ← ⚠️ 텍스처(하위폴더! 꼭 같이)
     expressions/
       exp_01.exp3.json ~ exp_08.exp3.json   ← 표정 8종
     motions/
       mtn_01~04.motion3.json, special_01~03.motion3.json  ← 모션 7종
   ```
   ⚠️ **`mao_pro.4096/` 폴더(텍스처)와 `expressions/`, `motions/` 폴더를
   빠뜨리면 안 돼요.** 하나라도 빠지면 모델이 깨지거나 안 떠요.
   `.cdi3.json` 은 모델 파일이 아니라 보조 파일이에요.
4. Codespace 터미널에서:
   ```bash
   git add models/
   git commit -m "Add Mao Live2D model"
   git push
   ```

### 방법 B — 웹에서 직접 업로드
저장소 페이지 → `models` 폴더 → `Add file` ▸ `Upload files` →
mao_pro_ko 폴더 안 파일 전부 드래그 → Commit.

---

## 2단계 — 모델 파일명 (확인 완료 ✓)

사장님 모델 파일명은 **`mao_pro.model3.json`** 으로 확인됐어요.
`js/config.js` 에 이미 맞춰뒀어요:
```js
modelPath: 'models/mao/mao_pro.model3.json',
```
runtime 폴더 내용을 `models/mao/` 에 그대로 올리면 자동 로드돼요.

---

## 3단계 — GitHub Pages 켜기 (한 번만)

1. 저장소 → `Settings` → `Pages`
2. `Build and deployment` → Source: **GitHub Actions** 선택
3. 끝! 이제 이 브랜치에 push할 때마다 자동 배포돼요.
4. 1~2분 뒤 주소 확인:
   ```
   https://akanelize538.github.io/melon-ticket-timer/
   ```
   (`Actions` 탭에서 초록불 ✓ 뜨면 완료)

---

## 4단계 — 태블릿에서 열기 (시연)

1. 갤럭시 탭 S11에서 **Chrome**으로 위 주소 열기
2. 🎤 마이크 버튼 누르기 → 권한 "허용"
3. 일본어로 말 걸기 → 히마리 목소리로 대답! 🎉

> 💡 첫 음성은 tts.quest가 잠깐 준비하느라 1~3초 걸릴 수 있어요.
> 더 빠르게 하려면 tts.quest 무료 키를 설정에 넣으면 돼요(아래).

---

## (선택) 더 빠른 히마리 목소리 — tts.quest 키

무료 키 없이도 작동하지만, 라이브 시연에서 지연을 줄이려면:
1. https://su-shiki.com/api/ 에서 무료 키 발급 (reCAPTCHA 통과)
2. 앱 ⚙ 설정 → "tts.quest API 키" 칸에 붙여넣기 → 저장
   (키는 그 기기 브라우저에만 저장돼요. 저장소엔 안 올라가요.)

## (선택) 진짜 AI 대화 — Groq 키

지금은 키 없이도 미리 준비된 답변으로 시연 가능해요. 진짜 LLM 대화를
원하면 ⚙ 설정 → AI 두뇌 연결에 Groq 키 입력. (이 키는 비용이 들 수 있으니
공개 파일에 넣지 말고 반드시 설정 창에만 입력하세요.)
