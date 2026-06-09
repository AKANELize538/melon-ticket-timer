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
3. 업로드 후 폴더 구조가 이렇게 되어야 해요:
   ```
   models/
     mao/
       mao.model3.json     ← 이 파일명이 중요! (아래 2단계 참고)
       mao.moc3
       *.png (텍스처)
       motions/ ...
   ```
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

## 2단계 — 모델 파일명 확인 (중요!)

`mao_pro_ko` 폴더 안의 `.model3.json` **실제 파일 이름**을 확인하세요.
예: `Mao.model3.json`, `マオ.model3.json`, `mao_pro.model3.json` 등.

그 이름을 `js/config.js`의 `modelPath`에 정확히 적어야 자동 로드돼요:
```js
modelPath: 'models/mao/여기에_실제파일명.model3.json',
```
파일명을 알려주시면 제가 바로 맞춰서 수정할게요. (또는 파일을
`mao.model3.json`으로 rename 하면 현재 설정 그대로 작동해요.)

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
