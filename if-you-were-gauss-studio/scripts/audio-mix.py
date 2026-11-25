"""Render the 120.11-second score, narration and action cues at 48 kHz."""
import argparse
import importlib.util
import json
import math
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import ndimage, signal

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/audio'
SONG = OUT / 'music.mp3'
LIBRARY = OUT / 'library'
SR = 48000
LENGTH = 120.11
COUNT = round(LENGTH * SR)
RNG = np.random.default_rng(1801)

spec = importlib.util.spec_from_file_location('audio_voice', Path(__file__).with_name('audio-voice.py'))
voice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)


def db(level):
    return 10 ** (level / 20)


def decode(path, channels, duration=None, filters=None):
    args = ['ffmpeg', '-v', 'error', '-i', str(path)]
    if duration is not None:
        args.extend(['-t', str(duration)])
    if filters:
        args.extend(['-af', filters])
    args.extend(['-ac', str(channels), '-ar', str(SR), '-f', 'f32le', '-'])
    return np.frombuffer(subprocess.check_output(args), dtype=np.float32).copy().reshape(-1, channels)


def place(bus, clip, start, pan=0):
    index = round(start * SR)
    clip = clip[:len(bus) - index]
    # A centered mono cue has unity gain per channel.
    gains = np.sqrt(np.array([1 - pan, 1 + pan], dtype=np.float32))
    bus[index:index + len(clip)] += clip.reshape(len(clip), -1) * gains


def trim_speech(samples):
    hop = 240
    frames = np.pad(samples, (0, (-len(samples)) % hop)).reshape(-1, hop)
    envelope = np.sqrt(np.mean(frames ** 2, axis=1))
    active = np.flatnonzero(envelope > max(db(-53), envelope.max() * db(-35)))
    if not len(active):
        raise ValueError('TTS clip contains no detectable speech')
    a = max(0, active[0] * hop - 240)
    b = min(len(samples), (active[-1] + 1) * hop + 720)
    return samples[a:b]


def narration():
    bus = np.zeros((COUNT, 2), np.float32)
    timing = []
    filters = 'highpass=f=78,equalizer=f=275:t=q:w=1:g=-2,equalizer=f=2300:t=q:w=1:g=1.4,acompressor=threshold=0.115:ratio=2.4:attack=9:release=75'
    measured_tempo = {2: .86, 26: .89, 27: .89, 30: .85, 37: .84}
    for scene, start, stop, _ in voice.cues():
        path = OUT / 'voice' / f'{scene:02}.mp3'
        tempo = measured_tempo.get(scene, 1.0)
        raw = trim_speech(decode(path, 1, filters=f'{filters},atempo={tempo}')[:, 0])
        available = round((stop - start) * SR)
        while len(raw) > available:
            tempo *= len(raw) / (available - 720) * 1.01
            raw = trim_speech(decode(path, 1, filters=f'{filters},atempo={tempo:.5f}')[:, 0])
        raw[:120] *= np.linspace(0, 1, 120)
        raw[-240:] *= np.linspace(1, 0, 240)
        rms = np.sqrt(np.mean(raw ** 2))
        level = -19.2 if scene != 32 else -18.2
        raw *= min(db(level) / rms, .64 / np.max(np.abs(raw)))
        place(bus, raw, start)
        end = round((round(start * SR) + len(raw)) / SR, 5)
        timing.append({'id': f'{scene:02}', 'start': start, 'end': end})
        print(f'{scene:02}  {start:7.3f}–{end:7.3f}   tempo {tempo:.2f}')
    return bus, timing


# duration, material band, body resonances, release curve
MATERIALS = {
    'wind': (.76, (110, 1650), (), 'air'),
    'paper': (.31, (650, 5500), (260, 510), 'rub'),
    'paperdrop': (.24, (340, 5000), (115, 190, 355), 'hit'),
    'quill': (.17, (1700, 6300), (1020,), 'rub'),
    'chalk': (.25, (1100, 6100), (1120, 1880), 'rub'),
    'wood': (.24, (270, 4200), (135, 320, 510), 'hit'),
    'hammer': (.24, (530, 4400), (105, 190, 345), 'hit'),
    'foot': (.23, (105, 1550), (78, 135), 'hit'),
    'snow': (.27, (480, 5100), (83, 132), 'rub'),
    'compass': (.35, (960, 5900), (470, 1830), 'rub'),
    'metal': (.24, (1700, 7000), (480, 760, 1460, 2330), 'hit'),
    'tick': (.13, (1950, 6500), (630, 1310, 2900), 'hit'),
    'gear': (.16, (600, 4700), (310, 740, 1220), 'gear'),
    'axle': (.32, (170, 2000), (180, 365, 530), 'rub'),
    'hoof': (.15, (280, 5100), (128, 225, 435), 'hit'),
    'ink': (.14, (1300, 5500), (860,), 'hit'),
    'press': (.43, (185, 3700), (75, 140, 315, 820), 'gear'),
    'spark': (.48, (1700, 8900), (930, 1480, 2360, 3170), 'hit'),
    'sub': (.46, (43, 260), (54, 83, 126), 'hit'),
    'line': (.32, (440, 4300), (660, 910), 'rub'),
    'coil': (.24, (400, 3000), (178, 350, 1040), 'gear'),
}


def foley(name):
    length, band, resonances, texture = MATERIALS[name]
    t = np.arange(round(length * SR)) / SR
    x = t / length
    noise = signal.sosfilt(signal.butter(2, band, fs=SR, btype='bandpass', output='sos'), RNG.normal(0, 1, len(t)))
    if texture == 'air':
        body = noise * np.sin(np.pi * x) ** 1.6
    elif texture == 'rub':
        grains = .48 + .30 * np.sin(2 * np.pi * 33 * t) + .18 * np.sin(2 * np.pi * 67 * t)
        body = noise * grains * np.sin(np.pi * x) ** .7
    else:
        body = noise * np.exp(-x * 18)
        if texture == 'gear':
            for offset, strength in [(0.019, .65), (.037, .44), (.064, .29)]:
                n = round(offset * SR)
                body[n:] += noise[:-n] * np.exp(-x[:-n] * 25) * strength
    for i, frequency in enumerate(resonances):
        sweep = {'rub': -.09, 'air': -.02, 'hit': -.035, 'gear': -.04}[texture]
        partial = np.sin(2 * np.pi * (frequency * t + frequency * sweep * t * x))
        body += (.34 / (1 + .63 * i)) * partial * np.exp(-x * (4 + i * 2))
    body *= np.minimum(1, t / .0016) * np.minimum(1, (length - t) / .025)
    return (body / np.max(np.abs(body))).astype(np.float32)


# Cues use the approved picture timestamps, even where the source's transient
# leads a rounded storyboard time by part of a frame.
CUES = [
    (0, 'wind', -22, -.25), (2.59, 'sub', -9, 0), (3.44, 'ink', -16, .10),
    (4.30, 'hammer', -13, -.18), (6.01, 'wood', -18, .23),
    (7.72, 'chalk', -19, -.25), (9.43, 'chalk', -22, .16),
    (11.14, 'wood', -17, -.35), (12.85, 'wood', -16, .35),
    (13.71, 'sub', -13, 0), (15.84, 'compass', -22, .1),
    (17.12, 'sub', -8, 0), (18.83, 'wood', -15, -.1), (19.26, 'metal', -17, .12),
    (23.10, 'paperdrop', -20, -.2), (24.81, 'foot', -22, -.24),
    (26.52, 'foot', -21, .19), (27.38, 'wind', -23, .22), (29.94, 'tick', -23, 0),
    (31.65, 'metal', -20, -.18), (32.50, 'compass', -21, .21), (33.36, 'wood', -13, 0),
    (36.78, 'ink', -22, .12), (38.49, 'paper', -20, -.27),
    (40.20, 'press', -14, -.20), (41.91, 'paperdrop', -15, .13),
    (43.62, 'gear', -15, .12), (45.33, 'tick', -23, -.28), (47.03, 'tick', -21, 0),
    (47.89, 'tick', -21, .20), (49.99, 'wind', -24, .22),
    (52.16, 'paper', -21, -.23), (53.87, 'wood', -19, .13),
    (55.58, 'line', -22, -.36), (57.29, 'line', -22, .36),
    (59.00, 'wind', -27, -.27), (60.71, 'paper', -17, .08),
    (64.13, 'line', -18, -.27), (64.56, 'line', -22, .18), (64.99, 'line', -26, .28),
    (65.84, 'tick', -21, -.26), (66.70, 'tick', -20, 0), (67.55, 'tick', -19, .26),
    (69.26, 'line', -24, -.18), (70.97, 'line', -18, .17), (72.68, 'sub', -12, 0),
    (74.38, 'sub', -12, 0), (74.38, 'ink', -17, .08), (76.09, 'paper', -18, -.22),
    (77.80, 'wood', -11, 0), (79.51, 'axle', -19, -.22), (80.36, 'hoof', -19, -.14),
    (81.22, 'hoof', -24, .19), (82.07, 'wind', -22, .24),
    (82.93, 'paperdrop', -10, .10), (85.50, 'snow', -17, .03), (85.50, 'wind', -26, -.29),
    (87.21, 'tick', -13, -.14), (88.06, 'gear', -16, -.2), (88.91, 'gear', -14, -.09),
    (89.77, 'gear', -12, .07), (90.62, 'gear', -11, .18),
    (91.48, 'paper', -17, -.2), (94.04, 'quill', -19, .12),
    (96.61, 'axle', -16, .13), (98.32, 'sub', -5, 0), (98.32, 'spark', -7, 0),
    (99.17, 'wood', -15, .14), (100.03, 'metal', -19, -.23), (101.74, 'foot', -20, .16),
    (103.44, 'coil', -19, -.18), (105.15, 'tick', -19, .14),
    (106.86, 'paper', -25, -.14), (108.57, 'wind', -30, .24),
    (110.28, 'wind', -18, -.22), (116.69, 'wind', -30, .22),
]


# Time, file, read offset, maximum dry duration, peak level, stereo balance.
STUDIO = [
    (0, '0000_sky_air', 0, .78, -26, 0),
    (2.59, '0259_open_attack', .004, .23, -12, 0),
    (2.59, '0259_open_body', .004, .51, -13, 0),
    (17.12, '1712_name_low', .004, .66, -12, 0),
    (17.12, '1712_name_bloom', 0, .78, -20, 0),
    (18.83, '1883_name_first', 0, .42, -15, -.09),
    (19.26, '1926_name_second', 0, .38, -17, .09),
    (29.94, '2994_geometry_dot', 0, .23, -25, 0),
    (33.36, '3336_geometry_body', .02, .30, -13, 0),
    (33.36, '3336_geometry_edge', 0, .30, -21, .12),
    (74.38, '7438_lock_low', .004, .23, -14, 0),
    (74.38, '7438_lock_needle', 0, .22, -19, .08),
    (98.32, '9832_star_body', .004, .37, -8, 0),
    (98.32, '9832_star_flash', 0, .64, -14, 0),
    (98.32, '9832_star_spark', 0, .42, -16, 0),
    (99.17, '9917_ceres_title', 0, .40, -17, .12),
]

# Cut to the picture's event times. Two page movements use raw sources
# because they cover actions without a separately exported Foley clip.
RECORDED = [
    (3.44, '0344_quill_contact', .18, -16, .12),
    (4.30, '0430_wood_mallet', .28, -11, -.18),
    (6.01, '0601_tally_wood_a', .14, -17, .23),
    (6.05, '0601_tally_wood_b', .16, -25, .29),
    (15.84, '1584_compass_scrape', .46, -18, .10),
    (23.10, '2310_book_receive', .22, -17, -.20),
    (31.65, '3165_compass_pin', .12, -16, -.18),
    (32.50, '3250_ruler_on_paper', .46, -17, .21),
    (36.78, '3678_diary_nib', .38, -19, .12),
    (38.49, '3849_diary_page_turn', .51, -16, -.27),
    (40.20, '4020_print_press', .24, -13, -.18),
    (41.91, '4191_book_close', .36, -14, .13),
    (53.87, '5387_archive_paper', .27, -17, .13),
    (60.71, '6071_paper_unfold', .58, -16, .08),
    (76.09, '7609_letter_fold', .15, -16, -.22),
    (77.80, '7780_seal_press', .25, -10, 0),
    (82.93, '8293_forecast_paper_slap', .46, -12, .10),
    (87.21, '8721_pendulum_tick', .23, -10, -.14),
    (88.06, '8806_telescope_tooth_1', .10, -15, -.20),
    (88.91, '8891_telescope_tooth_2', .10, -14, -.09),
    (89.77, '8977_telescope_tooth_3', .11, -12, .07),
    (90.62, '9062_telescope_tooth_4', .12, -11, .18),
    (94.04, '9404_forecast_pencil_end', .25, -16, .12),
    (96.61, '9661_telescope_axis', .47, -15, .13),
]


def add_sample(bus, path, start, offset, duration, gain, pan):
    clip = decode(path, 2, offset + duration)[round(offset * SR):]
    if len(clip) < 48 or np.max(np.abs(clip)) < .00001:
        return False
    clip *= db(gain) / np.max(np.abs(clip))
    fade = min(1152, len(clip) // 3)
    clip[:48] *= np.linspace(0, 1, 48)[:, None]
    clip[-fade:] *= np.linspace(1, 0, fade)[:, None]
    place(bus, clip, start, pan)
    return True


def effects():
    bus = np.zeros((COUNT, 2), np.float32)
    layers = set()
    for start, name, offset, duration, gain, pan in STUDIO:
        path = OUT / 'studio' / f'{name}.wav'
        if path.is_file() and add_sample(bus, path, start, offset, duration, gain, pan):
            layers.add(start)
            print(f'Studio {start:6.2f} {path.name}')
    for start, name, duration, gain, pan in RECORDED:
        path = OUT / 'foley' / f'{name}.wav'
        if path.is_file() and add_sample(bus, path, start, 0, duration, gain, pan):
            layers.add(start)
            print(f'Foley  {start:6.2f} {path.name}')
    for start, name, gain, pan in CUES:
        place(bus, foley(name) * db(gain - (5 if start in layers else 0)), start, pan)
    for start, name, duration, gain in [(0, 'whoosh', .52, -29), (17.12, 'hit_soft', .68, -22), (98.32, 'chime', .75, -18)]:
        path = LIBRARY / f'{name}.wav'
        if path.is_file():
            add_sample(bus, path, start, 0, duration, gain, 0)
    return bus


def music(timing):
    song = decode(SONG, 2, LENGTH)
    if len(song) != COUNT:
        raise ValueError(f'Expected {COUNT} score samples, got {len(song)}')
    lane = np.zeros(round(LENGTH * 1000) + 1, np.float32)
    for cue in timing:
        first, last = (round(cue[key] * 1000) for key in ('start', 'end'))
        points = np.array([first - 62, first + 32, last - 2, last + 150])
        domain = np.arange(max(0, points[0]), points[-1] + 1)
        lane[domain] = np.maximum(lane[domain], np.interp(domain, points, [0, 4.5, 4.5, 0]))
    accents = np.interp(np.arange(len(lane)),
        [0, 1530, 2460, 2590, 2750, 14600, 16810, 17120, 17260, 82680, 83160,
         89000, 89380, 90480, 91380, 97230, 97890, 98298, 98304, 98600, 99200, 119630, 120110],
        [0, 0, -1.8, 1.3, 0, 0, -1.7, 1.3, 0, 0, -1.5, 0, -2.5, -2.5, 0, 0, -4.8, -5.4, 2.8, 2.8, 0, 0, -60])
    envelope = np.interp(np.arange(COUNT) / (SR / 1000), np.arange(len(lane)), db(-10.4 - lane + accents))
    return song * envelope[:, None].astype(np.float32)


def master_mix(mix):
    """Apply stereo-linked peak reduction only around loud transients."""
    mix *= db(.8)
    block = SR // 1000
    peaks = np.max(np.abs(mix).reshape(-1, block, 2), axis=(1, 2))
    reduction = 1 - np.minimum(1, db(-1.45) / np.maximum(peaks, 1e-9))
    reduction = ndimage.maximum_filter1d(reduction, size=9)
    decay = math.exp(-1 / 64)
    for i in range(1, len(reduction)):
        reduction[i] = max(reduction[i], reduction[i - 1] * decay)
    envelope = np.interp(np.arange(COUNT) / block, np.arange(len(reduction)), 1 - reduction)
    mix *= envelope[:, None].astype(np.float32)


def main():
    words, timing = narration()
    bed = music(timing)
    mix = words + bed + effects()
    master_mix(mix)
    peak = np.max(np.abs(mix))
    for first, last in ((86.35, 91.48), (94.90, 98.32)):
        assert not np.any(words[round(first * SR):round(last * SR)]), (first, last)
    assert len(timing) == 34
    scratch = OUT / 'mix.render.wav'
    sf.write(scratch, mix, SR, subtype='PCM_24')
    scratch.replace(OUT / 'mix.wav')
    scratch_json = OUT / 'voice-timing.render.json'
    scratch_json.write_text(json.dumps(timing, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    scratch_json.replace(OUT / 'voice-timing.json')
    print(f'{COUNT} samples, peak {20 * math.log10(peak):.2f} dBFS')


def mix_captions():
    """Mix the supplied track and foley without creating a narration bus."""
    samples = music([]) * db(1.7) + effects() * db(1.9)
    master_mix(samples)
    pending = OUT / 'mix-captions.render.wav'
    sf.write(pending, samples, SR, subtype='PCM_24')
    pending.replace(OUT / 'mix-captions.wav')
    print(f'{len(samples)} samples, music and effects only')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--captions-only', action='store_true', help='Mix music and effects for the captioned edition')
    args = parser.parse_args()
    if args.captions_only:
        mix_captions()
    else:
        main()
