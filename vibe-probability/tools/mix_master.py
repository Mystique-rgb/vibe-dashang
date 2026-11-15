# 母带：BGM + 音效层 → 一个经过完整处理的混音文件
# 源 BGM 实测 −9.5 LUFS-I / True Peak +2.9 dBTP（已过载），
# 所以必须做前视软限幅，不能只做响度归一化。

import os, sys
import numpy as np
from scipy.signal import butter, sosfilt, lfilter
from scipy.io import wavfile

SR = 48000
DUR = 66.05
N = int(SR * DUR)

here = os.path.dirname(os.path.abspath(__file__))
proj = os.path.dirname(here)

# ───────────────────────────── 读源

import subprocess, tempfile
tmp = tempfile.mkdtemp()
bgm_raw = os.path.join(tmp, 'bgm48.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y',
                '-i', os.path.join(proj, 'assets', 'music.mp3'),
                '-ac', '2', '-ar', str(SR), '-c:a', 'pcm_f32le', bgm_raw], check=True)
_, bgm = wavfile.read(bgm_raw)
bgm = bgm.astype(np.float64)
if bgm.ndim == 1:
    bgm = np.stack([bgm, bgm], axis=1)

_, sfx = wavfile.read(os.path.join(proj, 'assets', 'sfx.wav'))
sfx = sfx.astype(np.float64) / 32767.0
if sfx.ndim == 1:
    sfx = np.stack([sfx, sfx], axis=1)


def fit(x, n):
    if len(x) >= n:
        return x[:n]
    pad = np.zeros((n - len(x), x.shape[1]))
    return np.vstack([x, pad])


bgm = fit(bgm, N)
sfx = fit(sfx, N)


# ───────────────────────────── 滤波器

def bp(x, lo, hi, order=2):
    sos = butter(order, [max(20.0, lo), min(SR * 0.46, hi)], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def lp(x, f, order=2):
    sos = butter(order, min(f, SR * 0.46), btype='low', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def hp(x, f, order=2):
    sos = butter(order, max(20.0, f), btype='high', fs=SR, output='sos')
    return sosfilt(sos, x, axis=0)


def softclip(x, drive=1.0, knee=0.72):
    """前视软限幅：knee 以下线性，以上平滑压缩到 1.0 以内"""
    y = np.abs(x) / knee
    over = y > 1.0
    out = np.where(over,
                   knee * (1.0 + np.tanh((y - 1.0) * drive) * (1.0 / drive) * 1.0),
                   np.abs(x))
    return np.sign(x) * np.minimum(out, 0.999)


# ───────────────────────────── BGM 处理链
# 1. 30Hz 高通（清掉源里的次低频过载）
# 2. 200–340Hz 轻微衰减（收敛浑浊，给中频人声/字幕让位）
# 3. 3k–5k 轻微提升（手机小喇叭的细节）
# 4. 2.2:1 软膝压缩
# 5. 前视软限幅（源 +2.9 dBTP）

b = hp(bgm, 32, 2)
b = b - 0.16 * bp(b, 190, 340, 2)
b = b + 0.10 * bp(b, 2900, 5000, 2)

# 压缩：简单 RMS 检测 + 平滑增益
mono = b.mean(axis=1)
win = int(SR * 0.020)
kernel = np.ones(win) / win
rms = np.sqrt(np.convolve(mono ** 2, kernel, mode='same') + 1e-12)
thr = 10 ** (-20 / 20)
ratio = 2.2
gain = np.ones_like(rms)
above = rms > thr
gain[above] = (thr / rms[above]) ** (1 - 1 / ratio)
# 平滑增益，避免抽吸
k2 = int(SR * 0.060)
gs = np.convolve(gain, np.ones(k2) / k2, mode='same')
gs = np.clip(gs, 0.15, 1.0)
b = b * gs[:, None]

# BGM 归一化到 0.52（原来 0.72）。
# 这样音效叠上去（峰值 0.62）总和约 0.9，不会顶到限幅器，
# 限幅器就不会为了压音效而把整段 BGM 一起压下去 3dB。
# 源 BGM 峰值 +2.2dBFS（已过载）。先软限幅削峰，再整体提到目标电平。
# 直接归一化会把整段压到 -5.8dBFS，能量损失太大 —— 这是上一版"声音小"的根因之一。
b = softclip(b * 0.85, drive=3.0, knee=0.62)
b = b / (np.max(np.abs(b)) + 1e-12) * 1.00
b = softclip(b, drive=2.4, knee=0.72)

# ───────────────────────────── 音效层
# 音效峰值 0.62，高于 BGM 的 0.52 —— 音效在落点处确实比 BGM 响，
# 这是"能听见"的物理条件。之前 0.24 对 0.72 是低了 9.5dB，被 BGM 完全盖住。

s = sfx / (np.max(np.abs(sfx)) + 1e-12) * 1.15
s = hp(s, 60, 2)

# ───────────────────────────── 侧链闪避
# 音效落点处把 BGM 压低 6dB（前后各 80ms 渐变）。
# 这样音效不需要很大的绝对电平就能"露出来"，BGM 也能保持足够的响度 ——
# 这是广播/影视混音里"人声压音乐"的标准做法，这里用音效压音乐。

# 音效包络 → 闪避曲线
env = np.abs(s).max(axis=1)
w = int(SR * 0.010)
env = np.convolve(env, np.ones(w) / w, mode='same')
env = env / (env.max() + 1e-9)
duck = 1.0 - 0.80 * np.clip(env * 18.0, 0, 1)  # 最多压到 0.20（约 −14dB），提前起压
# 平滑闪避曲线，避免抽吸感
k3 = int(SR * 0.060)
duck = np.convolve(duck, np.ones(k3) / k3, mode='same')
duck = np.clip(duck, 0.20, 1.0)
b = b * duck[:, None]

# ───────────────────────────── 混合

mix = b + s

# 段落呼吸：51s 后 BGM 能量本来就在落，这里不再额外压
# 收尾 1.4s 淡出（落版最后一帧之前）
fade = int(SR * 1.4)
ramp = np.linspace(1, 0, fade) ** 1.6
mix[-fade:] *= ramp[:, None]

# 开场 0.02s 微淡入，避免首帧爆音
fi = int(SR * 0.015)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]

# ───────────────────────────── 终限幅 + 归一

peak = np.max(np.abs(mix))
print(f'mix peak before limit {20*np.log10(peak+1e-12):.2f} dBFS')
# 先等比降到 0.98 以内，再软削峰 —— 这样限幅器只处理极少数过载样本，
# 不会为了几个峰把整段压下去（这是之前"整体偏小"的根因）
if peak > 0.98:
    mix = mix / peak * 0.98
mix = softclip(mix, drive=2.6, knee=0.995)

# 目标：−1.2 dBTP
tp = np.max(np.abs(mix))
target = 10 ** (-2.2 / 20)
mix = mix / tp * target

rms = np.sqrt(np.mean(mix ** 2))
print(f'final peak {20*np.log10(np.max(np.abs(mix))+1e-12):.2f} dBFS')
print(f'final RMS  {20*np.log10(rms+1e-12):.2f} dBFS')

out = os.path.join(proj, 'assets', 'mix_master.wav')
wavfile.write(out, SR, mix.astype(np.float32))
print('wrote', out, f'{os.path.getsize(out)/1e6:.2f} MB')
