"""Build assets/audio/foley.wav at 48 kHz stereo and check its mix with music.

Requires Python, NumPy and FFmpeg on PATH. All foley is original synthesis
from the oscillators and seeded noise below. No recordings or sample packs
are used. The project's music is read only for the mix measurement.
"""

import math
from pathlib import Path
import subprocess
from tempfile import NamedTemporaryFile
import wave

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
FOLEY = ROOT / 'assets/audio/foley.wav'
SAMPLE_RATE = 48_000
FPS = 30
FRAME_COUNT = 3616
SAMPLE_COUNT = FRAME_COUNT * SAMPLE_RATE // FPS
MUSIC_DB = -4.5
PCM_SCALE = 1 << 23


def frame(number):
    return number / FPS


# Resonator partials are (frequency in Hz, amplitude, decay in seconds).
# Each transient combines a pitched body with an independent noise attack.
# Noise parameters are (center in Hz, strength, decay in seconds).
IMPACTS = {
    'copper': (((1270, .60, .070), (2135, .27, .041)), (2800, .22, .007)),
    'cord': (((360, .65, .025), (590, .25, .014)), (1250, .55, .011)),
    'well': (((67, .84, .162), (109, .39, .135), (217, .16, .093)), (445, .66, .055)),
    'stone': (((140, .61, .026), (410, .34, .017)), (1350, .71, .035)),
    'bell': (((362, .72, .29), (745, .35, .23), (1107, .17, .13)), (550, .26, .009)),
    'pin': (((760, .46, .020), (1410, .23, .009)), (2800, .64, .010)),
    'door': (((91, .74, .079), (146, .42, .052), (327, .26, .040)), (520, .75, .030)),
    'bag': (((82, .60, .065), (175, .28, .037)), (360, .71, .065)),
    'glass': (((1925, .72, .043), (3105, .24, .027)), (4700, .24, .007)),
    'twig': (((530, .43, .015), (1040, .19, .014)), (2390, .82, .016)),
    'apple': (((98, .71, .073), (184, .34, .041), (332, .18, .022)), (720, .82, .041)),
    'drop': (((640, .69, .045), (1270, .29, .020)), (2230, .34, .015)),
    'clip': (((493, .46, .022), (1020, .31, .023)), (1790, .63, .015)),
    'wax': (((635, .25, .019), (1080, .16, .011)), (2500, .86, .013)),
    'knock': (((171, .75, .041), (276, .53, .032), (464, .30, .024)), (850, .68, .022)),
    'hollow': (((105, .66, .080), (172, .29, .052)), (410, .38, .038)),
    'type': (((670, .54, .028), (1581, .41, .028), (2710, .23, .021)), (2690, .62, .017)),
    'press': (((72, .73, .082), (129, .47, .069), (262, .32, .044)), (750, .88, .049)),
    'leather': (((108, .69, .055), (205, .22, .037)), (500, .74, .045)),
}

# Moving textures are (start Hz, end Hz, attack fraction, envelope power,
# grain modulation Hz, grain depth). Center frequency follows the movement.
TEXTURES = {
    'wind': (315, 170, .34, 1.4, 3.5, .25),
    'cloth': (1700, 570, .24, 1.5, 17, .48),
    'paper': (3050, 860, .10, 1.5, 23, .55),
    'scratch': (2100, 3800, .12, 1.8, 64, .56),
    'water': (2500, 750, .07, 2.3, 38, .52),
    'leaves': (3100, 1290, .16, 2.2, 31, .67),
    'roll': (770, 410, .08, .85, 18, .71),
    'grass': (1500, 2400, .16, 2.8, 44, .43),
    'swing': (1180, 430, .37, 1.5, 8, .19),
    'slide': (1250, 615, .28, 1.5, 29, .38),
    'orbit': (240, 700, .30, 1.8, 7, .25),
    'pull': (1410, 3390, .19, 1.5, 26, .54),
}

# (start in seconds, sound, length in seconds, peak dBFS, pan, pitch ratio)
# Where a cue lands on a cut, use the project's frame index. Offsets within
# a shot are in seconds so action sync is independent of frame rounding.
CUES = (
    # Copper weight, rope and the well. The distant returns widen the impact.
    (.10, 'copper', .170, -31, -.22, 1.00),
    (.43, 'cord', .144, -25, -.14, .83),
    (frame(26), 'cord', .115, -27, .08, 1.30),
    (frame(26) + .03, 'swing', .670, -30, .13, .71),
    (frame(78), 'well', .680, -15, 0, 1.00),
    (frame(78) + .087, 'well', .550, -29, -.51, .89),
    (frame(78) + .151, 'well', .520, -31, .51, .82),
    (4.03, 'wind', 1.280, -32, .26, .76),
    (frame(232), 'cloth', .389, -23, -.34, .85),
    (frame(283), 'wind', .270, -36, .22, 1.37),
    (frame(411), 'wind', 1.230, -32, -.20, 1.05),
    (frame(437) + .03, 'stone', .172, -24, .12, .83),
    (frame(463), 'scratch', .500, -27, -.20, .83),
    (frame(491) + .10, 'scratch', .268, -31, .12, .61),
    (frame(591) + .16, 'bell', 1.280, -26, -.14, .95),
    (frame(693), 'paper', .340, -26, -.21, 1.04),
    (frame(719), 'pin', .094, -23, .11, .93),
    (frame(796) + .18, 'door', .285, -21, -.31, .92),
    (frame(796) + .66, 'door', .280, -26, .33, 1.10),
    (frame(847) + .20, 'stone', .165, -34, -.29, .95),
    (frame(847) + .62, 'stone', .140, -39, -.36, .95),
    (frame(898) + .12, 'water', .520, -21, -.22, .83),
    (frame(1026) + .24, 'bag', .270, -23, .16, 1.00),
    (frame(1103), 'cloth', .650, -22, -.18, .91),
    (frame(1181) + .20, 'glass', .230, -25, -.12, .91),
    (frame(1360) + .07, 'glass', .235, -27, .20, 1.10),
    (frame(1462), 'paper', .720, -24, -.20, .93),
    (frame(1462) + .48, 'pin', .085, -30, -.10, 1.00),
    (frame(1462) + .83, 'pin', .085, -31, .13, 1.14),
    (frame(1514), 'scratch', .290, -31, .18, .82),
    # Hear the apple 83 ms before the rolling shot at frame 1630.
    (frame(1552), 'leaves', .430, -26, -.28, .84),
    (frame(1565) + .14, 'leaves', .410, -29, .12, .96),
    (frame(1591), 'leaves', .590, -27, .27, 1.05),
    (frame(1616) - .075, 'twig', .095, -23, .18, .92),
    (frame(1616), 'swing', .347, -29, .08, 1.13),
    (54.25, 'apple', .244, -8, -.19, 1.00),
    (54.27, 'leaves', .202, -26, -.13, .79),
    (frame(1630), 'roll', 1.010, -24, -.22, 1.00),
    (frame(1643), 'leaves', .300, -25, .18, .81),
    (frame(1670), 'grass', .261, -29, .16, 1.00),
    (frame(1683), 'apple', .113, -32, .03, .91),
    (frame(1732), 'drop', .330, -25, .19, .96),
    (frame(1757), 'swing', .397, -21, -.22, .95),
    (frame(1770), 'cord', .156, -23, .18, 1.05),
    (frame(1821) + .11, 'paper', .346, -25, -.15, .87),
    (frame(1872), 'clip', .133, -25, .21, .94),
    (frame(1924), 'slide', .398, -23, -.23, 1.12),
    (frame(1937), 'wax', .124, -19, .11, .95),
    (frame(1963), 'paper', .310, -30, .11, 1.16),
    (frame(1988), 'scratch', .359, -28, -.14, .86),
    (frame(2014), 'paper', .101, -31, -.30, 1.01),
    # Two knocks precede Halley's reveal at frame 2027 (67.5667 s).
    (67.18, 'knock', .207, -14, -.22, .95),
    (67.39, 'knock', .234, -12, -.22, 1.03),
    (67.43, 'knock', .181, -30, .33, .82),
    (frame(2027), 'wind', .280, -32, .29, 1.29),
    (frame(2053), 'stone', .181, -23, -.19, .85),
    (frame(2053) + .024, 'water', .140, -34, -.16, .70),
    (frame(2053) + .53, 'stone', .162, -27, .11, .94),
    (frame(2129), 'cloth', .360, -29, .26, 1.09),
    (frame(2181), 'slide', 1.760, -25, -.17, 1.02),
    (frame(2232), 'copper', .160, -29, .20, .44),
    (frame(2334), 'pin', .115, -24, -.25, .88),
    (frame(2334) + .14, 'pin', .100, -26, .23, 1.08),
    (frame(2372), 'scratch', .519, -26, .18, .81),
    (frame(2488), 'paper', .530, -25, -.20, .94),
    (frame(2540), 'paper', .437, -30, .12, .76),
    (frame(2591), 'paper', .305, -35, .17, .91),
    (frame(2693), 'cloth', .290, -38, -.15, .81),
    # Leave the pause before the drum open. The orbit opens with a soft tail.
    (frame(2796), 'pin', .095, -27, -.27, .86),
    (frame(2796) + .29, 'pin', .084, -30, -.07, .92),
    (frame(2796) + .61, 'pin', .081, -32, .18, .97),
    (frame(2898), 'pin', .083, -33, .09, .69),
    (frame(2898) + .27, 'pin', .080, -35, .21, .76),
    (frame(2950) + .020, 'orbit', .660, -30, -.48, .84),
    (frame(2950) + .034, 'orbit', .622, -32, .51, 1.13),
    (frame(3027), 'hollow', .290, -24, -.27, 1.00),
    (frame(3027) + .137, 'hollow', .278, -25, .29, 1.13),
    # Type seats, platen hits, the press frame settles, and the sheet pulls free.
    (frame(3130), 'type', .140, -22, -.26, 1.04),
    (frame(3130) + .15, 'type', .163, -25, .19, .91),
    (frame(3155) - .103, 'slide', .163, -28, -.19, .52),
    (frame(3155), 'press', .385, -12, -.04, 1.00),
    (frame(3155) + .029, 'type', .208, -23, .27, .57),
    (frame(3155) + .139, 'door', .214, -25, -.26, .82),
    (frame(3180), 'pull', .531, -22, .26, .91),
    (frame(3231), 'leather', .273, -22, -.16, .92),
    (frame(3257), 'paper', .545, -24, .22, .91),
    (frame(3360), 'swing', .205, -29, -.28, .76),
    (frame(3386), 'swing', .193, -29, .06, 1.05),
    (frame(3411), 'swing', .265, -28, .29, 1.44),
    (frame(3501), 'paper', .303, -31, -.11, 1.04),
    (frame(3565), 'copper', .276, -31, .09, .63),
)


def amplitude(db):
    return 10 ** (db / 20)


def band_noise(rng, size, center):
    spectrum = np.fft.rfft(rng.standard_normal(size))
    frequency = np.fft.rfftfreq(size, 1 / SAMPLE_RATE)
    ratio = frequency / center
    response = ratio ** 2 / (1 + ratio ** 2) / (1 + (ratio / 1.65) ** 4)
    noise = np.fft.irfft(spectrum * response, n=size)
    return noise / np.sqrt(np.mean(noise ** 2))


def synthesize(rng, sound, length, pitch):
    t = np.arange(round(length * SAMPLE_RATE)) / SAMPLE_RATE
    if sound in IMPACTS:
        partials, (center, strength, decay) = IMPACTS[sound]
        signal = strength * band_noise(rng, len(t), center * pitch) * np.exp(-t / decay)
        for frequency, weight, decay in partials:
            phase = 2 * np.pi * pitch * frequency * t
            if sound == 'drop':
                phase += 2 * np.pi * 7 * (1 - np.exp(-t / .024))
            signal += weight * np.sin(phase) * np.exp(-t / decay)
        signal *= np.minimum(t / .0025, 1)
    else:
        low, high, attack, power, rate, depth = TEXTURES[sound]
        progress = t / length
        body = band_noise(rng, len(t), low * pitch) * (1 - progress)
        body += band_noise(rng, len(t), high * pitch) * progress
        phase = 2 * np.pi * rate * (t + .35 * t * progress)
        grains = (1 - depth) + depth * (.5 + .5 * np.sin(phase)) ** 2
        rise = np.sin(np.minimum(progress / attack, 1) * np.pi / 2) ** 2
        fall = np.minimum((1 - progress) / (1 - attack), 1) ** power
        signal = body * grains * rise * fall

    tail_size = min(round(.020 * SAMPLE_RATE), len(t))
    signal[-tail_size:] *= np.linspace(1, 0, tail_size)
    return signal / np.max(np.abs(signal))


def render_foley():
    rng = np.random.default_rng(1687)
    track = np.zeros((SAMPLE_COUNT, 2), dtype=np.float32)
    for start, sound, length, db, pan, pitch in CUES:
        signal = synthesize(rng, sound, length, pitch)
        angle = (pan + 1) * np.pi / 4
        stereo = signal[:, None] * np.array([np.cos(angle), np.sin(angle)])
        stereo *= amplitude(db)
        first = round(start * SAMPLE_RATE)
        last = first + len(signal)
        if first < 0 or last > SAMPLE_COUNT:
            raise ValueError(f'{sound} cue at {start:.3f}s exceeds timeline')
        track[first:last] += stereo
    return track


def write_wav(track):
    if np.max(np.abs(track)) >= 1:
        raise ValueError('Foley clips before PCM conversion')
    pcm = np.rint(track.astype(np.float64) * PCM_SCALE).astype(np.int32)
    # wave expects interleaved, little-endian signed 24-bit samples.
    samples = pcm.reshape(-1)
    packed = np.stack((samples, samples >> 8, samples >> 16), axis=1).astype(np.uint8)
    with NamedTemporaryFile(dir=FOLEY.parent, suffix='.wav.tmp', delete=False) as output:
        temporary = Path(output.name)
    try:
        with wave.open(str(temporary), 'wb') as wav:
            wav.setparams((2, 3, SAMPLE_RATE, 0, 'NONE', 'not compressed'))
            wav.writeframes(packed.tobytes())
        temporary.replace(FOLEY)
    finally:
        temporary.unlink(missing_ok=True)
    return pcm.astype(np.float32) / PCM_SCALE


def read_music():
    result = subprocess.run(
        ['ffmpeg', '-v', 'error', '-nostdin', '-i', 'assets/audio/music.mp3',
         '-map', '0:a:0', '-af', f'aresample={SAMPLE_RATE},atrim=end_sample={SAMPLE_COUNT}',
         '-ac', '2', '-f', 'f32le', 'pipe:1'],
        cwd=ROOT, check=True, stdout=subprocess.PIPE,
    )
    music = np.frombuffer(result.stdout, dtype='<f4').reshape(-1, 2)
    if len(music) < SAMPLE_COUNT:
        music = np.pad(music, ((0, SAMPLE_COUNT - len(music)), (0, 0)))
    return music * amplitude(MUSIC_DB)


def print_peak(label, track):
    index, channel = np.unravel_index(np.abs(track).argmax(), track.shape)
    peak = abs(float(track[index, channel]))
    db = 20 * math.log10(peak) if peak else -math.inf
    print(f'{label:21s} {db:7.2f} dBFS at {index / SAMPLE_RATE:.4f}s ({"LR"[channel]})')
    return peak


def main():
    music = read_music()
    foley = render_foley()
    if np.max(np.abs(foley + music)) >= 1:
        raise ValueError('Music and foley sum clips. Adjust cue gains.')
    foley = write_wav(foley)
    print(f'{FOLEY.name}: {SAMPLE_COUNT} samples/channel, {SAMPLE_RATE} Hz, stereo PCM 24-bit')
    print(f'Duration: {SAMPLE_COUNT / SAMPLE_RATE:.9f}s ({FRAME_COUNT}/{FPS}); {len(CUES)} cues')
    print_peak('Foley', foley)
    print_peak(f'Music ({MUSIC_DB:g} dB)', music)
    print_peak('Music + foley', music + foley)


if __name__ == '__main__':
    main()
