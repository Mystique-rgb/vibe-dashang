"""Verify the rendered video: cuts on the beat, drop is loudest, no dead frames.

    python verify.py "七大自然奇观-v1.mp4"
"""
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = sys.argv[1] if len(sys.argv) > 1 else '七大自然奇观-v1.mp4'
SR = 8000
W, H = 480, 270

_env = {**os.environ,
        'PATH': os.environ.get('PATH', '') + os.pathsep +
                os.path.expanduser('~/AppData/Local/Programs/nodejs')}
_out = subprocess.run(['node', 'dump_anchors.mjs'], cwd=HERE,
                      capture_output=True, text=True, check=True, env=_env).stdout
anchors = json.loads(_out[_out.index('{'):])

BEAT = anchors['BEAT']
DROP = anchors['DROP_VIDEO']
T = anchors['T']
starts = anchors['wonderStarts']
hits = anchors['wonderHits']

print('=' * 62)
print('verifying', VIDEO)
print('=' * 62)

# ---- 1. audio: extract PCM, find the drop --------------------------------
raw = os.path.join(HERE, '.tmp', 'verify.raw')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', VIDEO, '-ac', '1',
                '-ar', str(SR), '-f', 'f32le', raw], check=True)
x = np.fromfile(raw, dtype=np.float32).astype(np.float64)
os.remove(raw)
dur = len(x) / SR
print(f'audio: {dur:.2f}s  peak {np.abs(x).max():.3f}  '
      f'rms {np.sqrt((x ** 2).mean()):.4f}')
clip = int(np.sum(np.abs(x) >= 0.999))
print(f'clipped samples: {clip}')

blk = SR // 200          # 5 ms
m = len(x) // blk
rms = np.array([np.sqrt((x[i * blk:(i + 1) * blk] ** 2).mean()) for i in range(m)])
tt = np.arange(m) * 0.005


def win(a, b):
    s, e = int(a / 0.005), int(b / 0.005)
    return float(rms[s:e].mean()) if e > s else 0.0


# drop: compare 120ms before vs after
before = win(DROP - 0.20, DROP - 0.02)
after = win(DROP + 0.02, DROP + 0.20)
print(f'\nDROP at {DROP:.3f}s: before {before:.4f} -> after {after:.4f} '
      f'(x{after / max(before, 1e-9):.2f})')

# is the drop the loudest moment?
jumps = np.diff(rms)
top = np.argsort(jumps)[::-1][:8]
print('top energy jumps:')
for i in sorted(top):
    print(f'  {tt[i + 1]:6.2f}s  {rms[i]:.4f} -> {rms[i + 1]:.4f}')
drop_rank = int(np.where(np.argsort(jumps)[::-1] == np.argmin(np.abs(tt[1:] - DROP)))[0][0]) + 1
print(f'the drop is energy-jump rank #{drop_rank}')

# ---- 2. video: cuts land on the beat grid --------------------------------
fr = os.path.join(HERE, '.tmp', 'vf')
os.makedirs(fr, exist_ok=True)
for f in os.listdir(fr):
    os.remove(os.path.join(fr, f))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', VIDEO, '-vf',
                f'scale={W}:{H},fps=30', os.path.join(fr, 'f%05d.png')], check=True)

files = sorted(os.listdir(fr))
arrs = []
for i in range(0, len(files), 1):
    from PIL import Image
    arrs.append(np.asarray(Image.open(os.path.join(fr, files[i])).convert('L'),
                           dtype=np.float32))
arrs = np.array(arrs)
diffs = np.abs(np.diff(arrs, axis=0)).mean(axis=(1, 2))
frames = len(arrs)
print(f'\nvideo: {frames} frames  ({frames / 30:.2f}s)')

# every cut should be a local max in frame difference
cuts = sorted(set([T['title'][0]] + list(starts) + list(hits) +
                  [T['buildA'], T['buildB'], T['buildC'], T['outro']]))
print('\ncut alignment (frame diff at each cut vs neighbours):')
ok = 0
for c in cuts:
    idx = int(round(c * 30)) - 1
    if idx < 1 or idx >= len(diffs) - 1:
        continue
    local = diffs[max(0, idx - 1):min(len(diffs), idx + 2)].max()
    baseline = np.median(diffs)
    ratio = local / max(baseline, 1e-6)
    onbeat = abs(c / BEAT - round(c / BEAT)) < 0.02
    if ratio > 1.5:
        ok += 1
    print(f'  {c:6.3f}s  beat {c / BEAT:6.2f} {"OK " if onbeat else "OFF"}  '
          f'diff {local:6.2f} vs median {baseline:5.2f}  (x{ratio:.1f})')
print(f'cuts showing a visible change: {ok}/{len(cuts)}')

# ---- 3. dead frames ------------------------------------------------------
dead = np.where((diffs < 0.30) & (arrs[1:].mean(axis=(1, 2)) < 12))[0]
print(f'\ndead frames (dark AND static): {len(dead)}')
if len(dead):
    print('  at:', ', '.join(f'{d / 30:.2f}s' for d in dead[:12]))

print(f'\nmean brightness by section:')
for name, a, b in [
    ('intro', 0, T['title'][0]),
    ('title', T['title'][0], T['sinStart']),
    ('wonders', T['sinStart'], T['buildA']),
    ('buildA', T['buildA'], T['buildB']),
    ('buildB', T['buildB'], T['buildC']),
    ('DROP', T['buildC'], T['outro']),
    ('outro', T['outro'], frames / 30),
]:
    s, e = int(a * 30), min(int(b * 30), frames)
    if e > s:
        print(f'  {name:9s} {arrs[s:e].mean():6.2f}   motion {diffs[max(0, s - 1):e - 1].mean():5.2f}')
