# 假如你是高斯

依据目录中的审定分镜制作。全片 1920 × 1080、30 fps，37 场、82 镜。主画面由 MotionHarness 标准场景实时绘制，工程时长 120.100 秒。审定稿末点为 120.11 秒，按最接近的 30 fps 帧收尾。

## 打开和导出

在本目录执行 `mh open . --browser` 进入 MotionHarness Studio。也可以在 Studio 中打开这个文件夹。

```sh
mh render ./导出.mp4 --json '{"fps":30,"quality":"high"}'
```

`src/storyboard.js` 记录审定稿切点与旁白。`src/act-one.js` 至 `src/act-three.js` 绘制逐场画面，`src/scene.js` 合成画面、字幕、角落信息卡和转场。`mh.json` 中的音轨使用项目内的最终混音，工程可以直接重新出片。

## 字幕解说版

左上大字承担叙事，朱红色强调动作或关键词。右上信息卡在需要时提示年代、地点或史料背景。字幕文案由 `src/text-cues.js` 管理，字号与排布在 `src/caption-layer.js`。钟摆与目镜段留给画面和环境声。

`src/opening-accents.js` 把原曲开头的音头映射为星点、光圈与坐标线。第一组三个强动作落在 0.100、0.433 和 0.867 秒的最近帧，2.600 秒接首个鼓点切镜。`src/transitions.js` 管理翻页、光退场、坐标脉冲、雪尘、星光及窗框遮切。原 37 场和镜头时间轴保留。

## 音轨

- 《Ja SoFri Por Amor》从原始 0 秒起播，保留歌曲本身的人声和木槌、纸张、机械动作等拟音。字幕版的播放轨是 `assets/audio/mix-captions.wav`，轨内没有解说配音。
- 98.32 秒仍是最大叙事转折。项目的整帧入口在 98.333 秒，99.17 秒出现「扎赫找到了！」，与画内「谷神星」同拍。
- [实录拟音来源](assets/audio/foley/SOURCES.md) · [小宝音效室采样与点位](assets/audio/studio/CUES.md)
- 重新混音需 Python、NumPy、SciPy、SoundFile、edge-tts 和 FFmpeg。执行 `python scripts/audio-mix.py --captions-only` 重建字幕版音轨。已附原曲、拟音、旧版旁白素材与混音，开工程可以直接预览或导出。
