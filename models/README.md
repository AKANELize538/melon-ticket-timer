# models/

여기에 Live2D 모델(mao_pro_ko)을 넣으세요. 자세한 시연 절차는 저장소
루트의 **`DEMO.md`** 를 보세요.

## 기대하는 구조

```
models/
  mao/
    mao.model3.json     ← js/config.js 의 modelPath 와 이름이 일치해야 함
    mao.moc3
    *.png               (텍스처)
    motions/            (모션 파일들)
    *.physics3.json     (있으면 좋음 — 머리카락 흔들림 등)
```

## 자동 로드

`js/config.js` 설정으로 페이지가 열릴 때 자동으로 불러와요:

```js
modelPath: 'models/mao/mao.model3.json',
autoLoadModel: true,
```

폴더 안 `.model3.json` 의 실제 파일명이 다르면, 위 `modelPath` 를 그
이름으로 바꾸거나 파일을 `mao.model3.json` 으로 rename 하세요.

## 주의

Live2D 모델은 **폴더 통째로** 필요해요(.moc3·텍스처·모션 포함).
`.model3.json` 하나만 올리면 텍스처를 못 찾아 로드가 실패해요.
