# 音效来源清单

工程里的 15 个音效全部替换为 Freesound CC0 实录素材（原来是 numpy 合成）。
原始预览文件在 `assets/sfx-src/`，处理脚本是 `prep_sfx.py`。

## 槽位对照

| 槽位 | 用途 | Freesound ID | 素材名 | 下载量 | 评分 | 裁切后 |
|------|------|--------------|--------|--------|------|--------|
| `boom` | DROP 低频冲击 | 441593 | Deep Impact | 4797 | ★4.9(47) | 1.60s |
| `hit` | 二次卡点重击 | 348243 | PUNCH-BOXING-02 | 4424 | ★4.9(45) | 0.47s |
| `hit_soft` | 铺垫字卡轻击 | 336495 | LowHit_01 | 1571 | ★4.3(18) | 0.10s |
| `point` | 开场光点 | 332056 | Fast Collision | 4836 | ★3.3(63) | 0.29s |
| `point_hi` | 奇观细节元素（72 次） | 376748 | Fantasy_ui_Button_6 | 2304 | ★4.8(28) | 0.60s |
| `chime` | 场景句出现 | 562196 | snd_fragment_retrieve | 2423 | ★4.9(42) | 0.93s |
| `chime_hi` | 高音点缀 | 383602 | bicycle-bell_09 | 517 | ★5.0(9) | 1.20s |
| `shimmer` | 光晕铺开 | 351408 | GLEAM-GLOW-SFX-CHIME | 17202 | ★4.7(206) | 1.50s |
| `shatter` | 碎裂 | 221528 | Glass Break | 34586 | ★4.5(236) | 0.55s |
| `whoosh` | 转场 | 449996 | whoosh_short_mid | 4179 | ★4.7(72) | 0.49s |
| `sub` | 超低频 | 428073 | Sub Drop Smooth | 4663 | ★4.7(73) | 1.20s |
| `riser` | 渐强铺垫 | 774635 | Reverse Cymbal Shiny | 1218 | ★4.8(23) | 2.59s |
| `drone` | 氛围铺底 | 397091 | Soft Tonal Wind_01 | 13199 | ★4.8(135) | 3.00s |
| `tick` | 字卡点击 | 268108 | Button Tick | 5229 | ★4.8(51) | 0.06s |
| `tick_soft` | 轻点击 | 528561 | Soft UI Button Click | 4877 | ★4.8(82) | 0.08s |

全部 CC0，无署名要求。

`assets/sfx-src/` 里还有 10 个下载了但**没采用**的候选（Cinematic Impact、rise5、
Huge Impact、Low-impact、Deep Whoosh、quick-woosh、Subterranean Rumble、sub bass、
Riser Hit、Swish Swipe）。留着是为了记录选型过程——它们分别因为起音太慢、
太尖、没有起音过程而被淘汰，理由见下面"踩的坑"。

## 处理流程

```bash
python prep_sfx.py <freesound预览> <assets/sfx/xxx.wav> --max 1.5 --fadeout 0.4 --peak -3
```

`prep_sfx.py` 做四件事：解码成 48k 单声道 → 裁掉首尾静音 → 截到目标长度并淡出 → 峰值归一到 -3 dBFS。

**必须处理，不能直接用**：Freesound 下载的是预览版 MP3，前面有十几秒静音、
电平也极低（实测 peak 只有 0.17）。直接扔进混音等于没声音。

## 选素材时踩的坑

1. **"cinematic impact" 起音太慢**。下载量最高的 Cinematic Impact（↓40853）起音
   要 1.67 秒——132 BPM 一拍才 454ms，这种素材根本卡不上点。
   最后选了 Deep Impact（起音 130ms，低频占比 0.85）。
   **选之前一定先量 attack**。
2. **实测 attack / tail / 频谱重心**，不能只看下载量和评分。
   - attack < 100ms 才能当卡点音
   - tail 决定"余韵够不够"
   - 频谱重心决定"亮还是闷"（impact 类应该在 200-500Hz，太高会刺）
3. **持续型素材不能当冲击用**。Low-impact.wav 开头就是满电平，
   是持续的隆隆声，没有起音过程，做卡点会糊成一片。
4. **shimmer 类要手动截取**。GLEAM-GLOW 是渐强型，前 800ms 一直在涨；
   直接从 0 开始用的话起音 755ms，太慢。截掉前 0.35s 就正常了。
5. **反向镲片是天然的 riser**。Reverse Cymbal 起音 2550ms 是设计使然（渐强到峰值），
   不是缺陷。

## 混音平衡（换成实录素材后必须重调）

实录素材的能量密度远高于合成音，同样的 dB 值会响很多。分轨实测：

| 段落 | 音效/音乐 比 |
|------|-------------|
| 开场 | 0.12x |
| 章节卡 | 0.13x |
| 六奇观 | 0.37x |
| 珠峰铺垫A | 0.06x |
| 「地球之巅」 | 0.88x |
| DROP | 0.75x |
| 收尾 | 0.06x |

调整过程：
- 整体音乐 -8.5 → -9.5 dB，音效总线 +3.5 → +1.5 dB
- 「地球之巅」段原本是音乐的 **1.56 倍**（4 个字叠加 hit_soft+sub+tick），压到 0.88x
- `point_hi`（72 次）从 -20 压到 -26 dB：新素材有 480ms 余韵，旧的只有 240ms
- `shimmer` 全线 -4~5 dB，`chime` 全线 -4 dB

## ⚠️ 音效总线必须单独限幅

新素材叠加后**音效总线自身 peak 达到 1.584**（超过满刻度），
主限幅器要硬压 1.376 → 0.87，0.17% 的采样过载。

修法：给音效总线加独立的 soft-knee 限幅（knee 0.55 / ceil 0.86），
压完是 0.854，给音乐留出空间。**不要让主限幅器一个人扛全部过载。**

## 验证结果

```
音频: 50.00s  peak 0.930  rms 0.1784  削波 0
DROP 41.818s: 0.0302 -> 0.3489  (x11.57)   ← 全片最强
切点 17/17 全部落鼓点网格
```
