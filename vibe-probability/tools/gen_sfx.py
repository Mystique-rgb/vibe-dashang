# 音效层：用 earshot 的 shipped sound bank（252 个专业音效）渲染
# 只有标记位置有音效，其余完全静音。
# earshot 的 bank 按一套私有授权参考片测量出的风格调过，音色比手写合成更专业。
# 依赖：earshot 仓库路径（EARSHOT_REPO 环境变量，默认 /tmp/earshot）

import json, sys, os
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
DUR = 66.05

here = os.path.dirname(os.path.abspath(__file__))
proj = os.path.dirname(here)

EARSHOT_REPO = os.environ.get('EARSHOT_REPO', '/tmp/earshot')
if EARSHOT_REPO not in sys.path:
    sys.path.insert(0, EARSHOT_REPO)
from earshot.forge import bank

with open(os.path.join(proj, '.tmp', 'timing.json'), encoding='utf-8') as f:
    DATA = json.load(f)
EVENTS = DATA['events']

N = int(SR * DUR)
L = np.zeros(N, dtype=np.float64)
R = np.zeros(N, dtype=np.float64)


def add(sig, at, gain=1.0, pan=0.0):
    i0 = int(round(at * SR))
    if i0 >= N:
        return
    if i0 < 0:
        sig = sig[-i0:]
        i0 = 0
    n = min(len(sig), N - i0)
    if n <= 0:
        return
    s = sig[:n] * gain
    gl = np.sqrt((1 - pan) / 2)
    gr = np.sqrt((1 + pan) / 2)
    L[i0:i0 + n] += s * gl
    R[i0:i0 + n] += s * gr


# 音效映射：每个 kind 一个主音效 + 备选轮换
#   hit   -> cut_hit/punch  0.28s 中低频冲击 + 起音脆点
#   ping  -> click/tink / pro_click/glass  0.04-0.07s 极短极脆
#   tick  -> pro_click/tink / click/snap   最短最脆
#   knock -> knock/snap / knock/wood       木质叩击
#   glass -> mallet/glock / mallet/celesta 0.4s 明亮泛音
#   thump -> impact/punch                  低频体感
#   sweep -> pro_zip/up_hi / swish/zing    短扫
# ───────────────────────────── "叮"音效池
# 对标视频音效：频谱质心中位数 2645 Hz，集中在 1700–3000 Hz，衰减 0.03–0.14s。
#
# 为了让 36 个落点听起来不重复，用两个维度组合：
#   A) 8 个可调音高的铃音（5 个 ding + notify/m1、m2、m5 + mallet/glock）
#      → 每个再按五声音阶取不同音高
#   B) 7 个固定音高但落在"叮"频段的短脆音
#      （pro_pop/tink 2646Hz、click/thock 2292Hz、knock/plastic 2898Hz、
#        pro_tap/knock 1831Hz、drip/tiny 3219Hz、pop/1 1814Hz、ui_pop/blip 1851Hz）
TUNED_BASES = [
    'pro_notify/ding_1822',
    'pro_notify/ding_1930',
    'pro_notify/ding_2045',
    'pro_notify/ding_2167',
    'pro_notify/ding_2296',
    'pro_notify/ding_1822',
    'pro_notify/ding_1930',
    'mallet/glock',
]

# 固定音高但频谱质心落在 1800–2900Hz 的短脆音
# （去掉 drip/tiny 3219Hz —— 会把整体质心拉高）
FIXED_SOUNDS = [
    'pro_pop/tink',      # 2646Hz
    'click/thock',       # 2292Hz
    'knock/plastic',     # 2898Hz
    'pro_tap/knock',     # 1831Hz
    'pop/1',             # 1814Hz
    'ui_pop/blip',       # 1851Hz
]

# 36 个落点，每个给一个唯一的音高：1800Hz 起，按 12 音平均律的"大调五声+邻近音"
# 在 1800–2540Hz 之间取 20 个不同音高，落点序号取模保证均匀。
PITCH_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
               12, 13, 14, 15, 16, 17, 18, 19]


def ding_for(k, total=36):
    """给第 k 个落点一个 (音色, 音高)。
    每 4 个落点有 1 个用固定音色（换音色族），3 个用可调铃音（换音高）。"""
    if k % 4 == 3:
        return FIXED_SOUNDS[(k // 4) % len(FIXED_SOUNDS)], None
    base = TUNED_BASES[k % len(TUNED_BASES)]
    step = PITCH_STEPS[k % len(PITCH_STEPS)]
    # 每个半音 6%，20 步到 2540Hz 左右
    hz = 1800.0 * (1.0 + 0.021 * step)
    return base, round(hz, 1)


LEVEL = {
    'hit': 0.92, 'ping': 0.86, 'tick': 0.80, 'knock': 0.88,
    'glass': 0.90, 'thump': 0.88, 'sweep': 0.74, 'suck': 0.70,
}

LEAD = {
    'hit': 0.045, 'ping': 0.030, 'tick': 0.018, 'knock': 0.030,
    'glass': 0.035, 'thump': 0.050, 'sweep': 0.060, 'suck': 0.000,
}

EVS = sorted(EVENTS, key=lambda e: e['t'])
GROUPS = []
for ev in EVS:
    if GROUPS and ev['t'] - GROUPS[-1][-1]['t'] < 0.060:
        GROUPS[-1].append(ev)
    else:
        GROUPS.append([ev])
STACK = {}
for g in GROUPS:
    kk = 1.0 / np.sqrt(len(g))
    for ev in g:
        STACK[id(ev)] = kk

count = 0
used = {}
for k, ev in enumerate(EVENTS):
    kind = ev['kind']
    if kind not in LEVEL:
        print('unknown kind', kind, file=sys.stderr)
        continue

    sid, hz = ding_for(k, len(EVENTS))
    kw = {} if hz is None else {'pitch': hz}

    try:
        y, meta = bank.render(sid, **kw)
    except Exception as e:
        print('render failed %s: %s' % (sid, e), file=sys.stderr)
        continue

    y = np.asarray(y, dtype=np.float64)
    if y.ndim > 1:
        y = y.mean(axis=1)

    mx = np.max(np.abs(y)) + 1e-9
    g = LEVEL[kind] * ev.get('gain', 1.0) * STACK.get(id(ev), 1.0)
    y = y / mx * 0.92 * g

    at = ev['t'] - LEAD[kind]
    pan = 0.0
    if kind in ('ping', 'tick', 'glass'):
        pan = float(np.sin(k * 2.3)) * 0.16
    add(y, at, 1.0, pan)
    key = '%s%s' % (sid.split('/')[-1], '' if hz is None else ' @%.0fHz' % hz)
    used[key] = used.get(key, 0) + 1
    count += 1

print('rendered %d events from earshot bank' % count)
print('distinct sounds used: %d' % len(used))
for sid, n in sorted(used.items(), key=lambda kv: -kv[1]):
    print('  %-28s %d' % (sid, n))

mix = np.stack([L, R], axis=1)
mix = sosfilt(butter(2, 22, btype='high', fs=SR, output='sos'), mix, axis=0)

# ───────────────────────────── 逐事件峰值均衡
# 渲染时每个事件已归一化，但同刻叠加（hit+glass）和素材时长差异
# 会让最终峰值散在 -10 ~ -0.2 dB。这里把每个事件的峰值统一到同一目标，
# 保证 36 个落点听感一致 —— 这是"每个都清楚"的关键。
TARGET_PEAK_DB = -6.0
for ev in EVENTS:
    i0 = int((ev['t'] - 0.14) * SR)
    i1 = int((ev['t'] + 0.32) * SR)
    i0 = max(0, i0); i1 = min(len(mix), i1)
    if i1 - i0 < 32:
        continue
    seg = mix[i0:i1]
    pk = np.max(np.abs(seg))
    if pk < 1e-6:
        continue
    cur = 20 * np.log10(pk)
    gain = 10 ** ((TARGET_PEAK_DB - cur) / 20)
    # 提和压都做，统一到目标峰值
    gain = float(np.clip(gain, 0.25, 4.0))
    mix[i0:i1] = seg * gain

peak = np.max(np.abs(mix))
print('pre-limit peak %.2f dBFS' % (20*np.log10(peak+1e-12)))
# 只在真正超限时才削，且用软削峰而不是整体缩放（缩放会破坏逐事件均衡）
if peak > 0.95:
    over = peak / 0.95
    mix = np.tanh(mix * 1.0) / np.tanh(1.0) * 0.95

rms = np.sqrt(np.mean(mix ** 2))
print('RMS %.2f dBFS' % (20*np.log10(rms+1e-12)))

out = os.path.join(proj, 'assets', 'sfx.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote %s %.2f MB' % (out, os.path.getsize(out)/1e6))
