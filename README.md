# VIBE 知识大赏 · 学过的，只有想得起来的

一支 66 秒的 Motion Graphics 短片，全部画面由代码逐帧渲染（无素材、无生图）。
主题：为什么复习了还是会忘，以及真正管用的学习方法。

音乐：117.45 BPM，所有镜头切换锁在小节网格上（`BAR = 2.0434s`）。

## 技术栈

[MotionHarness](https://motionharness.top)（`mh` CLI）+ 原生 DOM/CSS/SVG 动画。

所有动画都是**时间 t 的纯函数**——同一时刻反复渲染结果完全一致，保证导出不漂移。
这是 MotionHarness Standard 项目的硬约束，也是这套代码能逐帧精调的前提。

## 目录

```
src/
  scene.js          入口：装载所有镜头，按时间决定谁在上层
  kit.js            缓动、DOM 构造、遮罩文字、SVG 工具
  text.js           逐字动画：typeOn / rgbSplit / slideIn / wobble / charOut
  ui.js             版式组件：layer / center / kick / foot / goldRule
  theme.js          设计令牌：配色、字体、节拍网格
  bg.js             Canvas 背景：冷光漂移 + 体积光带 + 颗粒 + 暗角
  particles.js      确定性粒子：disperse（飞散）/ motes（浮尘）
  transitions.js    20 种出场转场
  svgkit.js         SVG 描边生长
  bucket.js         漏桶示意图
  shots/
    act0.js         考场 → 一片空白 → 复习到凌晨 → 抛出问题 → 四种努力 → 评委
    chapter.js      第二章 · 机制
    act1.js         评审规则 → 四个提名（熬夜突击/划重点/收藏夹/倍速刷课）
    act2.js         漏桶 → 遗忘曲线 → 复习
    act3.js         颁奖 → 主动回忆 → 间隔重复
    act5.js         融入日常 → 复习节拍
    act4.js         回到考场（同一道题）→ 落版
tools/
  gen_sfx.py        音效层合成脚本（numpy/scipy）
assets/
  music.mp3         BGM
  sfx.wav           音效层（由 gen_sfx.py 生成）
```

## 运行

需要先安装 `mh`：

```bash
npm i -g @motionharness/cli
```

预览（打开 Studio 逐帧查看）：

```bash
mh open --browser
```

重新生成音效层（改了逐字动画的时间要重跑，音效严格对齐 `typeOn` 的 stagger 公式）：

```bash
python tools/gen_sfx.py
```

渲染成片：

```bash
mh render out.mp4 --json '{"fps":30,"quality":"high"}'
```

> `mh render` 的输出路径是位置参数，选项走 `--json`。已有文件不会被覆盖，用新文件名。

## 两个关键设计

**转场是「揭示」不是「淡入」**

出镜镜头在上层（z-index 3），用 clip-path / mask / scale / blur / 旋转「让开」，
露出下层已经就位的下一镜头。这样每个入场都是揭示，比淡入更有速度感。

图层本身是透明的，所以任何"整层旋转"或"整体淡化"的转场都会让两层文字叠在一起。
`flipY` 的解法是羽化蒙版逐列切走 + 快速散焦——保证每个像素上只有一层内容。

**文字动效逐字控制**

参考片的文字是逐字出现的，整行遮罩推出会显得"太整"。
`text.js` 把字符串拆成字符 span，每个字独立控制透明度、位移、模糊和缓动。
全片 24 处主文字都走这套，音效也按同样的 stagger 公式对齐。

## 设计令牌

| | |
|---|---|
| 底色 | `#05070C` 近黑藏青 |
| 主文字 | 白粗无衬线 |
| 强调 | `#E8B44A` 金 |
| 负面 | `#D93A3F` 红 |
| 节拍 | `BEAT = 0.5109s`，`BAR = 2.0434s` |

大面积金色铺在藏青上会发浑（读成橄榄褐），所以金色只用于细线、描边和小面积强调。
