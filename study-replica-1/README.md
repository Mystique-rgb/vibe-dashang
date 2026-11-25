# 复刻实验 1 · 人物轮廓提取

对标视频逆向的实验工程。目的不是出片，是**把参考画面里的人形轮廓转成可绘制的折线数据**。

## 流程

```
ref.png              参考帧
  ↓ mask2.py / mask3.py        抠出人形掩码
mask-person.png      人形掩码
mask-hole.png        镂空掩码（轮廓内的洞）
  ↓ outline.py                 find_contours + RDP 简化
person-outline.json  轮廓折线（最终产物，src 直接读它）
  ↓ src/scene.js               MotionHarness 渲染
```

`fitcircle.py` / `glow.py` / `analyze.py` / `verify_outline.py` 是各环节的调试脚本。

## 教训

- **射线法和轮廓追踪都会被耳朵、脖子干扰**，最后是靠网格叠加图目视读坐标才对上
- Catmull-Rom 平滑会把折角磨圆 → 必须用直线段 + 小圆角，`lineJoin='miter'`
- 辉光太宽会让边缘发虚显圆 → 收到 0.062×s

4 秒 / 1280×720 / 30fps，纯验证用。
