# Live2D SDK Setup (one-time, free)

The app loads **Cubism Core** from the Live2D CDN automatically:

```
https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js
```

If you get a 404 or network error for that URL (corporate firewall, offline use, etc.),
do this once:

1. Create a free account at https://www.live2d.com/
2. Download **"Cubism SDK for Web"** from https://www.live2d.com/download/cubism-sdk/
3. Unzip the download — find `CubismSdkForWeb-x-x-x/Core/live2dcubismcore.min.js`
4. Copy that file into this repo's **`libs/`** folder
5. In `index.html`, change the cubism CDN `<script>` tag from:
   ```html
   <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
   ```
   to:
   ```html
   <script src="libs/live2dcubismcore.min.js"></script>
   ```

The file itself is proprietary (Live2D Inc.) and is NOT committed to this repo —
the `libs/` folder is git-ignored for exactly this reason.

## Free Live2D models to use with Newrosama

| Where | Link |
|---|---|
| Live2D official sample models | https://www.live2d.com/download/sample-data/ |
| nizima free models | https://nizima.com/ |
| Booth.pm (search Live2D 無料) | https://booth.pm/ |

Load a model in the app: press **⚙ Settings → Live2D 모델 불러오기**,
browse to the model's `.model3.json` file.
