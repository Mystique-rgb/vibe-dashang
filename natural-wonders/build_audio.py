"""Build the full audio track for 传统七大自然奇观.

Music: assets/music.mp3 (霓虹兔 - Chaikovsky, 132 BPM, drop at 91.640s).
The music is placed so its drop lands on video DROP_VIDEO (41.818s), where
Everest appears.

Every cut, every wonder's second hit, and every landscape detail element gets
exactly one sound, taken from the same anchors the scene code uses. Change the
timeline -> rerun this.

    python build_audio.py            # writes assets/mix.wav
"""
import json
import os
import subprocess
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SFX = os.path.join(HERE, 'assets', 'sfx')
MUSIC = os.path.join(HERE, 'assets', 'music.mp3')
OUT = os.path.join(HERE, 'assets', 'mix.wav')

SR = 48000
DURATION = 50.0


def read_anchors():
    out = subprocess.run(
        ['node', 'dump_anchors.mjs'],
        cwd=HERE, capture_output=True, text=True, check=True,
        env={**os.environ, 'PATH': os.environ.get('PATH', '') + os.pathsep +
             os.path.expanduser('~/AppData/Local/Programs/nodejs')},
    ).stdout
    return json.loads(out[out.index('{'):])


A = read_anchors()
BEAT = A['BEAT']
print('anchors:', json.dumps({k: v for k, v in A.items() if k != 'T'},
                             indent=2, ensure_ascii=False))


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
        tgt = int(len(x) * SR / fr)
        x = np.interp(np.linspace(0, len(x) - 1, tgt), np.arange(len(x)), x)
    return x


def load_music():
    tmp = os.path.join(HERE, 'assets', '.music_tmp.raw')
    subprocess.run(
        ['ffmpeg', '-y', '-v', 'error', '-i', MUSIC,
         '-ac', '1', '-ar', str(SR), '-f', 'f32le', tmp], check=True)
    x = np.fromfile(tmp, dtype=np.float32).astype(np.float64)
    os.remove(tmp)
    return x


SFX_CACHE = {}


def sfx(name):
    if name not in SFX_CACHE:
        SFX_CACHE[name] = load_wav(os.path.join(SFX, name + '.wav'))
    return SFX_CACHE[name]


N = int(SR * DURATION)
mix = np.zeros(N + SR * 3)
music_bus = np.zeros_like(mix)
sfx_bus = np.zeros_like(mix)


from scipy import signal as _sig


def _hp(x, hz):
    """High-pass. Use it on anything that does not need weight: it is the single
    most effective cure for a mix that reads as muffled, because it stops every
    small effect from piling more energy into the 20-150 Hz mud zone."""
    if hz <= 0:
        return x
    b, a = _sig.butter(2, hz / (SR / 2), btype='high')
    return _sig.lfilter(b, a, x)


def _shelf(x, hz, db):
    """High shelf: lifts everything above hz. This is the crispness control."""
    if abs(db) < 0.01:
        return x
    b, a = _sig.butter(2, hz / (SR / 2), btype='high')
    hi = _sig.lfilter(b, a, x)
    return x + hi * (10 ** (db / 20.0) - 1.0)


def _punch(x, amount):
    """Transient emphasis. Pulls the body down while the first few ms keep their
    level, so the attack stands out. That is what makes a hit feel like it has
    weight instead of just being loud."""
    if amount <= 0:
        return x
    env = np.abs(x)
    k = np.exp(-1.0 / (SR * 0.003))
    e = _sig.lfilter([1 - k], [1, -k], env)
    live = e[e > 0]
    if len(live) == 0:
        return x
    thr = np.percentile(live, 60)
    if thr <= 0:
        return x
    gain = np.ones_like(x)
    over = e > thr
    gain[over] = 1.0 / (1.0 + amount * np.log1p(e[over] / thr - 1.0))
    return x * gain


def add(bus, name, at, gain_db=0.0, trim=None, hp=0, shelf=0.0, shelf_hz=4000,
        punch=0.0):
    """Place one sound on a bus.

    hp       high-pass corner in Hz (kills low mud)
    shelf    high-shelf gain in dB above shelf_hz (adds crispness)
    punch    transient emphasis, 0 = off, ~0.6 = pronounced
    """
    x = sfx(name)
    if trim is not None:
        x = x[:int(SR * trim)]
    if hp:
        x = _hp(x, hp)
    if shelf:
        x = _shelf(x, shelf_hz, shelf)
    if punch:
        x = _punch(x, punch)
    start = int(round(at * SR))
    if start < 0:
        x = x[-start:]
        start = 0
    end = min(len(bus), start + len(x))
    if end <= start:
        return
    bus[start:end] += x[:end - start] * (10 ** (gain_db / 20.0))


# ---- music: offset so the song's drop sits on the video's drop -------------
offset = A['DROP_MUSIC'] - A['DROP_VIDEO']
mus = load_music()
src_start = int(round(offset * SR))
seg = mus[src_start:src_start + len(mix)]
music_bus[:len(seg)] += seg

MUSIC_GAIN_DB = -11.0
music_bus *= 10 ** (MUSIC_GAIN_DB / 20.0)

print(f"music offset = {offset:.4f}s "
      f"(drop {A['DROP_MUSIC']:.3f} -> video {A['DROP_VIDEO']:.3f})")

T = A['T']
title = T['title'][0]

# ---- intro: 7 light points, one sound each --------------------------------
# Mirrors drawIntro(): point i ignites at 0.50 + i * 0.105 (shot-local).
# marker #17: the 七宗罪 opening gesture, extracted verbatim from that render
# (sev_intro.wav, 1.55 s). It already contains the ring, the seven ignition
# points and the word slam, so no separate 'point' loop here - that would
# double the points.
# marker #18: the clip's internal slam was landing after the title, so start
# the clip earlier - that moves the slam onto the word instead of after it.
add(sfx_bus, 'sev_intro', 0.0, 4.0, hp=0, punch=0.3)
# marker #18: the clip's own energy is front-loaded, so the word had no accent
# of its own. Add a landing hit exactly on the word (title completes at 0.72 s).
add(sfx_bus, 'hit', 0.72, 2.0, hp=70, shelf=5, punch=0.6)
add(sfx_bus, 'shimmer', 0.72, -10.0, hp=1000, shelf=7)

# ---- marker #2: the intro now hands over at ~1.97 s ------------------------
add(sfx_bus, 'whoosh', 1.80, -9, hp=320, shelf=6)
add(sfx_bus, 'hit', 1.818, 5.0, hp=60, shelf=5, punch=0.5)
add(sfx_bus, 'shimmer', 1.818, -8.0, hp=900, shelf=7)

# ---- chapter card ---------------------------------------------------------
add(sfx_bus, 'whoosh', title, -9, hp=300, shelf=5)
# marker #19: the uploaded whoosh is out. New landing sound = a hard hit plus
# a high-passed shimmer tail (measured: 25 ms attack, peaks instantly, 1.5 s
# metal decay). This is the cue every name card below reuses.
add(sfx_bus, 'hit', 2.267, 6.0, hp=60, shelf=5, punch=0.55)
add(sfx_bus, 'shimmer', 2.267, -6.0, hp=900, shelf=7)

# ---- the six wonders ------------------------------------------------------
# Each: whoosh on entry, chime on the scene line, a heavy hit on beat 4, then
# one point sound per landscape detail element as it ignites.
npoints = A['WONDER_POINTS']
for i in range(A['nwonders']):
    t0 = A['wonderStarts'][i]
    half = A['wonderHits'][i]

    add(sfx_bus, 'whoosh', t0 - 0.02, -9, hp=320, shelf=5)
    add(sfx_bus, 'chime', t0 + 0.03, -10, hp=800, shelf=6)
    # the landscape is traced in across the first half: a soft riser under it
    add(sfx_bus, 'riser', t0 + 0.10, -20, hp=500, shelf=4)

    # The cut has to feel violent. Three layers, all on the same sample:
    #   crack  - the bright transient that reads as "impact"
    #   body   - the low thump that reads as "weight"
    #   tail   - a short boom so it does not stop dead after 100 ms
    # markers #20-25: same landing sound as marker #19 - hit + shimmer tail.
    add(sfx_bus, 'hit', half, 6.0, hp=60, shelf=5, punch=0.55)
    add(sfx_bus, 'shimmer', half, -6.0, hp=900, shelf=7)

    # detail elements ignite from half+0.02, one every 0.058s (see drawWonderShot)
    for e in range(npoints):
        at = half + 0.02 + e * 0.058
        if at > t0 + A['wonderLen'] - 0.02:
            break
        add(sfx_bus, 'point_hi', at, -19 + e * 0.25, hp=1500, shelf=8, punch=0.3)

# ---- build A: six facts, one per slot ------------------------------------
build_a_len = T['buildB'] - T['buildA']
slot = build_a_len / A['buildLines']
for i in range(A['buildLines']):
    at = T['buildA'] + i * slot
    add(sfx_bus, 'tick_soft', at, -11 + i * 0.8, hp=900, shelf=7)
    add(sfx_bus, 'point', at + 0.02, -17, hp=800, shelf=6)
add(sfx_bus, 'drone', T['buildA'], -19, hp=0)
add(sfx_bus, 'whoosh', T['buildA'] - 0.02, -13, hp=300, shelf=5)

# ---- build B: 地球之巅 slams, each character heavier ----------------------
build_b_len = T['buildC'] - T['buildB']
nchars = A['titleChars']
step = build_b_len / (nchars + 0.6)
for i in range(nchars):
    at = T['buildB'] + i * step
    add(sfx_bus, 'hit_soft', at, -7 + i * 1.8, hp=80, punch=0.6)
    add(sfx_bus, 'sub', at, -22 + i * 1.5)
    add(sfx_bus, 'tick', at, -8 + i * 1.3, hp=1100, shelf=7)
    if i == nchars - 1:
        add(sfx_bus, 'shatter', at, -7, hp=1200, shelf=6)
        add(sfx_bus, 'shimmer', at + 0.02, -17)

add(sfx_bus, 'riser', T['buildC'] - 2.75, -7, hp=400, shelf=5)
add(sfx_bus, 'whoosh', T['buildC'] - 0.55, -6, hp=300, shelf=5)

# ---- the drop: Everest in full ------------------------------------------
# marker #26: the Everest card uses the same landing sound as the other name
# cards, but noticeably louder - it is the climax of the piece.
add(sfx_bus, 'hit', T['buildC'], 11.0, hp=55, shelf=6, punch=0.6)
add(sfx_bus, 'shimmer', T['buildC'], -1.0, hp=850, shelf=8)
# a low sub layer for weight under the loudest hit
add(sfx_bus, 'sub', T['buildC'], -6.0, hp=0, trim=0.6)
# a second hit 60 ms later widens the impact without muddying the transient

for i in range(4):
    add(sfx_bus, 'tick_soft', T['buildC'] + 0.55 + i * BEAT, -11, hp=900, shelf=7)

# ---- outro ---------------------------------------------------------------
add(sfx_bus, 'whoosh', T['outro'] - 0.02, -7, hp=300, shelf=5)
add(sfx_bus, 'hit_soft', T['outro'] + 0.05, -2, hp=80, punch=0.55)
add(sfx_bus, 'chime', T['outro'] + 0.10, -10, hp=800, shelf=6)
add(sfx_bus, 'shimmer', T['outro'] + 0.16, -12, hp=900, shelf=6)
add(sfx_bus, 'drone', T['outro'] + 0.30, -17)


# ------------------------------------------------------------------ mastering
def duck(bus, triggers, depth_db=6.0, attack=0.16, release=0.42):
    """Side-chain the music under the big hits.

    The shape matters as much as the depth: the hole has to be at its deepest
    ON the hit, not 100 ms later. The old version put the minimum at 30% of the
    window, which with a 45 ms attack meant the deepest duck landed well after
    the transient and the impact got no benefit at all.
    """
    n = len(bus)
    g = np.ones(n)
    floor = 10 ** (-depth_db / 20.0)
    for t in triggers:
        s = max(0, int((t - attack) * SR))
        e = min(n, int((t + release) * SR))
        if e <= s:
            continue
        # piecewise: ramp down over the attack, sit at the floor for a short
        # hold, then ramp back up over the release
        idx = np.arange(e - s)
        atk = max(1, int(attack * SR))
        hold = max(1, int(0.045 * SR))
        gseg = np.ones(e - s)
        down = idx < atk
        gseg[down] = 1 - (1 - floor) * (idx[down] / atk)
        flat = (idx >= atk) & (idx < atk + hold)
        gseg[flat] = floor
        up = idx >= atk + hold
        span = max(1, (e - s) - (atk + hold))
        gseg[up] = floor + (1 - floor) * np.clip((idx[up] - atk - hold) / span, 0, 1)
        g[s:e] = np.minimum(g[s:e], gseg)
    return bus * g


# Two tiers of ducking: the wonder cuts get a tight deep duck so the impact has
# somewhere to land, the rest get the normal one.
deep_triggers = list(A['wonderHits']) + [1.818]
music_bus = duck(music_bus, deep_triggers, 18.0, attack=0.045, release=0.22)
# the drop gets a deeper, slightly longer hole: it is the climax and needs the most room
music_bus = duck(music_bus, [T['buildC']], 20.0, attack=0.030, release=0.26)

triggers = [0.72, title + 0.10]
for i in range(nchars):
    triggers.append(T['buildB'] + i * (T['buildC'] - T['buildB']) / (nchars + 0.6))
triggers.append(T['buildC'] - 0.10)
triggers.append(T['outro'] + 0.05)

music_bus = duck(music_bus, triggers, 7.0, attack=0.14, release=0.38)

SFX_GAIN_DB = 0.5
sfx_bus *= 10 ** (SFX_GAIN_DB / 20.0)


def soft_limit(bus, knee=0.62, ceil=0.97):
    """Soft-knee limit. Only the part above the knee is compressed, so transients
    keep their shape instead of being squashed flat."""
    mag = np.abs(bus)
    over = mag > knee
    if not over.any():
        return bus
    span = ceil - knee
    mag = mag.copy()
    mag[over] = knee + span * np.tanh((mag[over] - knee) / span)
    return np.sign(bus) * mag


# ---- bus tone shaping ------------------------------------------------------
# Measured before this change: the 20-120 Hz band held 48% of the mix energy and
# everything above 3 kHz only 3%. That is why it read as muffled. Two moves fix
# it: lift the top on the effects bus, and stop the low end from stacking.
sfx_bus = _shelf(sfx_bus, 3000, 1.8)     # crispness
sfx_bus = _hp(sfx_bus, 45)               # clear sub-45 rumble that only eats headroom
# a gentle presence lift makes impacts cut through the music
sfx_bus = _shelf(sfx_bus, 800, 1.6)
# tame the very top: above 12 kHz there is only hiss in these recordings
b, a = _sig.butter(2, 12000 / (SR / 2), btype='low')
sfx_bus = _sig.lfilter(b, a, sfx_bus)

# The effects bus needs its own ceiling: real recordings peak far hotter than the
# synthesised ones did, and 70+ overlapping detail hits can drive it to full
# scale on their own. Leave headroom for the music to sit under.
sfx_peak_before = np.abs(sfx_bus).max()
sfx_bus = soft_limit(sfx_bus, 0.80, 0.95)
print(f'sfx bus peak {sfx_peak_before:.3f} -> {np.abs(sfx_bus).max():.3f}')

mix = music_bus + sfx_bus

# Optional: dump the two buses so their levels can be measured separately.
# (Measuring "music vs effects" from the sum alone does not work once the music
# is side-chained, because the two signals are no longer independent.)
if os.environ.get('DUMP_BUSES'):
    for name, bus in (('music', music_bus), ('sfx', sfx_bus)):
        b = np.clip(bus[:N], -1, 1)
        p = os.path.join(HERE, '.tmp', 'bus_%s.wav' % name)
        with wave.open(p, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((b * 32767).astype(np.int16).tobytes())
    print('dumped buses to .tmp/')

mix = mix[:N]
fade = int(SR * 0.35)
mix[-fade:] *= np.linspace(1, 0, fade)

# ---- bus compression ------------------------------------------------------
# Loudness without flattening the hits: slow attack lets every transient through
# untouched, then we make up the level the compression took.
def bus_compress(x, thr_db=-16.0, ratio=2.6, attack=0.022, release=0.16,
                 makeup_db=3.0):
    thr = 10 ** (thr_db / 20.0)
    env = np.abs(x)
    a = np.exp(-1.0 / (SR * attack))
    r = np.exp(-1.0 / (SR * release))
    e = np.empty_like(env)
    prev = 0.0
    for i in range(len(env)):
        v = env[i]
        prev = a * prev + (1 - a) * v if v > prev else r * prev + (1 - r) * v
        e[i] = prev
    gain = np.ones_like(x)
    over = e > thr
    gain[over] = (e[over] / thr) ** (1.0 / ratio - 1.0)
    return x * gain * (10 ** (makeup_db / 20.0))


mix = bus_compress(mix, -20.0, 1.7, 0.030, 0.18, 4.2)

# ---- soft-knee limiter ---------------------------------------------------
# Never use LIMIT + (1-LIMIT)*tanh(...): that pushes peaks UP to 1.0 and
# flattens the whole track. Only the part above the knee gets compressed.
KNEE = 0.78
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
print(f'raw peak {peak:.4f}  rms {np.sqrt((mix ** 2).mean()):.4f}')
target = 10 ** (-1.5 / 20.0)
if peak > target:
    mix *= target / peak
    print(f'scaled by {target / peak:.3f}')

clip = np.sum(np.abs(mix) >= 0.999)
print(f'samples at full scale: {clip}')

pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('wrote', OUT, f'{os.path.getsize(OUT) / 1e6:.1f} MB')

# ---- verify: where does the energy actually jump? ------------------------
blk = SR // 20
m = len(mix) // blk
rms = np.array([np.sqrt((mix[i * blk:(i + 1) * blk] ** 2).mean()) for i in range(m)])
tt = np.arange(m) * 0.05
d = np.diff(rms)
top = np.argsort(d)[::-1][:10]
print('\ntop energy jumps:')
for i in sorted(top):
    print(f'  {tt[i + 1]:6.2f}s  {rms[i]:.4f} -> {rms[i + 1]:.4f}  (+{d[i]:.4f})')


def sect(a, b):
    s, e = int(a * SR), int(b * SR)
    return float(np.sqrt((mix[s:e] ** 2).mean()))


print('\nsection RMS:')
for name, a, b in [
    ('intro', 0, title),
    ('title', title, T['sinStart']),
    ('wonders', T['sinStart'], T['buildA']),
    ('buildA', T['buildA'], T['buildB']),
    ('buildB', T['buildB'], T['buildC']),
    ('DROP', T['buildC'], T['outro']),
    ('outro', T['outro'], DURATION),
]:
    print(f'  {name:8s} {sect(a, b):.4f}')
