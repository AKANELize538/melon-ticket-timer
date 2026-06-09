# models/mao/ — 여기에 Mao 모델을 넣으세요

이 폴더에 `mao_pro_ko\runtime\` 폴더의 **내용물 전부**를 업로드하세요.
(하위 폴더 포함 — 하나라도 빠지면 모델이 안 떠요.)

## 올려야 할 정확한 구조

```
models/mao/
  mao_pro.model3.json     ← ★ 핵심 모델 파일
  mao_pro.moc3            ← 모델 데이터
  mao_pro.cdi3.json       ← 보조(파라미터 이름)
  mao_pro.physics3.json   ← 흔들림(머리/모자/로브)
  mao_pro.pose3.json      ← 팔 파트
  mao_pro.4096/
    texture_00.png        ← ⚠️ 텍스처 (이 하위폴더 꼭 같이!)
  expressions/
    exp_01.exp3.json ~ exp_08.exp3.json   ← 표정 8종
  motions/
    mtn_01~04.motion3.json
    special_01~03.motion3.json            ← 모션 7종
```

업로드가 끝나면 이 README.md 는 지워도 되고 그냥 둬도 돼요.
`js/config.js` 의 `modelPath: 'models/mao/mao_pro.model3.json'` 가
이 위치를 자동으로 불러와요.

## ⚠️ 브랜치 주의

이 파일들은 반드시 **`claude/newrosama-3d-ai-character-nLNed`** 브랜치에
올려야 해요. GitHub에서 파일을 업로드할 때 화면 왼쪽 위 브랜치 선택이
이 브랜치로 되어 있는지 꼭 확인하세요.
