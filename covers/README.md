# 封面工程

3:4 竖版封面（1080×1440），和对应正片用同一套配色与线稿几何 —— 封面不是另画的，
是把片子里的主体图形和标题处理搬过来重排。

| 目录 | 对应正片 | 主体 |
|---|---|---|
| cover-34/ | seven-wonders（古代七大奇迹） | 胡夫金字塔 + 七座小图标 |
| cover-treasures/ | seven-treasures（中华七大国宝） | 青铜器线稿 |
| cover-natural/ | natural-wonders（七大自然奇观） | 珠峰 |

每个工程 3 秒，`mh.json` 里 `duration: 3`，导出后用 `ffmpeg -frames:v 1` 取静帧。
成品同时给 PNG（无损）和 JPG（质量 94，可上传）。

## 运行

```bash
cd covers/cover-34
mh preview --output cover.png --time 3
```
