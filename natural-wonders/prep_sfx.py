"""Trim, normalise and convert a Freesound preview into a usable sfx wav.

Freesound previews arrive with leading silence and low level, so they cannot be
dropped straight into the mix. This:
  1. decodes to mono 48k
  2. trims leading/trailing silence (-45 dBFS threshold)
  3. optionally trims to a max length with a short fade
  4. peak-normalises to a target
  5. writes 16-bit mono wav

    python prep_sfx.py <in> <out.wav> [--max 1.2] [--peak -3] [--fade 0.03]
"""
import argparse
import os
import subprocess
import sys

import numpy as np

SR = 48000


def decode(path):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR),
         '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def trim_silence(x, thresh_db=-45.0, pad=0.005):
    if len(x) == 0:
        return x
    th = 10 ** (thresh_db / 20.0)
    mag = np.abs(x)
    idx = np.where(mag > th)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


def fade_edges(x, fade=0.005):
    n = int(fade * SR)
    if n <= 0 or len(x) < 2 * n:
        return x
    x = x.copy()
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--max', type=float, default=0.0,
                    help='max length in seconds (0 = keep all)')
    ap.add_argument('--peak', type=float, default=-3.0,
                    help='target peak in dBFS')
    ap.add_argument('--fade', type=float, default=0.006)
    ap.add_argument('--fadeout', type=float, default=0.0,
                    help='explicit fade-out length when trimming')
    a = ap.parse_args()

    x = decode(a.src)
    if len(x) == 0:
        print('ERROR: empty decode', file=sys.stderr)
        return 1
    before = len(x) / SR
    x = trim_silence(x)
    after_trim = len(x) / SR

    if a.max > 0 and len(x) > int(a.max * SR):
        n = int(a.max * SR)
        x = x[:n].copy()
        fo = a.fadeout if a.fadeout > 0 else min(0.08, a.max * 0.2)
        m = int(fo * SR)
        if m > 0 and m < len(x):
            x[-m:] *= np.linspace(1, 0, m)

    x = fade_edges(x, a.fade)

    pk = np.abs(x).max()
    if pk > 0:
        x *= (10 ** (a.peak / 20.0)) / pk

    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    import wave
    os.makedirs(os.path.dirname(a.dst) or '.', exist_ok=True)
    with wave.open(a.dst, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())

    print('%-46s %6.2fs -> %6.2fs  peak %.1f dBFS'
          % (os.path.basename(a.src)[:46], before, len(x) / SR, a.peak))
    return 0


if __name__ == '__main__':
    sys.exit(main())
