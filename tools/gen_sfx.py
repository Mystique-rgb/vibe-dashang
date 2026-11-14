# 逐字音效：与 src/text.js 的 typeOn stagger 公式严格对齐
# typeOn 的公式：
#   step = (dur * 1) / max(1, n)
#   第 i 个字在 t0 + i * step 开始
# 这里生成对应的 tick，落在同一个时刻
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 66.0
rng = np.random.default_rng(20261114)

N = int(SR * DUR)
L = np.zeros(N, dtype=np.float64)
R = np.zeros(N, dtype=np.float64)


def n_of(d):
    return int(SR * d)


def add(sig, at, gain=1.0, pan=0.0):
    i0 = int(at * SR)
    if i0 >= N or i0 < 0:
        return
    n = min(len(sig), N - i0)
    s = sig[:n] * gain
    gl = np.sqrt((1 - pan) / 2)
    gr = np.sqrt((1 + pan) / 2)
    L[i0:i0 + n] += s * gl
    R[i0:i0 + n] += s * gr


def bandpass_sweep(x, f0, f1, q=1.6, chunks=22):
    n = len(x)
    out = np.zeros(n)
    wsum = np.zeros(n)
    seg = max(256, n // chunks)
    w = np.hanning(seg * 2)
    for i in range(chunks):
        c = i / (chunks - 1) if chunks > 1 else 0
        fc = f0 * (f1 / f0) ** c
        lo = max(25.0, fc / q / 2)
        hi = min(SR * 0.45, fc * q * 2)
        if hi <= lo:
            continue
        sos = butter(2, [lo, hi], btype='band', fs=SR, output='sos')
        a = max(0, i * seg - seg // 2)
        b = min(n, a + seg * 2)
        if b - a < 16:
            continue
        y = sosfilt(sos, x[a:b])
        ww = w[:b - a]
        out[a:b] += y * ww
        wsum[a:b] += ww
    return out / np.maximum(wsum, 1e-6)


# ───────────────────────────── 音色
def whoosh(dur=0.46, f0=260, f1=3600, tilt=0.0):
    n = n_of(dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    body = bandpass_sweep(noise, f0, f1)
    e = np.exp(-t * (6.0 - tilt * 2.0)) * (1 - np.exp(-t * 260))
    sig = body * e
    hiss = bandpass_sweep(noise, f1 * 0.8, min(f1 * 1.8, 12000), q=1.0) * e * 0.35
    return (sig + hiss) / (np.max(np.abs(sig + hiss)) + 1e-9)


def impact(dur=0.62, base=88.0):
    n = n_of(dur)
    t = np.arange(n) / SR
    f = base * np.exp(-t * 5.2) + base * 0.44
    ph = 2 * np.pi * np.cumsum(f) / SR
    sub = np.sin(ph) * np.exp(-t * 5.6)
    click = rng.standard_normal(n) * np.exp(-t * 150) * 0.55
    click = bandpass_sweep(click, 1800, 900, q=0.9)
    body = np.sin(2 * np.pi * base * 2.0 * t) * np.exp(-t * 11) * 0.28
    sig = sub + click + body
    return sig / (np.max(np.abs(sig)) + 1e-9)


def tick(dur=0.055, f=2400.0):
    n = n_of(dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 190)
    c = rng.standard_normal(n) * np.exp(-t * 420) * 0.5
    sig = s + c
    return sig / (np.max(np.abs(sig)) + 1e-9)


def key(dur=0.048, f=1800.0):
    """打字/落字的木质感：比 tick 更短更闷，像指甲敲桌面"""
    n = n_of(dur)
    t = np.arange(n) / SR
    # 两个正弦叠加造出非谐波感
    s = (np.sin(2 * np.pi * f * t) * 0.7 +
         np.sin(2 * np.pi * f * 2.41 * t) * 0.3) * np.exp(-t * 260)
    c = rng.standard_normal(n) * np.exp(-t * 900) * 0.35
    sos = butter(2, [600, 6000], btype='band', fs=SR, output='sos')
    sig = s + sosfilt(sos, c)
    return sig / (np.max(np.abs(sig)) + 1e-9)


def riser(dur=1.6, f0=180, f1=6800):
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    noise = rng.standard_normal(n)
    air = bandpass_sweep(noise, f0, f1, q=1.1)
    e = (u ** 2.2) * (1 - np.exp(-u * 30))
    tone = np.sin(2 * np.pi * np.cumsum(f0 * 2 + (f1 * 0.28) * (u ** 2.6)) / SR) * 0.16
    sig = (air + tone) * e
    return sig / (np.max(np.abs(sig)) + 1e-9)


def shimmer(dur=1.7):
    n = n_of(dur)
    t = np.arange(n) / SR
    freqs = [2093.0, 2637.0, 3136.0, 4186.0, 5274.0, 6223.0]
    sig = np.zeros(n)
    for k, f in enumerate(freqs):
        d = 0.55 + k * 0.18
        sig += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / d) / (1 + k * 0.55)
    air = bandpass_sweep(rng.standard_normal(n), 5000, 11000, q=0.7) * np.exp(-t * 3.4) * 0.25
    sig = sig / (np.max(np.abs(sig)) + 1e-9) * 0.8 + air
    return sig / (np.max(np.abs(sig)) + 1e-9)


def drop(dur=0.16):
    n = n_of(dur)
    t = np.arange(n) / SR
    f = 1500 * np.exp(-t * 26) + 320
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 34)
    return sig / (np.max(np.abs(sig)) + 1e-9)


def pour(dur=1.1):
    n = n_of(dur)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    body = bandpass_sweep(noise, 500, 2600, q=0.7)
    wob = 0.72 + 0.28 * np.sin(2 * np.pi * 7.3 * t + rng.uniform(0, 6))
    e = np.minimum(1, t / 0.12) * np.exp(-t * 1.1)
    sig = body * wob * e
    return sig / (np.max(np.abs(sig)) + 1e-9)


def swell(dur=2.2):
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    f = 48 + 26 * u
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * (np.sin(np.pi * u) ** 1.6)
    air = bandpass_sweep(rng.standard_normal(n), 300, 2400, q=1.0) * (np.sin(np.pi * u) ** 2.4) * 0.18
    sig = sig + air
    return sig / (np.max(np.abs(sig)) + 1e-9)


def glitch(dur=0.14):
    """色差抖动的声音：短促的比特破碎"""
    n = n_of(dur)
    t = np.arange(n) / SR
    # 方波化的噪声 + 快速幅度调制
    noise = rng.standard_normal(n)
    sos = butter(2, [900, 7000], btype='band', fs=SR, output='sos')
    sig = sosfilt(sos, noise)
    mod = (np.sin(2 * np.pi * 62 * t) > 0).astype(float)
    e = np.exp(-t * 22) * (1 - np.exp(-t * 700))
    sig = sig * mod * e
    return sig / (np.max(np.abs(sig)) + 1e-9)


# ───────────────────────────── 镜头时间
B = {
    'exam': 0.0000, 'blank': 2.0434, 'realize': 4.0868, 'question': 6.1303,
    'nominate': 8.1737, 'cards': 10.2171, 'judge': 12.2605, 'chapter': 14.3040,
    'rule': 16.3474, 'n1': 18.3908, 'n2': 20.4342, 'n3': 22.4777, 'n4': 24.5211,
    'leak': 26.5645, 'curve': 30.6513, 'review': 34.7382, 'award': 38.8250,
    'm1': 42.9119, 'm2': 46.9987, 'daily': 51.0856, 'calendar': 55.1724,
    'echo': 58.2375, 'end': 61.3027,
}

# ───────────────────────────── 逐字音效
# (镜头, t0, dur, 字数, 基础音高, 音色)
TYPED = [
    ('realize', 0.04, 0.52, 7, 1700, 'key'),
    ('realize', 0.24, 0.52, 10, 1560, 'key'),
    ('question', 0.03, 0.55, 7, 1800, 'key'),
    ('question', 0.26, 0.62, 4, 1250, 'key'),
    ('chapter', 0.05, 0.62, 6, 1450, 'key'),
    ('rule', 0.02, 0.55, 6, 1750, 'key'),
    ('rule', 0.34, 0.66, 9, 1400, 'key'),
    ('n1', 0.06, 0.55, 8, 1620, 'key'),
    ('n1', 0.22, 0.55, 7, 1480, 'key'),
    ('n1', 1.02, 0.62, 3, 980, 'key'),      # 「全忘了」重字
    ('n2', 0.04, 0.50, 9, 1660, 'key'),
    ('n2', 0.18, 0.50, 6, 1520, 'key'),
    ('n3', 0.06, 0.55, 9, 1700, 'key'),
    ('n3', 0.22, 0.55, 6, 1560, 'key'),
    ('n4', 0.98, 0.50, 9, 1500, 'key'),
    ('n4', 1.14, 0.60, 7, 1320, 'key'),
    ('leak', 0.05, 0.58, 7, 1600, 'key'),
    ('leak', 0.90, 0.58, 8, 1460, 'key'),
    ('award', 0.12, 0.55, 9, 1560, 'key'),
    ('award', 0.70, 0.55, 14, 1380, 'key'),
    ('award', 1.55, 0.78, 4, 1080, 'key'),  # 「主动回忆」重
    ('m1', 0.04, 0.55, 7, 1640, 'key'),
    ('m1', 0.20, 0.55, 7, 1500, 'key'),
    ('m2', 1.50, 0.55, 6, 1580, 'key'),
    ('echo', 0.62, 0.55, 4, 1700, 'key'),
    ('end', 0.42, 0.75, 11, 1420, 'key'),
    ('calendar', 1.58, 0.50, 6, 1600, 'key'),
]

for nm, t0, dur, n, f0, kind in TYPED:
    base = B[nm] + t0
    step = dur / max(1, n)
    for i in range(n):
        at = base + i * step
        # 音高沿句子轻微上飘，避免机械重复
        f = f0 * (1 + i * 0.022) * rng.uniform(0.97, 1.03)
        # 音量：首字稍重，末字略收
        g = 0.075 * (1.0 if i == 0 else 0.82) * rng.uniform(0.85, 1.12)
        pan = -0.35 + (i / max(1, n - 1)) * 0.7
        add(key(0.048, f), at, g, pan)

# ───────────────────────────── 其余音效（保留并加密）
add(swell(2.4), 0.0, 0.30, 0.0)
add(whoosh(0.5, 200, 2600), 0.02, 0.22, -0.2)

# 考场：纸页翻动
add(whoosh(0.34, 900, 5200, 0.8), B['exam'] + 0.30, 0.13, -0.35)
add(whoosh(0.30, 1200, 6000, 0.9), B['exam'] + 0.62, 0.08, 0.3)

# 「一片空白」：低频压下去
add(impact(0.9, 62), B['blank'] + 1.06, 0.34, 0.0)

# 「想起来了什么」：两记轻落
add(drop(0.18), B['realize'] + 0.55, 0.16, -0.20)
add(drop(0.18), B['realize'] + 1.10, 0.13, 0.25)

# 「为什么」：一记低频垫
add(impact(0.5, 70), B['question'] + 0.30, 0.16, 0.0)
# 问号出现：一记上挑的短音
add(key(0.09, 2600), B['question'] + 0.92, 0.10, 0.0)
add(key(0.07, 3100), B['question'] + 1.02, 0.075, 0.15)

# 提名：起势
add(riser(0.9, 260, 3800), B['nominate'] + 0.20, 0.08, -0.15)

# 四张提名卡逐张：轻 tick
for i in range(4):
    add(tick(0.05, 2100 + i * 260), B['cards'] + 0.08 + i * 0.105, 0.13, -0.5 + i * 0.33)

# 评委光环
add(shimmer(1.5), B['judge'] + 0.75, 0.13, 0.0)

# 处刑四连：每个大数字出现一记轻 impact
for nm in ('n1', 'n2', 'n3', 'n4'):
    add(impact(0.34, 74), B[nm] + 1.05, 0.16, -0.15)

# 「全忘了」：色差抖动的 glitch
add(glitch(0.16), B['n1'] + 1.02, 0.11, 0.0)

# 漏桶：注水 + 滴漏
add(pour(1.3), B['leak'] + 0.10, 0.20, -0.25)
for k in range(9):
    add(drop(0.14), B['leak'] + 0.82 + k * 0.62 + rng.uniform(-0.04, 0.04),
        0.13, rng.uniform(-0.35, 0.35))

# 遗忘曲线画线：细碎的高频划痕
add(whoosh(1.5, 2000, 7000, 1.0), B['curve'] + 0.10, 0.09, 0.15)

# 复习锯齿抬升：一段上行
add(riser(1.9, 220, 5200), B['review'] + 0.05, 0.15, 0.0)

# 获奖揭晓：riser → impact → shimmer
add(riser(1.5, 200, 7200), B['award'] - 1.55, 0.20, 0.0)
add(impact(0.85, 96), B['award'] + 0.02, 0.42, 0.0)
add(shimmer(2.0), B['award'] + 0.30, 0.22, 0.0)

# 两种方法：每段一个上扬点缀
add(riser(1.1, 300, 4200), B['m1'] + 0.15, 0.09, -0.2)
add(riser(1.1, 320, 4600), B['m2'] + 0.15, 0.09, 0.2)

# 融入日常：三个时间点逐个落位
for i in range(3):
    add(tick(0.05, 1900 + i * 220), B['daily'] + 0.12 + i * 0.26, 0.12, -0.45 + i * 0.45)
add(shimmer(1.4), B['daily'] + 1.34, 0.12, 0.0)

# 复习节拍：16 格依次亮起 + 四个复习日加重
for i in range(16):
    add(tick(0.02, 2600 + i * 60), B['calendar'] + 0.03 + i * 0.03, 0.035, -0.5 + i * 0.066)
for hi in range(4):
    add(tick(0.055, 1500 + hi * 160), B['calendar'] + 0.60 + hi * 0.19, 0.13, -0.35 + hi * 0.23)
add(shimmer(1.5), B['calendar'] + 1.74, 0.13, 0.0)

# 回到考场：再次翻页，这次是笔尖写字
add(whoosh(0.36, 800, 4800, 0.7), B['echo'] + 0.22, 0.13, 0.3)
# 写字窗口 = echo + 0.34 → echo + 1.92
for k in range(24):
    u = k / 23
    at = B['echo'] + 0.34 + (u ** 1.35) * 1.56 + rng.uniform(-0.012, 0.012)
    add(key(0.032, 3200 + rng.uniform(-500, 700)), at, 0.045, rng.uniform(-0.5, 0.5))
# 收笔：一记重 tick + 金光
add(tick(0.06, 1400), B['echo'] + 1.94, 0.12, 0.0)
add(shimmer(1.2), B['echo'] + 2.00, 0.12, 0.0)
# 四种努力被划掉：短促低音
for i in range(4):
    add(impact(0.22, 68), B['echo'] + 2.14 + i * 0.07, 0.11, -0.3 + i * 0.2)

# 落版
add(impact(1.1, 58), B['end'] + 0.05, 0.30, 0.0)
add(shimmer(2.4), B['end'] + 0.35, 0.16, 0.0)

# ───────────────────────────── 收尾处理
mid = (L + R) / 2
side = (L - R) / 2
L2 = mid + side * 1.22
R2 = mid - side * 1.22
mix = np.stack([L2, R2], axis=1)

peak = np.max(np.abs(mix))
mix = mix / peak * 0.80
fade = n_of(0.02)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
tail = n_of(0.5)
mix[-tail:] *= np.linspace(1, 0, tail)[:, None]

wavfile.write('assets/sfx.wav', SR, mix.astype(np.float32))

# 统计事件数（按能量峰）
env = np.sqrt(np.mean(mix ** 2, axis=1))
hop = n_of(0.01)
ne = len(env) // hop
e = np.sqrt((env[:ne * hop].reshape(ne, hop) ** 2).mean(axis=1) + 1e-12)
d = np.diff(20 * np.log10(np.maximum(e, 1e-9)))
thr = np.percentile(np.maximum(d, 0), 99.0)
ev = int((np.maximum(d, 0) > thr).sum())
print('peak %.3f  rms_db %.1f  events~%d' % (
    float(np.max(np.abs(mix))), float(20*np.log10(np.sqrt(np.mean(mix**2)))), ev))
print('written assets/sfx.wav', mix.shape, DUR, 's')
