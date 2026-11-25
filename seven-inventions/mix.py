import argparse
import json
from pathlib import Path
import subprocess
import wave

import numpy as np


ROOT = Path(__file__).resolve().parent
SOURCE = Path('D:/vibe小曲/霓虹兔 - Chaikovsky.mp3')
SR = 48000
STRETCHED_RATE = 47520  # 48 kHz × 99/100, played back at 48 kHz.


def sample(seconds):
    return round(seconds * SR)


def clock(seconds):
    return np.arange(sample(seconds)) / SR


def ffmpeg(*args, data=None):
    return subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', *args],
                          input=data, stdout=subprocess.PIPE, check=True).stdout


def decode(path, rate=SR, channels=2):
    pcm = ffmpeg('-i', str(path), '-ac', str(channels), '-ar', str(rate), '-f', 'f32le', 'pipe:1')
    return np.frombuffer(pcm, '<f4').reshape(-1, channels)


def resample(pcm, rate, channels=2, output='f32le', filters=()):
    chain = ','.join((*filters, f'aresample={rate}:filter_size=64'))
    return ffmpeg('-f', 'f32le', '-ar', str(SR), '-ac', str(channels), '-i', 'pipe:0',
                  '-af', chain, '-f', output, 'pipe:1', data=np.asarray(pcm, '<f4').tobytes())


def music_bed(source, spec):
    source_drop = sample(spec['sourceDrop'])
    drop = spec['dropFrame'] * (SR // spec['fps'])
    length = spec['frames'] * (SR // spec['fps'])
    fade_start, fade_end = drop - sample(.38), drop - sample(.10)

    def section(start, end):
        # Both decoder inputs start on the same rational resampler phase.
        # The padded cut points keep the resampling filter away from either edit.
        first = (start - drop - 256) // 99
        last = (end - drop + 256 + 98) // 99
        lo, hi = source_drop + first * 100, source_drop + last * 100
        if lo < 0 or hi > len(source):
            raise ValueError('Source does not cover the two music sections')
        rendered = np.frombuffer(resample(source[lo:hi], STRETCHED_RATE), '<f4').reshape(-1, 2)
        origin = drop + first * 99
        return rendered[start - origin:end - origin]

    search = 48
    preroll = section(0, fade_end + search)
    climax = section(fade_start, length)
    overlap = fade_end - fade_start
    reference = climax[:overlap:4].astype(np.float64)
    scores = []
    for lag in range(-search, search + 1):
        candidate = preroll[fade_start + lag:fade_end + lag:4].astype(np.float64)
        scores.append(np.sum(candidate * reference) / (np.linalg.norm(candidate) * np.linalg.norm(reference)))
    lag = max(range(-search, search + 1), key=lambda i: (scores[i + search], -abs(i)))
    # Apply any correction to the preroll only. The source drop stays pinned.
    before = preroll[:fade_start] if lag == 0 else section(-search, fade_start + search)[search + lag:search + lag + fade_start]
    fade = (.5 - .5 * np.cos(np.linspace(0, np.pi, overlap)))[:, None]
    blend = preroll[fade_start + lag:fade_end + lag] * (1 - fade) + climax[:overlap] * fade
    bed = np.concatenate((before, blend, climax[overlap:])).astype(np.float32)
    print(f'music splice {fade_start/SR:.6f}-{fade_end/SR:.6f}s, lag={lag:+d} samples, r={scores[lag+search]:.9f}')
    return bed


def mix_audio(bed, spec):
    music = bed * .58
    effects = np.zeros_like(music)
    rng = np.random.default_rng(7612)

    def add(when, sound, gain, pan=0):
        index = sample(when)
        left, right = max(0, index), min(len(effects), index + len(sound))
        if right > left:
            sound = sound[left - index:right - index]
            if sound.ndim == 1:
                sound = sound[:, None]
            effects[left:right] += sound * (gain * np.sqrt([1 - pan, 1 + pan]))

    def load_sound(path):
        sound = decode(path, channels=1).ravel()
        return sound / np.max(np.abs(sound))

    sfx = ROOT / 'assets/sfx'
    metal, drum = (load_sound(sfx / f'{name}.wav') for name in ('metal', 'drum'))
    # The reference's 40s hit also included wind, shatter, and a separate impact.
    # Isolate its pitched ring from the original shimmer track.
    bell_pcm = ffmpeg('-i', str(sfx / 'bell-tone.wav'), '-ac', '1', '-ar', str(SR),
                      '-af', 'lowpass=f=2180:p=2,lowpass=f=2180:p=2',
                      '-f', 'f32le', 'pipe:1')
    bell = np.frombuffer(bell_pcm, '<f4')[:sample(.64)].copy()
    bell /= np.max(np.abs(bell))
    bell_time = clock(.64)
    bell *= np.minimum(bell_time / .004, 1)
    bell *= .5 - .5 * np.cos(np.pi * np.clip((.64 - bell_time) / .20, 0, 1))
    # Rebuild one stereo slot from the original three layers and relative levels.
    slot = np.zeros((sample(.9), 2), dtype=np.float32)
    for name, duration, db in (('glitch', .3, -1.5), ('shatter', .9, -6), ('tick', .1, 0)):
        layer = decode(sfx / f'{name}.wav')[:sample(duration)]
        slot[:len(layer)] += layer * 10**(db / 20)
    slot /= np.max(np.abs(slot))
    grain = load_sound(sfx / 'impact.wav')
    grain_t = clock(len(grain)/SR)
    grain *= np.exp(-np.maximum(grain_t - .09, 0) / .23)

    def band_noise(t, low, high):
        raw = rng.standard_normal(len(t))
        hz = np.fft.rfftfreq(len(t), 1/SR)
        curve = np.clip((hz-low)/low, 0, 1) * np.clip((high-hz)/(.35*high), 0, 1)
        sound = np.fft.irfft(np.fft.rfft(raw) * curve, n=len(t))
        return sound / max(.01, np.max(np.abs(sound)))

    def impact(when, gain, floor=51, decay=.10, layer=.68):
        t = clock(decay*5)
        phase = 2*np.pi*(floor*t + 43*.036*(1 - np.exp(-t/.036)))
        weight = .82*np.sin(phase) + .18*np.sin(phase*1.54 + .16)
        body = weight * np.exp(-t/decay) * np.minimum(t/.003, 1)
        body *= np.clip((t[-1]-t)/.045, 0, 1)
        add(when, body, gain)
        add(when, grain, gain*layer)

    def ping(when, hz, gain, pan=0, sweep=0, decay=.034):
        t = clock(decay*5)
        phase = 2*np.pi*(hz*t + sweep*t*t/2)
        bell = np.sin(phase) + .23*np.sin(1.68*phase)
        add(when, bell*np.exp(-t/decay)*np.minimum(t/.002, 1), gain, pan)

    def shutter(entry):
        # Two close mechanical strokes, then the quieter return of the film lever.
        for delay, pitch, strength in ((.240, 1080, 1.08), (.293, 1470, .82), (.450, 670, .38)):
            t = clock(.10)
            for offset, low, high, level in ((0, 480, 3150, .76), (.008, 1600, 8200, .43)):
                noise = band_noise(t, low, high) * np.exp(-t / .009)
                spring = np.sin(2*np.pi*pitch*t) * np.exp(-t / .013)
                click = (.69*noise + .31*spring) * np.minimum(t/.0011, 1)
                add(entry + delay + offset, click, strength*level, .27)

    def telephone(entry):
        # An electro-mechanical pair of bells, with two short rings.
        t = clock(.36)
        envelope = np.minimum(t/.006, 1) * np.clip((.36-t)/.055, 0, 1)
        pair = (.49*np.sin(2*np.pi*586*t) + .34*np.sin(2*np.pi*746*t)
                + .12*np.sin(2*np.pi*1394*t) + .05*np.sin(2*np.pi*1770*t))
        cadence = .46 + .54 * np.maximum(0, np.cos(2*np.pi*18*t))**2
        for delay, level in ((.23, .64), (.76, .54)):
            add(entry+delay, pair*cadence*envelope, level, .24)
        receiver = metal[:sample(.045)] * np.linspace(1, 0, sample(.045))
        add(entry+1.17, receiver, .22, .25)

    def filament(entry):
        t = clock(.66)
        noise = band_noise(t, 950, 6250)
        click = noise * np.exp(-t/.007) * np.minimum(t/.0015, 1)
        add(entry+.255, click, .94, .23)
        snap = metal[:sample(.036)] * np.linspace(1, 0, sample(.036))**2
        add(entry+.255, snap, .43, .21)
        glow = (.57*np.sin(2*np.pi*(108*t+24*t*t)) + .22*np.sin(2*np.pi*234*t)
                + .11*np.sin(2*np.pi*354*t))
        envelope = np.minimum(t/.045, 1) * np.exp(-t/.15) * np.clip((.50-t)/.065, 0, 1)
        add(entry+.29, glow*envelope, .58, .18)

    def aircraft(entry):
        t = clock(1.22)
        phase = 2*np.pi*(37*t + 32*t*t)
        blade = (.49*np.sin(phase) + .24*np.sin(2*phase) + .18*np.sin(3*phase)
                 + .09*np.sin(5*phase))
        air = band_noise(t, 230, 3100)*(.17+.83*np.maximum(0,np.cos(phase))**2)
        envelope = np.minimum(t/.075, 1) * np.clip((1.04-t)/.19, 0, 1)
        engine = (.78*blade+.32*air)*envelope
        add(entry+.19, engine, .43, .04)
        add(entry+.213, engine, .15, .49)

    def container(entry):
        thud = clock(.36)
        tail = np.clip((.36-thud)/.065, 0, 1)
        phase = 2*np.pi*(64*thud + 31*.029*(1-np.exp(-thud/.029)))
        weight = np.sin(phase) * np.exp(-thud/.047)
        panels = (.38*np.sin(2*np.pi*324*thud)+.27*np.sin(2*np.pi*489*thud)
                  + .18*np.sin(2*np.pi*898*thud)) * np.exp(-thud/.051)
        for delay, level in ((.26, .48), (.55, .35), (.86, .64)):
            add(entry+delay, (.62*weight+panels)*tail*np.minimum(thud/.002, 1), level, .29)
            snap = metal[:sample(.095)] * np.linspace(1,0,sample(.095))
            add(entry+delay, snap, level*.64, .24)

    def satellite(entry, ticks):
        for index, when in enumerate((*ticks[1:], entry+.55, entry+.74), start=1):
            ping(when, 1260+index*156, .29-index*.035, (-1)**index*.39, sweep=4200, decay=.050)
            ping(when+.061, 1040+index*164, .105, (-1)**(index+1)*.52, sweep=-1100)

    intro_hold, intro_release = sample(.10), sample(.09)
    intro_duck = np.concatenate((np.full(intro_hold, .72), np.linspace(.72, 1, intro_release)))
    for index, when in enumerate(spec['intro']):
        add(when, slot, .64+index*.028)
        # Give the quieter scrape following the tick space against the music.
        at = sample(when)
        lead = min(at, sample(.012))
        music[at-lead:at] *= np.linspace(1, .72, lead)[:, None]
        music[at:at+len(intro_duck)] *= intro_duck[:, None]
    add(spec['titleHit'], bell, .91)
    for index, when in enumerate(spec['titlePulses']):
        ping(when, 560+index*95, .15, (-1)**index*.3, sweep=1200)

    designs = (shutter, telephone, filament, aircraft, container, satellite)
    for index, design in enumerate(designs):
        entry, name = spec['starts'][index], spec['nameHits'][index]
        add(entry, slot, .83)
        if design is satellite:
            design(entry, spec['storyHits'][index])
        else:
            design(entry)
        add(name, bell, .77)
        for step in (4, 6, 10, 12, 14):
            when = spec['beatMotion'][index][step]
            ping(when, 910+index*113+step*18, .052, (-1)**(step//2)*.29)

    for index, when in enumerate(spec['build']):
        add(when, drum[:sample(.32)], .16+index*.023)
        ping(when, 515+index*79, .11+index*.012, (-1)**index*.30, sweep=750)
    t = clock(1.24)
    rise = (.72*band_noise(t, 300, 6500) + .28*np.sin(2*np.pi*(225*t+390*t*t)))
    envelope = (t/t[-1])**2 * np.clip((t[-1]-t)/.12, 0, 1)
    add(spec['drop']-1.35, rise*envelope, .36, -.33)
    add(spec['drop'], bell, 1.46)
    # The screen and first link come into view after the bell and timer pair.
    web = spec['drop'] + .57
    key_length = sample(.058)
    key = metal[:key_length] * np.linspace(1, 0, key_length)**2
    add(web, key, .38, .26)
    add(web+.071, key, .17, .31)
    ping(web+.115, 723, .34, .26, decay=.024)
    ping(web+.175, 1085, .28, .24, decay=.028)

    # Two short timer ticks follow the right-hand impact and track the detail rows.
    for when in spec['detailHits']:
        ping(when, 1480, .115, -.15, decay=.010)
        ping(when+2/spec['fps'], 1960, .108, -.15, decay=.012)

    for index, word in enumerate(spec['heroWords']):
        # The inserted labels get the same ping pair, between the original pitches.
        position = index / 2
        side = (-1)**((index+1)//2)
        ping(word['time'], 870+position*175, .29, side*.35, sweep=2250)
        ping(word['time']+.075, 1410+position*112, .13, -side*.42)
    impact(spec['out'], .78, floor=60, layer=.81)
    ping(spec['outroHit'], 660, .23, -.26)
    ping(spec['outroHit']+.033, 990, .17, .33)

    major = [spec['titleHit'], *spec['nameHits'], spec['out']]
    for when in [*major, *spec['starts'][:-1]]:
        index = sample(when)
        lead, hold, tail = (sample(t) for t in (.033, .055, .148))
        floor = .50 if when in major else .73
        duck = np.concatenate((np.linspace(1, floor, lead), np.full(hold, floor), np.linspace(floor, 1, tail)))
        music[index-lead:index+hold+tail] *= duck[:, None]
    music[:sample(.022)] *= np.linspace(0, 1, sample(.022))[:, None]
    fade = sample(.72)
    mix = music + effects
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    magnitude = np.abs(mix)
    hot = magnitude > .73
    mix[hot] = np.sign(mix[hot]) * (.73 + .126*np.tanh((magnitude[hot] - .73)/.126))
    return mix * .80  # Codec headroom after shaping the loudest transients.


def rms_db(pcm):
    return 20*np.log10(np.sqrt(np.mean(pcm**2)))


def verify(source, bed, spec, path):
    drop = sample(spec['drop'])
    source_drop = sample(spec['sourceDrop'])
    expected_len = spec['frames'] * (SR // spec['fps'])
    with wave.open(str(path), 'rb') as output:
        if (output.getnchannels(), output.getsampwidth(), output.getframerate(), output.getnframes()) != (2, 2, SR, expected_len):
            raise ValueError('WAV format or duration differs from the timeline')
        pcm = np.frombuffer(output.readframes(expected_len), '<i2').reshape(-1, 2)
    clipped = np.count_nonzero((pcm == -32768) | (pcm == 32767))
    if clipped:
        raise ValueError(f'WAV contains {clipped} clipped samples')
    master = pcm.astype(np.float32) / 32768
    print(f'WAV sample peak {20*np.log10(np.max(np.abs(master))):+.2f} dBFS, clipped samples={clipped}')

    def match_source(render, start, end):
        start, end = sample(start), sample(end)
        offsets = np.arange(start, end) - drop
        # Compare directly to the decoded MP3 on its own sample clock. Linear
        # interpolation here is independent of the renderer's FFmpeg resampler.
        positions = source_drop + offsets * spec['rate']
        left = np.floor(positions).astype(np.int64)
        fraction = (positions-left)[:, None]
        reference = source[left]*(1-fraction) + source[left+1]*fraction
        reference = reference.astype(np.float64).ravel()
        lags = range(-80, 81)
        scores = []
        for lag in lags:
            candidate = render[start+lag:end+lag].astype(np.float64).ravel()
            scores.append(np.sum(candidate*reference) / (np.linalg.norm(candidate)*np.linalg.norm(reference)))
        best = int(np.argmax(scores))
        return lags[best], scores[best]

    for label, render, start, end, minimum in (
        ('bed at drop', bed, spec['drop']-.09, spec['drop']+.24, .99),
        ('final WAV after drop', master, 43.40, 43.69, .98),
    ):
        lag, correlation = match_source(render, start, end)
        print(f'{label} vs direct MP3: lag={lag:+d} samples, r={correlation:.6f}')
        if lag or correlation < minimum:
            raise ValueError(f'Source alignment check failed for {label}')
    pre = rms_db(source[source_drop-sample(.08):source_drop-sample(.01)])
    post = rms_db(source[source_drop:source_drop+sample(.09)])
    print(f'MP3 at {spec["sourceDrop"]:.3f}s, pre/post RMS {pre:.2f}/{post:.2f} dBFS, rise {post-pre:+.2f} dB')
    print(f'MP3 sample {source_drop} -> WAV sample {drop} -> frame {spec["dropFrame"]}')

    cues = [('title', spec['titleHit']), *zip(spec['chapters'][:-1], spec['nameHits'][:-1]),
            ('drop', spec['drop']), ('out', spec['out']), ('outro', spec['outroHit'])]
    cue_levels = []
    for label, when in cues:
        index = sample(when)
        level = rms_db(master[index:index+sample(.1)])
        prior = rms_db(master[index-sample(.55):index-sample(.15)])
        cue_levels.append(level)
        print(f'{label} {when:.6f}s: 100ms RMS {level:+.2f} dBFS, vs pre-cue {level-prior:+.2f} dB')
    if cue_levels[7] != max(cue_levels):
        raise ValueError('The drop must be the strongest named impact')
    energy = np.concatenate(([0], np.cumsum(np.mean(master**2, axis=1), dtype=np.float64)))
    for duration in (.10, .25):
        n = sample(duration)
        windows = energy[n:] - energy[:-n]
        strongest = int(np.argmax(windows))
        print(f'global {duration*1000:.0f}ms RMS max: {strongest/SR:.6f}s, {10*np.log10(windows[strongest]/n):+.2f} dBFS')
        if abs(strongest-drop) > sample(.12):
            raise ValueError('The strongest sustained impact must be near the drop')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', nargs='?', type=Path, default=SOURCE)
    parser.add_argument('--verify', action='store_true', help='Check the existing WAV without rewriting it')
    args = parser.parse_args()
    spec = json.loads((ROOT / 'assets/sync.json').read_text(encoding='utf8'))
    if not np.isclose(spec['rate'], SR / STRETCHED_RATE, rtol=0, atol=1e-12):
        raise ValueError('Unexpected music playback rate')
    source = decode(args.source)
    bed = music_bed(source, spec)
    destination = ROOT / 'assets/mix.wav'
    if args.verify:
        verify(source, bed, spec, destination)
        return
    mix = mix_audio(bed, spec)
    limiter = ('aresample=192000:filter_size=64', 'alimiter=limit=0.84:attack=0.5:release=4:level=0:latency=1')
    pcm = resample(mix, SR, output='s16le', filters=limiter)
    if len(pcm) != len(bed) * 4:
        raise ValueError('Mastering changed the sample count')
    with wave.open(str(destination), 'wb') as output:
        output.setparams((2, 2, SR, 0, 'NONE', 'not compressed'))
        output.writeframes(pcm)
    peak = np.max(np.abs(np.frombuffer(pcm, '<i2').astype(np.int32))) / 32768
    print(f'{len(bed)} samples/channel, {len(bed)/SR:.9f}s, sample peak {20*np.log10(peak):.2f} dBFS')


if __name__ == '__main__':
    main()
