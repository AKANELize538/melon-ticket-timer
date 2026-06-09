// Project Kaguya — central config for the Newrosama demo.
//
// Edit this file to point at your uploaded Live2D model and to tune the
// demo defaults. It is safe to commit (no secrets here). API keys are NEVER
// stored in this file — they live only in the browser's localStorage, entered
// through the in-app ⚙ Settings panel.

export const CONFIG = {
  // Path to your Live2D model's .model3.json, relative to index.html.
  // After you upload your model folder to  models/mao/  this will auto-load
  // on startup. If the file isn't there yet, the cute placeholder character
  // is shown instead (no error).
  //
  // ▸ Set to the real filename inside your folder, e.g.:
  //     'models/mao/Mao.model3.json'
  //     'models/mao/mao_pro_ko.model3.json'
  // ▸ Set to null to always start with the placeholder character.
  modelPath: 'models/mao/mao.model3.json',

  // Try to auto-load modelPath when the page opens (best for the tablet demo,
  // so you don't have to pick a folder by hand on the device).
  autoLoadModel: true,

  // Default spoken language: 'ja' | 'ko' | 'en'
  defaultLang: 'ja',

  // Voice defaults. mode: 'web' (tablet-friendly Himari) | 'local' | 'off'
  voicevox: {
    mode: 'web',
    speakerId: 14, // 14 = 冥鳴ひまり (Himari)
  },
};
