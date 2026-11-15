# 概率短片 · 平均值不是保证

一支 66 秒的 Motion Graphics 短片，全部画面由代码逐帧渲染（无素材、无生图）。
主题：**「平均试 50 次就能成」这句话骗了多少人** —— 平均值不等于保证，
而且那个 63% 是与难度无关的常数 1−1/e。

## 核心论点

```
单次成功率 p = 2%
P(至少成一次) = 1 − (1−p)^n

试 50 次  → 63.6%
试 229 次 → 99.0%

把 n 取成 1/p（"平均该成功的次数"），P 收敛到 1 − 1/e ≈ 63.2%
这个数与 p 无关 —— 换成 1%、0.5%，同样停在 63%。
```

所有数字由公式实时计算，观众拿计算器可以验算。

## 技术栈

[MotionHarness](https://motionharness.top)（`mh` CLI）+ 原生 DOM/CSS/SVG 动画。
所有动画都是**时间 t 的纯函数** —— 同一时刻反复渲染结果完全一致，保证导出不漂移。

## 目录

```
src/
  scene.js          入口：镜头装配 + 全屏闪层（screen 混合）
  theme.js          设计令牌 + 节拍网格（BEAT/BAR/PHASE）
  kit.js            缓动、DOM、SVG、确定性随机
  text.js           逐字动画、老虎机滚轮、离散计数
  ui.js             三层文字站位、双语字幕、章节标题
  widgets.js        超大数值、印章、划线、翻牌点阵
  chart.js          坐标系、曲线生长、光点、对比条
  particles.js      飞散、浮尘、冲击环
  fx.js             13 种特效原语（震动/闪光/速度线/辉光/光爆/光斑）
  transitions.js    23 种转场（含"每像素只有一层"约束）
  bg.js             Canvas 背景：暖光呼吸 + 颗粒 + 暗角
  timing.js         镜头表 + 事件表 + 字幕表 + 闪光表（唯一真源）
  shots/            act0–act5 + chapter，共 32 个镜头
tools/
  gen_sfx.py        音效层（用 earshot 的 shipped sound bank 渲染）
  mix_master.py     BGM + 音效母带处理
  dump_timing.mjs   导出 timing.js 给 Python 用
assets/
  music.mp3         BGM（114.79 BPM）
  sfx.wav           音效层（只有标记位置有声音）
  refsfx/           从对标视频谱减法提取的 40 个音效样本
deliverables/
  B_QA_report.md    完整质检报告
  B_cover.png       封面
```

## 节奏

音乐网格：`BEAT = 0.5227s`，`BAR = 2.0908s`，`PHASE = 0.026s`（114.79 BPM）。
所有镜头边界写成 `bar(n)`，不手算时间。

| 段落 | 时间 | 镜头数 | 功能 |
|---|---|---|---|
| 钩子 | 0 – 16.75s | 8 | 100 点 → 2 金 → 98 红叉 → 重排"50" → 63.6% → 36.4% → 划掉"保证" |
| 章卡 | 16.75s | 1 | 「重复实验」 |
| 规则 | 18.84 – 25.11s | 3 | 只有成或败 / 彼此不影响 / 概率不改变 |
| 图表 | 25.11 – 39.74s | 9 | 曲线生长 → 114 次 90% → 229 次 99% → 三线同点 63.2% |
| 对比冲刺 | 39.74 – 46.02s | 4 | 10/50/229 对比 → 114 连闪 → 差的不是运气 |
| 案例 | 46.02 – 54.38s | 4 | 抽卡 / 投简历 / 伯努利出处 |
| 公式 | 54.38 – 62.75s | 2 | P = 1−(1−p)^n → 代入 1/p → 1−1/e |
| 落版 | 62.75 – 66.05s | 2 | 平均值不是承诺 / 别停，再试一次 |

转场纪律：段落内部全靠揭示，硬切只给段落转折（全片 2 次硬切）。

## 设计令牌

| | |
|---|---|
| 底色 | `#00000C` 带极微蓝的近黑 |
| 主文字 | `#F2EBDC` 米白（不是纯白） |
| 唯一强调 | `#F3C452` 金，每屏最多 1 处 |
| 否定 | `#DD2F2D` 猩红 |
| 节拍 | `BEAT = 0.5227s`，`BAR = 2.0908s` |

## 运行

需要先安装 `mh`：

```bash
npm i -g @motionharness/cli
```

预览：

```bash
mh open --browser
```

重新生成音效层（需要 [earshot](https://github.com/Leonxlnx/earshot) 的 sound bank）：

```bash
node tools/dump_timing.mjs > .tmp/timing.json
EARSHOT_REPO=/path/to/earshot python tools/gen_sfx.py
python tools/mix_master.py
```

渲染：

```bash
mh render out.mp4 --json '{"fps":30,"quality":"high"}'
```

## 音效设计

只有 19 个标记位置有音效，其余 91% 时间纯静音。

音效来自 earshot 的 shipped sound bank（252 个专业音效），选的是"叮"频段：
频谱质心 **2772 Hz**，对标参考片实测 **2645 Hz**。

36 个落点用了 **33 种不同音效**（8 个可调音高的铃音 × 多音高 + 6 个固定短脆音），
不会听出重复。每个落点比周围 BGM 高出 **+13.4 ~ +19.4 dB**。

## 规格

```
1920×1080 / 30fps / 66.07s
H.264 + AAC / −17.0 LUFS-I / −2.2 dBTP
```

成片见 [deliverables](deliverables/) 目录说明，或从 Release 下载。
