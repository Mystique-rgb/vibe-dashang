# VIBE 知识大赏

用代码逐帧渲染的中文 Motion Graphics 短片合集（抖音/视频号）。

每个项目都在自己的子目录里，技术栈统一为
[MotionHarness](https://motionharness.top) + 原生 DOM/CSS/SVG，
所有动画都是时间 `t` 的纯函数 —— 同一时刻反复渲染结果完全一致。

## 项目

| 目录 | 主题 | 时长 |
|---|---|---|
| [vibe-probability/](vibe-probability/) | 平均值不是保证 —— 那个 63% 是与难度无关的常数 1−1/e | 66s |
| [seven-wonders/](seven-wonders/) | 古代七大奇迹 —— 七座建筑只剩一座还在 | 50s |
| [seven-sins/](seven-sins/) | 七大宗罪 —— 每一罪都有名字 | 50s |
| [natural-wonders/](natural-wonders/) | 传统七大自然奇观 —— 珠峰压轴 | 50s |
| [seven-treasures/](seven-treasures/) | 中华七大国宝 —— 大盂鼎压轴 | 53s |
| [seven-inventions/](seven-inventions/) | 七大发明 —— 金属线稿 + 双栏知识卡 | 53s |
| [seven-flames/](seven-flames/) | 斗破苍穹 · 七大异火 —— 异火榜倒数 | 50s |
| [zhang-guimei/](zhang-guimei/) | 天亮以前 · 张桂梅 —— 90 秒人物短片 | 90s |
| [if-you-were-gauss/](if-you-were-gauss/) | 假如你是高斯 —— 37 场 82 镜 | 120s |
| [if-you-were-newton/](if-you-were-newton/) | 假如你是牛顿 —— 33 场 87 镜 | 120s |
| [the-liar/](the-liar/) | 说谎者 ·《十日终焉》游戏图解 | 40s |

## 共同的工程约定

**节拍网格**：所有镜头边界写成 `bar(n)`，不手算时间。
每支片子的 BPM 用谱通量自相关实测，不是估的。

**纯函数渲染**：画面由秒数 `t` 决定，随机数固定种子，任意 seek 结果一致。

**转场是"揭示"不是"淡入"**：出镜镜头在上层用 clip-path / mask / scale / blur 让开，
露出下层已经就位的下一镜头。图层透明，所以条纹类转场必须叠加散焦退场，
否则两层文字会叠在一起。

**数字必须锁字幕**：连续滚动会产生字幕里没有的中间值，观众会误读。
所有滚动数字都离散化到字幕里存在的档位。

**音效只在标记位置**：全片只有指定的落点有声音，其余静音。
音色按参考片实测的频谱质心选，不靠猜。

## 运行

```bash
npm i -g @motionharness/cli
cd <项目目录>
mh open --browser          # 打开 Studio 逐帧查看
mh render out.mp4 --json '{"fps":30,"quality":"high"}'
```

各项目的详细说明见各自目录下的 README。

## 说明

成片体积大（每支约 60–170 MB），不进仓库，从 Release 下载。
渲染缓存（`.mh/`）和预览帧（`.tmp/`）也排除在外，可以重新生成。

**混音产物**（`assets/mix.wav`、`foley.wav` 等）同样不进仓库 ——
各项目目录里都有构建脚本（`build_audio.py` / `mix.py` / `scripts/*.py`），
从 `assets/` 里的源素材重新生成即可。
