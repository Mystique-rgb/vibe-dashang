"""Render the effects and ducked background from the shared sound cues."""
import json
from pathlib import Path
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
config = subprocess.check_output(['node', '--input-type=module', '-e', '''
import {soundCues} from './src/sound-cues.js';
import {DURATION} from './src/timeline.js';
console.log(JSON.stringify({soundCues,DURATION}));
'''], cwd=ROOT)
project = json.loads(config)


def noise(rng, length, low, high):
    n = rng.standard_normal(length)
    band = sosfilt(butter(2, [low, high], btype='bandpass', fs=RATE, output='sos'), n)
    return band / max(0.00001, np.max(np.abs(band)))


def tone(t, hz, end=None, bend=22):
    if end is None:
        return np.sin(2 * np.pi * hz * t)
    return np.sin(2 * np.pi * (end * t + (hz-end) * -np.expm1(-bend*t) / bend))


def one_shot(voice, rng):
    lengths = {'strike': .55, 'seal': .47, 'fault': .27, 'foil': .55, 'rush': .51,
               'release': .59, 'card': .19, 'write': .18, 'scan': .47, 'click': .13}
    size = round(lengths[voice] * RATE)
    t = np.arange(size) / RATE
    decay = lambda speed: np.exp(-t * speed)
    if voice in {'strike', 'seal', 'fault'}:
        frequency = 113 if voice == 'strike' else 156 if voice == 'fault' else 88
        sample = .55 * tone(t, frequency, 45, 31) * decay(12.4)
        sample += (.43 * noise(rng, size, 1160, 5260) + .18 * tone(t, 938, 450, 52)) * decay(45)
        if voice == 'fault':
            sample += .26 * tone(t, 246, 99, 28) * decay(17)
    elif voice in {'rush', 'release', 'foil'}:
        movement = np.sin(np.pi*t/lengths[voice])**1.5 * decay(1.5)
        sample = noise(rng, size, 1100, 6150) * movement
        if voice == 'foil':
            sample += (.23*tone(t,2883,1173,11)+.17*tone(t,4199,1948,12))*decay(10)
        elif voice == 'rush':
            sample += .32 * tone(t,184,82,10) * movement
    elif voice == 'card':
        pulse = (.45+.55*np.sin(np.pi*np.minimum(1,t/.08))**2)*decay(22)
        sample = noise(rng, size, 1710, 7680)*pulse+.19*tone(t,2080,849,54)*decay(54)
        sample += .22 * noise(rng,size,290,900)*decay(39)
    elif voice == 'write':
        envelope = np.sin(np.pi*t/lengths[voice])**1.65
        sample = noise(rng,size,2250,8220)*envelope*(.55+.45*tone(t,32))
    elif voice == 'scan':
        envelope = np.sin(np.pi*t/lengths[voice])**1.8
        sample = (.34*tone(t,1390,4910,9)+.37*noise(rng,size,2700,6500))*envelope*(.64+.36*tone(t,22))
    else:
        sample = (.5*tone(t,2460,1110,68)+.44*noise(rng,size,1300,5750))*decay(48)
    sample *= np.minimum(1,t/.004)*np.minimum(1,(lengths[voice]-t)/.021)
    return sample / np.maximum(np.max(np.abs(sample)), .01)


levels = {'strike':.139, 'seal':.162, 'fault':.162, 'foil':.108, 'rush':.154,
          'release':.106, 'card':.124, 'write':.081, 'scan':.115, 'click':.099}
output = np.zeros((round(project['DURATION'] * RATE),2), dtype=np.float64)
for index,cue in enumerate(project['soundCues']):
    position = round(cue['time'] * RATE)
    sample = one_shot(cue['voice'], np.random.default_rng(673 + index * 67))
    size = min(len(sample),len(output)-position)
    pan_angle = (cue['pan']+1)*np.pi/4
    stereo = np.array([np.cos(pan_angle),np.sin(pan_angle)])
    output[position:position+size] += (sample[:size]*levels[cue['voice']]*cue['gain'])[:,None]*stereo
wavfile.write(ROOT/'assets'/'foley.wav',RATE,np.round(output*32767).astype(np.int16))
print(f"{len(project['soundCues'])} cues, {len(output)/RATE:.2f}s, peak {20*np.log10(np.max(np.abs(output))):.2f} dBFS")


def ramp(values):
    values = np.clip(values, 0, 1)
    return values * values * (3 - 2 * values)


def render_background():
    source = ROOT / 'assets' / 'nov24.mp3'
    command = ['ffmpeg', '-v', 'error', '-i', str(source), '-vn', '-ac', '2',
               '-ar', str(RATE), '-t', str(project['DURATION']), '-f', 'f32le', '-']
    music = np.frombuffer(subprocess.check_output(command), dtype=np.float32).reshape(-1, 2)
    if len(music) != len(output):
        raise RuntimeError(f'Expected {len(output)} background samples, got {len(music)}')
    time = np.arange(len(music)) / RATE
    attenuation = 5.4 * ramp((time - 5.59) / .46)
    dips = np.zeros(len(music))
    for cue in project['soundCues']:
        if cue['time'] < 5.67:
            continue
        # Repeated ticks share the largest dip instead of stacking gain reduction.
        base, hold, release = {
            'seal': (4.6, .11, .25), 'fault': (4.4, .084, .20),
            'card': (3.5, .066, .16), 'rush': (4.7, .21, .22),
            'foil': (2.7, .088, .21), 'scan': (3.0, .17, .23),
            'write': (1.6, .067, .12), 'click': (1.85, .039, .13),
            'release': (2.4, .18, .23),
        }[cue['voice']]
        at = cue['time']
        attack = .065
        i = max(0, round((at - attack) * RATE))
        j = min(len(time), round((at + hold + release) * RATE))
        local = time[i:j] - at
        gain = ramp((local + attack) / attack) * (1 - ramp((local - hold) / release))
        dips[i:j] = np.maximum(dips[i:j], gain * base)
    adjusted = music.astype(np.float64) * 10 ** (-(attenuation + dips)[:, None] / 20)
    wavfile.write(ROOT / 'assets' / 'music-ducked.wav', RATE, adjusted.astype(np.float32))
    print('Music: gentle 5.4 dB post-dialogue trim, plus event-priority dips up to 4.7 dB.')


render_background()
