# 说谎者 ·《十日终焉》游戏图解

MotionHarness Standard 工程，1920 × 1080，30 fps，40.10 秒。

在这个目录运行 `mh open` 可以进入 Studio。`src/timeline.js` 集中维护字幕、切镜帧和鼓点，`src/diagrams.js` 绘制游戏图解，`src/scene.js` 绘制开场及转场。导出用 `mh render "说谎者-图解.mp4" --json '{"fps":30,"quality":"high"}'`，请使用一个尚不存在的输出路径。

音频使用用户最终给出的 `11月24日.MP3`。开头保留原音里的两句人羊台词，说到「说谎者」的第一个字时切进片名，转场起点为第 142 帧（4.733 秒）。之后依靠字幕和图解叙述，沿用原曲鼓点，没有新增配音。正文使用约 67 px 字幕。

## 音效重制

当前版本有 74 个音效事件。圆桌入场、入座、表决、问号、座钟和计票共用 `src/marked-timing.js` 的画面和音效时点。`scripts/render-sound-design.py` 读取原始音乐、基础避让音乐、`src/sound-cues.js` 和 `assets/sfx/`，生成 Studio 当前使用的 `assets/foley-precision.wav` 和 `assets/music-precision.wav`。采样列表见 `assets/sfx/README.md`。

## 素材和剧情出处

- 原著《十日终焉》第 2、3、8、9、10 章。密室用量是书中齐夏的估算。[番茄小说原著目录](https://fanqienovel.com/page/7143038691944959011)
- 改版的开场与主持人采用新生成的透明角色立绘 `assets/sheep-illustration.png`，轮廓光、扫光、空间粒子和环绕字在动画内叠加。[原角色参考](https://www.douyin.com/video/7692706568773346490)
- 规则讲解选材、3D 环绕特效和节奏参考。[内容参考](https://www.douyin.com/video/7703406984921386274) · [环绕字参考](https://www.douyin.com/video/7524708815212760335) · [快剪参考](https://www.douyin.com/video/7708037879078931738)

- 黑影到侧光显形的开场节奏参考。[鹤玖枫「西装暴徒」](https://www.douyin.com/video/7229250584652696890)
