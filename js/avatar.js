// 2D avatar stage for Newrosama, built on PixiJS + pixi-live2d-display.
//
// Without a Live2D model file, a built-in placeholder character is shown —
// a cute pixel-style chibi with blinking eyes, rosy cheeks, hair bow, and
// a bobbing idle animation. The mouth opens and closes when Newrosama talks.
//
// Call stage.loadModel(url) to load a real .model3.json (Cubism 4 format).
// The model is auto-centered and scaled. Clicking/tapping on the model
// triggers its built-in hit-area motions (head tap, body tap, etc.).
//
// Required globals (must be loaded as <script> tags before this module):
//   • window.PIXI             — pixi.js v7
//   • window.PIXI.live2d      — pixi-live2d-display (cubism4 bundle)

export class AvatarStage {
  constructor(canvas) {
    this.canvas = canvas;
    this.live2dModel = null;
    this._talking = false;
    this._t = 0;
    this._lipSyncIds = ['ParamA', 'ParamMouthOpenY'];

    this.app = new PIXI.Application({
      view: canvas,
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight,
      backgroundColor: 0x171225,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    this.placeholder = new PIXI.Graphics();
    this.app.stage.addChild(this.placeholder);
    this._drawPlaceholder();

    window.addEventListener('resize', () => {
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.app.renderer.resize(w, h);
      if (this.live2dModel) this._fitModel(this.live2dModel);
      this._drawPlaceholder();
    });

    this.app.ticker.add((dt) => {
      this._t += dt * 0.016; // ~real seconds
      if (this.placeholder.visible) {
        this._drawPlaceholder();
      } else if (this.live2dModel) {
        this._driveLipSync();
      }
    });
  }

  setTalking(isTalking) {
    this._talking = isTalking;
  }

  // Continuously drive the Live2D mouth-open parameter(s) so the model's lips
  // move while Newrosama is speaking. Different models name this differently —
  // the Mao sample uses "ParamA" (declared in its model3.json LipSync group),
  // while many VRoid/Cubism models use "ParamMouthOpenY". We read the real
  // LipSync ids from the model on load, and fall back to common names.
  _driveLipSync() {
    const core = this.live2dModel?.internalModel?.coreModel;
    if (!core) return;
    const target = this._talking ? Math.abs(Math.sin(this._t * 14)) * 0.9 : 0;
    for (const id of this._lipSyncIds) {
      try {
        core.setParameterValueById(id, target);
      } catch {
        // param not present on this model — ignore
      }
    }
  }

  // Read the model's declared LipSync parameter ids from its settings, with
  // sensible fallbacks so lip-sync works even if the group is missing.
  _resolveLipSyncIds(model) {
    const fallback = ['ParamA', 'ParamMouthOpenY'];
    try {
      const groups =
        model?.internalModel?.settings?.groups ||
        model?.internalModel?.settings?.json?.Groups ||
        [];
      const lip = groups.find(
        (g) => (g.Name || g.name || '').toLowerCase() === 'lipsync'
      );
      const ids = lip?.Ids || lip?.ids;
      if (Array.isArray(ids) && ids.length) {
        return [...new Set([...ids, ...fallback])];
      }
    } catch {
      // settings shape varies between versions — just use fallback
    }
    return fallback;
  }

  /**
   * Load a Cubism 4 Live2D model.
   * @param {string|File[]} source  Either a URL to a .model3.json, OR an array
   *   of File objects (the whole model folder picked via an <input webkitdirectory>).
   *   A Live2D model is never a single file — it needs its .moc3, textures and
   *   motions alongside — so folder/URL loading is required, not single-file.
   */
  async loadModel(source) {
    const Live2DModel = window.PIXI?.live2d?.Live2DModel;
    if (!Live2DModel) {
      throw new Error(
        'pixi-live2d-display가 로드되지 않았어요.\n' +
        'live2dcubismcore.min.js가 먼저 로드되는지 확인하거나, ' +
        'SDK 파일을 /libs/ 폴더에 직접 넣어주세요 (SETUP.md 참고).'
      );
    }

    if (this.live2dModel) {
      this.app.stage.removeChild(this.live2dModel);
      this.live2dModel.destroy();
      this.live2dModel = null;
    }

    const model = await Live2DModel.from(source, { autoInteract: true });
    this.placeholder.visible = false;
    this.live2dModel = model;
    this._lipSyncIds = this._resolveLipSyncIds(model);
    this.app.stage.addChild(model);
    this._fitModel(model);

    // Tapping the avatar plays a random expression/motion (Mao has 8 of each).
    model.on('hit', (hitAreas) => {
      if (hitAreas.includes('Head') || hitAreas.includes('HitAreaHead')) {
        model.expression?.();
      } else {
        model.motion?.('');
      }
    });

    return model;
  }

  resetToPlaceholder() {
    if (this.live2dModel) {
      this.app.stage.removeChild(this.live2dModel);
      this.live2dModel.destroy();
      this.live2dModel = null;
    }
    this.placeholder.visible = true;
  }

  _fitModel(model) {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const origW = model.internalModel?.originalWidth ?? model.width;
    const origH = model.internalModel?.originalHeight ?? model.height;
    const scale = Math.min((w * 0.9) / origW, (h * 0.95) / origH);
    model.scale.set(scale);
    model.x = (w - model.width) / 2;
    model.y = (h - model.height) / 2;
  }

  _drawPlaceholder() {
    const g = this.placeholder;
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    const cx = w / 2;
    const cy = h / 2;
    const t = this._t;

    // Gentle up-down idle bob
    const bob = Math.sin(t * 1.6) * 7;
    // Hair accessory sway
    const sway = Math.sin(t * 2.2) * 4;
    // Blinking: closed when sin > 0.96
    const blink = Math.sin(t * 2.1) > 0.96;
    // Mouth height while talking
    const mouthH = this._talking ? 5 + Math.abs(Math.sin(t * 14)) * 6 : 2;

    g.clear();

    // ── Ground shadow ──────────────────────────────────────────────────────
    g.beginFill(0x0b081a, 0.25);
    g.drawEllipse(cx, cy + 140 + bob, 58, 12);
    g.endFill();

    // ── Dress / body ───────────────────────────────────────────────────────
    // Skirt flare
    g.beginFill(0xff6fa0);
    g.drawEllipse(cx, cy + 110 + bob, 55, 22);
    g.endFill();
    // Main dress body
    g.beginFill(0xff7fae);
    g.drawRoundedRect(cx - 36, cy + 18 + bob, 72, 90, 14);
    g.endFill();
    // White apron strip
    g.beginFill(0xfff0f5, 0.7);
    g.drawRoundedRect(cx - 16, cy + 22 + bob, 32, 64, 8);
    g.endFill();
    // Collar white
    g.beginFill(0xffffff, 0.9);
    g.drawEllipse(cx, cy + 20 + bob, 28, 9);
    g.endFill();

    // ── Neck ───────────────────────────────────────────────────────────────
    g.beginFill(0xffe2d6);
    g.drawRect(cx - 10, cy - 3 + bob, 20, 26);
    g.endFill();

    // ── Head ───────────────────────────────────────────────────────────────
    g.beginFill(0xffe2d6);
    g.drawEllipse(cx, cy - 55 + bob, 52, 58);
    g.endFill();

    // ── Hair (main purple) ─────────────────────────────────────────────────
    // Back hair
    g.beginFill(0x6440bc);
    g.drawEllipse(cx, cy - 95 + bob, 55, 40);
    // Side strands
    g.drawEllipse(cx - 47, cy - 42 + bob, 13, 34);
    g.drawEllipse(cx + 47, cy - 42 + bob, 13, 34);
    g.endFill();

    // Ponytail (swaying gently)
    g.beginFill(0x7850d4);
    g.drawEllipse(cx + 52 + sway, cy - 10 + bob, 12, 42);
    g.endFill();

    // ── Hair bow (pink, swaying same direction) ────────────────────────────
    g.beginFill(0xff4488);
    // Left wing
    g.moveTo(cx + 34 + sway, cy - 100 + bob);
    g.lineTo(cx + 24 + sway, cy - 118 + bob);
    g.lineTo(cx + 50 + sway, cy - 106 + bob);
    g.closePath();
    // Right wing
    g.moveTo(cx + 66 + sway, cy - 100 + bob);
    g.lineTo(cx + 76 + sway, cy - 118 + bob);
    g.lineTo(cx + 50 + sway, cy - 106 + bob);
    g.closePath();
    g.endFill();
    // Bow knot
    g.beginFill(0xff6699);
    g.drawCircle(cx + 50 + sway, cy - 104 + bob, 7);
    g.endFill();

    // ── Eyes ───────────────────────────────────────────────────────────────
    const eyeY = cy - 57 + bob;
    if (!blink) {
      // Eye whites
      g.beginFill(0xffffff);
      g.drawEllipse(cx - 17, eyeY, 12, 13);
      g.drawEllipse(cx + 17, eyeY, 12, 13);
      g.endFill();
      // Iris (sky-blue purple)
      g.beginFill(0xa0c8ff);
      g.drawEllipse(cx - 17, eyeY, 9, 10);
      g.drawEllipse(cx + 17, eyeY, 9, 10);
      g.endFill();
      // Pupil
      g.beginFill(0x2a1f50);
      g.drawEllipse(cx - 17, eyeY + 1, 5, 6);
      g.drawEllipse(cx + 17, eyeY + 1, 5, 6);
      g.endFill();
      // Sparkle
      g.beginFill(0xffffff);
      g.drawCircle(cx - 12, eyeY - 4, 2.5);
      g.drawCircle(cx + 22, eyeY - 4, 2.5);
      g.drawCircle(cx - 19, eyeY + 3, 1.2);
      g.drawCircle(cx + 15, eyeY + 3, 1.2);
      g.endFill();
      // Eyelashes (simple line)
      g.lineStyle(1.8, 0x2a1f50, 1);
      g.moveTo(cx - 27, eyeY - 9); g.lineTo(cx - 22, eyeY - 13);
      g.moveTo(cx - 20, eyeY - 12); g.lineTo(cx - 16, eyeY - 14);
      g.moveTo(cx + 7, eyeY - 13); g.lineTo(cx + 12, eyeY - 12);
      g.moveTo(cx + 14, eyeY - 14); g.lineTo(cx + 20, eyeY - 12);
      g.lineStyle(0);
    } else {
      // Closed eyes (thin curved lines)
      g.lineStyle(2.5, 0x4a3870, 1);
      g.arc(cx - 17, eyeY + 5, 10, Math.PI + 0.3, -0.3, false);
      g.arc(cx + 17, eyeY + 5, 10, Math.PI + 0.3, -0.3, false);
      g.lineStyle(0);
    }

    // ── Mouth ──────────────────────────────────────────────────────────────
    g.beginFill(0xc8506a);
    g.drawEllipse(cx, cy - 28 + bob, 10, mouthH);
    g.endFill();
    // Smile line
    if (!this._talking) {
      g.lineStyle(1.5, 0xb04058, 0.7);
      g.arc(cx, cy - 32 + bob, 9, 0.2, Math.PI - 0.2);
      g.lineStyle(0);
    }

    // ── Rosy cheeks ────────────────────────────────────────────────────────
    g.beginFill(0xff9ab0, 0.32);
    g.drawEllipse(cx - 35, cy - 44 + bob, 14, 9);
    g.drawEllipse(cx + 35, cy - 44 + bob, 14, 9);
    g.endFill();
  }
}
