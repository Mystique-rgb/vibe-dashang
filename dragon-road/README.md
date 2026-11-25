# 龙族｜这一次，你赶到了

MotionHarness Standard 工程。1920 × 1080，30 fps，3653 帧，121.767 秒。故事从《龙族Ⅰ》推进至《龙族Ⅲ》，红井救援开始进入同人结局。原授意分镜在上一级目录。

- `src/timeline.mjs` 是 79 镜切点，`src/shots.mjs` 是各镜头的构图、角色和运镜。
- `src/captions.mjs` 存放字幕及时间。片头和快速段落的相邻短句在 `src/scene.js` 合并显示。
- `src/world.mjs`、`src/set-dressing.mjs` 和 `src/lighting.mjs` 负责场景、陈设与分层灯光。`src/cast.mjs` 和 `src/portraits.mjs` 负责角色和脸部特征。`src/action.mjs` 负责芬里厄和红井打斗镜头。画面仅依赖当前时间，可以跳帧、倒回或单帧渲染。
- 工程从 `assets/mix.wav` 播放立体声混音。`assets/music.mp3` 是用户提供的原曲，音乐从源文件 0 秒原速开始。`assets/effects.wav` 是独立音效轨。成片的对白通过画面字幕呈现。

在该目录运行 `mh open` 可打开 Studio。导出新版本时使用 `mh render '../龙族-新版本.mp4' --json '{"codec":"h264","quality":"high"}'`。重做字幕与音频可运行 `python scripts/prepare.py`，需要 FFmpeg、NumPy、SciPy 和上一级审稿文件。

## 审看位置

- 0:33–0:38：夏弥、楚子航、芬里厄与路明非。
- 0:42–0:56：绘梨衣、东京夜景与河岸。
- 1:27–1:34：路明非赶到红井并打退赫尔佐格。
- 1:54–2:01：牵手和并肩走。

造型参考为[动画官网角色关系图](https://ryuzoku-anime.com/1st/character/)及[绘梨衣插图资料](https://www.bilibili.com/read/cv1752257/)。

## 音频

`assets/mix.wav`（或 `mix-captions.wav`）是构建产物，不进仓库。
clone 后先跑目录里的构建脚本（`mix.py` / `scripts/prepare.py` / `scripts/audio-mix.py`）生成，
否则 `mh preview` 会报 `Could not resolve ... wav`。
