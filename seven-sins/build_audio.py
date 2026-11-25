"""Build the full audio track for 七宗罪.

Music: assets/music.mp3 (霓虹兔 - Chaikovsky, 132 BPM, drop at 91.640s).
The music is placed so that its drop lands on video DROP_VIDEO.

Every cut, every sin's second hit, and every halo light point gets exactly one
sound, taken from the same anchors the scene code uses (src/lib/timeline.js and
HALO_EYES in src/lib/figure.js). Change the timeline -> rerun this.

    python build_audio.py            # writes assets/mix.wav
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SFX = os.path.join(HERE, 'assets', 'sfx')
MUSIC = os.path.join(HERE, 'assets', 'music.mp3')
OUT = os.path.join(HERE, 'assets', 'mix.wav')

SR = 48000
DURATION = 50.0

# ---- read the anchors from the JS modules themselves (single source of truth)
def read_timeline():
    out = subprocess.run(
        ['node', 'dump_anchors.mjs'],
        cwd=HERE, capture_output=True, text=True, check=True,
        env={**os.environ, 'PATH': os.environ.get('PATH', '') + os.pathsep +
             os.path.expanduser('~/AppData/Local/Programs/nodejs')},
    ).stdout
    # node prints a module-type warning on stderr, stdout is pure JSON
    data = json.loads(out[out.index('{'):])
    return dict(
        beat=data['BEAT'],
        drop_video=data['DROP_VIDEO'],
        drop_music=data['DROP_MUSIC'],
        title=data['T']['title'][0],
        sin_start=data['T']['sinStart'],
        sin_len=data['T']['sinLen'],
        nsins=data['nsins'],
        pride_a=data['T']['prideA'],
        pride_b=data['T']['prideB'],
        pride_c=data['T']['prideC'],
        desire=data['T']['desire'],
        halo_eyes=data['HALO_EYES'],
        nlines=data['prideLines'],
        pride_chars=data['prideTitleChars'],
    )

A = read_timeline()
BEAT = A['beat']
print('anchors:', json.dumps(A, indent=2, ensure_ascii=False))

# ---------------------------------------------------------------- load audio
def load_wav(path):
    import wave
    with wave.open(path, 'rb') as w:
        n = w.getnframes()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        raw = w.readframes(n)
        fr = w.getframerate()
    assert sw == 2, path
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    if fr != SR:
        # linear resample
        tgt = int(len(x) * SR / fr)
        x = np.interp(np.linspace(0, len(x) - 1, tgt), np.arange(len(x)), x)
    return x

def load_music():
    """Decode the mp3 to mono float via ffmpeg."""
    tmp = os.path.join(HERE, 'assets', '.music_tmp.raw')
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', '-i', MUSIC,
         '-ac', '1', '-ar', str(SR), '-f', 'f32le', tmp],
        check=True)
    x = np.fromfile(tmp, dtype=np.float32).astype(np.float64)
    os.remove(tmp)
    return x

SFX_CACHE = {}
def sfx(name):
    if name not in SFX_CACHE:
        p = os.path.join(SFX, name + '.wav')
        SFX_CACHE[name] = load_wav(p)
    return SFX_CACHE[name]

# ------------------------------------------------------------------- the mix
N = int(SR * DURATION)
mix = np.zeros(N + SR * 3)     # a little tail room
music_bus = np.zeros_like(mix)
sfx_bus = np.zeros_like(mix)

def add(bus, name, at, gain_db=0.0, trim=None):
    x = sfx(name)
    if trim is not None:
        x = x[:int(SR * trim)]
    start = int(round(at * SR))
    if start < 0:
        x = x[-start:]
        start = 0
    end = min(len(bus), start + len(x))
    if end <= start:
        return
    bus[start:end] += x[:end - start] * (10 ** (gain_db / 20.0))

# ---- music: offset so the song's drop sits on the video's drop -------------
offset = A['drop_music'] - A['drop_video']
mus = load_music()
src_start = int(round(offset * SR))
seg = mus[src_start:src_start + len(mix)]
music_bus[:len(seg)] += seg
# music sits under the effects
MUSIC_GAIN_DB = -8.5
music_bus *= 10 ** (MUSIC_GAIN_DB / 20.0)

print(f'music offset = {offset:.4f}s (drop {A["drop_music"]:.3f} -> video {A["drop_video"]:.3f})')

# ---- intro: 7 light points, one sound each --------------------------------
# Mirrors drawIntro(): point i ignites at 0.50 + i * 0.105 (shot-local).
for i in range(7):
    at = 0.50 + i * 0.105
    add(sfx_bus, 'point', at, -13.5 + i * 0.6)
# ring assembly whoosh + the big title slam
add(sfx_bus, 'whoosh', 0.02, -14)
add(sfx_bus, 'shimmer', 0.28, -19)
add(sfx_bus, 'hit_soft', 0.28, -12)       # 七种人性 starts slamming
add(sfx_bus, 'hit', 1.30, -6.0)           # the word fully lands
add(sfx_bus, 'chime_hi', 1.32, -16)

# ---- title card: 七宗罪 ---------------------------------------------------
add(sfx_bus, 'whoosh', A['title'], -12)
add(sfx_bus, 'hit', A['title'] + 0.10, -5.0)
add(sfx_bus, 'chime', A['title'] + 0.12, -14)
add(sfx_bus, 'shimmer', A['title'] + 0.14, -18)

# ---- the six sins ---------------------------------------------------------
# Each sin: a whoosh on entry, a chime on the scene line, a heavy hit on the
# second beat hit, then one point sound per halo eye as they ignite.
for i in range(A['nsins']):
    t0 = A['sin_start'] + i * A['sin_len']
    half = t0 + A['sin_len'] * 0.5

    add(sfx_bus, 'whoosh', t0 - 0.02, -13)
    # scene line: a clean, bright "appears" sound
    add(sfx_bus, 'chime', t0 + 0.03, -14)
    # second hit: the heavy one
    add(sfx_bus, 'hit', half, -4.0)
    add(sfx_bus, 'boom', half, -11.0)
    add(sfx_bus, 'sub', half, -6.0)
    add(sfx_bus, 'chime_hi', half + 0.02, -11)
    add(sfx_bus, 'shimmer', half + 0.05, -17)

    # halo eyes ignite from half+0.02, one every 0.062s (see drawSin)
    for e in range(A['halo_eyes']):
        at = half + 0.02 + e * 0.062
        if at > t0 + A['sin_len'] - 0.02:
            break
        add(sfx_bus, 'point_hi', at, -20 + e * 0.25)

# ---- pride A: six monologue lines, one per slot --------------------------
pride_a_len = A['pride_b'] - A['pride_a']
slot = pride_a_len / A['nlines']
for i in range(A['nlines']):
    at = A['pride_a'] + i * slot
    add(sfx_bus, 'tick_soft', at, -16 + i * 0.8)
    add(sfx_bus, 'point', at + 0.02, -24)
add(sfx_bus, 'drone', A['pride_a'], -20)
add(sfx_bus, 'whoosh', A['pride_a'] - 0.02, -17)

# ---- pride B: 七宗罪之首 slams, each character heavier -------------------
pride_b_len = A['pride_c'] - A['pride_b']
nchars = A['pride_chars']
step = pride_b_len / (nchars + 0.6)
for i in range(nchars):
    at = A['pride_b'] + i * step
    # every character hits harder than the last
    add(sfx_bus, 'hit_soft', at, -8 + i * 1.8)
    add(sfx_bus, 'sub', at, -14 + i * 1.6)
    add(sfx_bus, 'tick', at, -9 + i * 1.3)
    if i == nchars - 1:
        add(sfx_bus, 'shatter', at, -9)
        add(sfx_bus, 'shimmer', at + 0.02, -13)

# riser into the drop
add(sfx_bus, 'riser', A['pride_c'] - 2.75, -8)
add(sfx_bus, 'whoosh', A['pride_c'] - 0.55, -10)

# ---- the drop: pride appears ---------------------------------------------
add(sfx_bus, 'boom', A['pride_c'], 0.0)         # the single loudest event
add(sfx_bus, 'hit', A['pride_c'], 0.0)
add(sfx_bus, 'shatter', A['pride_c'] + 0.01, -4)
add(sfx_bus, 'shimmer', A['pride_c'] + 0.04, -7)
add(sfx_bus, 'chime', A['pride_c'] + 0.06, -9)
add(sfx_bus, 'sub', A['pride_c'], -3)
for i in range(4):
    add(sfx_bus, 'tick_soft', A['pride_c'] + 0.55 + i * 0.455, -17)

# ---- desire outro --------------------------------------------------------
add(sfx_bus, 'whoosh', A['desire'] - 0.02, -10)
add(sfx_bus, 'hit_soft', A['desire'] + 0.05, -7)
add(sfx_bus, 'chime', A['desire'] + 0.10, -13)
add(sfx_bus, 'shimmer', A['desire'] + 0.16, -15)
add(sfx_bus, 'drone', A['desire'] + 0.30, -18)

# ------------------------------------------------------------------- mastering
# Duck the music under the big hits so the effects read clearly, but never so
# hard it sounds like the music is broken (6 dB is the ceiling).
def duck(bus, triggers, depth_db=6.0, attack=0.16, release=0.42):
    n = len(bus)
    g = np.ones(n)
    for t in triggers:
        s = max(0, int((t - attack) * SR))
        e = min(n, int((t + release) * SR))
        if e <= s:
            continue
        k = np.linspace(0, 1, e - s)
        shape = 1 - (10 ** (-depth_db / 20.0)) * np.exp(-((k - 0.30) ** 2) / 0.055)
        g[s:e] = np.minimum(g[s:e], shape)
    return bus * g

triggers = [A['title'] + 0.10]
for i in range(A['nsins']):
    t0 = A['sin_start'] + i * A['sin_len']
    triggers.append(t0 + A['sin_len'] * 0.5)
for i in range(A['pride_chars']):
    triggers.append(A['pride_b'] + i * (A['pride_c'] - A['pride_b']) / 5.6)
triggers.append(A['pride_c'] - 0.10)
triggers.append(A['desire'] + 0.05)

music_bus = duck(music_bus, triggers, 7.0)

# marker #2: music level unchanged, effects pushed up so they cut through
SFX_GAIN_DB = 3.5
sfx_bus *= 10 ** (SFX_GAIN_DB / 20.0)

mix = music_bus + sfx_bus

# trim to the video length with a short fade out
mix = mix[:N]
fade = int(SR * 0.35)
mix[-fade:] *= np.linspace(1, 0, fade)

# ------------------------------------------------------------------ normalise
# Soft-limit the transients first: the stacked drop hits +8 dB over the body and
# a plain peak-normalise would drag the whole track down to compensate.
# Soft-knee limiter: only the part above the knee gets compressed, and it can
# never exceed 1.0. (The previous tanh form pushed peaks UP to 1.0.)
KNEE = 0.62
CEIL = 0.97
mag = np.abs(mix)
over = mag > KNEE
if over.any():
    print(f'soft-limiting {int(over.sum())} samples above {KNEE}')
    excess = mag[over] - KNEE
    span = CEIL - KNEE
    mag[over] = KNEE + span * np.tanh(excess / span)
    mix = np.sign(mix) * mag

peak = np.abs(mix).max()
print(f'raw peak {peak:.4f}  rms {np.sqrt((mix**2).mean()):.4f}')
target = 10 ** (-1.2 / 20.0)     # -1.2 dBFS
if peak > target:
    mix *= target / peak
    print(f'scaled by {target/peak:.3f}')

# soft clip guard
clip = np.sum(np.abs(mix) >= 0.999)
print(f'samples at full scale: {clip}')

pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', OUT, f'{os.path.getsize(OUT)/1e6:.1f} MB')

# ---- verify: where does the energy actually jump? ------------------------
blk = SR // 20
m = len(mix) // blk
rms = np.array([np.sqrt((mix[i*blk:(i+1)*blk]**2).mean()) for i in range(m)])
tt = np.arange(m) * 0.05
d = np.diff(rms)
top = np.argsort(d)[::-1][:10]
print('\ntop energy jumps:')
for i in sorted(top):
    print(f'  {tt[i+1]:6.2f}s  {rms[i]:.4f} -> {rms[i+1]:.4f}  (+{d[i]:.4f})')

# per-section RMS
def sect(a, b):
    s, e = int(a*SR), int(b*SR)
    return float(np.sqrt((mix[s:e]**2).mean()))
print('\nsection RMS:')
for name, a, b in [
    ('intro', 0, A['title']),
    ('title', A['title'], A['sin_start']),
    ('sins', A['sin_start'], A['pride_a']),
    ('prideA', A['pride_a'], A['pride_b']),
    ('prideB', A['pride_b'], A['pride_c']),
    ('DROP', A['pride_c'], A['desire']),
    ('desire', A['desire'], DURATION),
]:
    print(f'  {name:8s} {sect(a,b):.4f}')
