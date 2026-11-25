# 复刻实验 2 · 人物分层与配色

在实验 1 拿到轮廓之后，做**分层 + 配色**的验证：把参考画面拆成金色 / 紫色 / 亮度几层，
分别量化每一层在画面里的占比和位置。

## 文件

| 文件 | 作用 |
|---|---|
| `an.py` / `an2.py` / `an3.py` | 分析脚本：从参考帧提取颜色层、算占比 |
| `an.json` / `an3.json` | 分析结果 |
| `figure.py` / `fitring.py` / `mkprofile.py` | 生成 `src/lib/figure-data.js` 的几何 |
| `fig-outline.json` / `ring.json` | 轮廓与圆环的折线数据 |
| `src/lib/figure-data.js` | **最终产物**，scene 直接读 |
| `body.png` / `sheet01.jpg` | 参考素材 |

`*.npy`（亮度图、掩码）和 `frames/` 是分析中间产物，已 gitignore，用脚本可重跑。

## 结论（写进七宗罪的）

- V2 的眼睛是**实心球**：36×36 亮圆、填充率 0.78、长宽比 1.0
- 人物占屏比用 `lum>60` 掩码 + 右半区 bbox 量化 → 对标占 47% 宽 / 87% 高

3.2 秒 / 1920×1080 / 30fps，验证用。
