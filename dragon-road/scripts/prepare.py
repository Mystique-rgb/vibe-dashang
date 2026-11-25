"""Build timed captions and music/effects mix from the approved storyboard."""
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
LENGTH = 3653 / 30
ROWS = re.compile(r'^\| (\d{2}) \| (\d{2}):(\d+\.\d+) \| ([^|]+) \| ([^|]+) \|$', re.M)


def read_story():
    story = next(ROOT.parent.glob('*分镜审稿.md')).read_text(encoding='utf-8')
    return [dict(id=int(idx), start=60*int(minutes)+float(seconds), hit='◆' in visual,
                 text='' if '留拍' in text else text.strip())
            for idx, minutes, seconds, visual, text in ROWS.findall(story)]


def write_module(name, data):
    (ROOT / 'src' / name).write_text('export default ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')


def cues_for(shots):
    cues = [dict(id=r['id'], start=round(r['start'] + (.035 if r['id'] in (1, 63, 78, 79) else .055), 3), text=r['text']) for r in shots if r['text']]
    for i, cue in enumerate(cues):
        cue['end'] = round((cues[i+1]['start'] if i+1 < len(cues) else LENGTH) - .048, 3)
    return cues


def decode(path, channels, duration):
    cmd = ['ffmpeg','-v','error','-i',str(path),'-ac',str(channels),'-ar',str(RATE)]
    cmd += ['-t',str(duration)]
    cmd += ['-f','f32le','-']
    return np.frombuffer(subprocess.check_output(cmd), dtype='<f4').reshape(-1,channels)


def effect(track, rng, at, kind):
    duration = {'tap':.13, 'door':.50, 'water':.55, 'beat':.55, 'step':.17, 'paper':.20}[kind]
    time = np.arange(round(duration*RATE))/RATE
    noise = rng.normal(0,1,len(time))
    if kind in ('tap','paper'):
        band = signal.sosfilt(signal.butter(2,[900,4400],'bandpass',fs=RATE,output='sos'),noise)
        s = band*np.exp(-time/(.036 if kind=='tap' else .082)) * (.041 if kind=='tap' else .027)
    else:
        f = {'door':43,'water':80,'beat':48,'step':85}[kind]
        s = np.sin(2*np.pi*(f*time+19*(1-np.exp(-time*5))/5))*np.exp(-time/(.17 if kind in ('door','beat') else .063))*.089
        s += signal.sosfilt(signal.butter(2,[250,1900],'bandpass',fs=RATE,output='sos'),noise)*np.exp(-time/.11)*.063
    s *= np.minimum(1,time/.006)*np.minimum(1,(duration-time)/.025)
    i = round(at*RATE); n = len(s)
    track[i:i+n,0] += s*.94
    track[i:i+n,1] += s*.83


def save_wave(name,data):
    wavfile.write(ROOT/'assets'/name,RATE,np.rint(np.clip(data,-.999,.999)*32767).astype('<i2'))


def main():
    shots = read_story()
    assert len(shots)==79 and shots[0]['start']==0
    cues = cues_for(shots)
    write_module('timeline.mjs',shots)
    write_module('captions.mjs', cues)
    if '--timing' in __import__('sys').argv:
        return
    result = decode(ROOT/'assets/music.mp3',2,LENGTH).copy() * .76
    sfx = np.zeros_like(result)
    rng = np.random.default_rng(92)
    for at,kind in [(3.51,'tap'),(5.22,'paper'),(12.48,'tap'),(19.72,'water'),(21.43,'door'),(24.41,'beat'),(28.88,'door'),(37.60,'beat'),(38.03,'tap'),(44.02,'paper'),(58.50,'door'),(61.46,'tap'),(68.93,'water'),(70.86,'step'),(72.34,'step'),(74.03,'door'),(76.61,'paper'),(82.57,'step'),(84.9,'step'),(87.03,'beat'),(89.59,'tap'),(90.93,'beat'),(91.50,'step'),(93.00,'door'),(93.86,'step'),(94.71,'tap'),(97.26,'step'),(99.41,'step'),(106.22,'paper'),(114.31,'tap')]:
        effect(sfx,rng,at,kind)
    save_wave('effects.wav',sfx)
    result += sfx
    fade = int(.62*RATE)
    result[-fade:] *= np.linspace(1,0,fade)[:,None]
    limit = .88
    peak = float(np.max(np.abs(result)))
    if peak>limit:
        result *= limit/peak
    save_wave('mix.wav',result)
    print(f'{len(cues)} captions, music + effects, duration {len(result)/RATE:.3f}s, peak {np.max(np.abs(result)):.3f}',flush=True)


if __name__=='__main__':
    main()
