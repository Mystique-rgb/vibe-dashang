from pathlib import Path
import json
import math
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = Path(__file__).resolve().parent
S = 48000
spec = json.loads((ROOT / 'assets/sync.json').read_text(encoding='utf8'))
source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('D:/vibe小曲/霓虹兔 - Chaikovsky.mp3')
raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-ac','2','-ar',str(S),'-f','f32le','-'])
source_pcm = np.frombuffer(raw,dtype='<f4').reshape(-1,2)
positions = spec['offset']*S + np.arange(round(spec['length']*S))*spec.get('rate',1.0)
lo = positions.astype(np.int64)
if lo[-1]+1 >= len(source_pcm):
    raise ValueError('Background track is shorter than the required excerpt')
ratio = (positions-lo).astype(np.float32)[:,None]
music = source_pcm[lo]*(1-ratio) + source_pcm[lo+1]*ratio
effects = np.zeros_like(music)
rng = np.random.default_rng(7612)

def samples(seconds):
    return np.arange(round(seconds*S))/S

def add(start, sound, amp, pan=0):
    index = round(start*S)
    end = min(len(effects), index+len(sound))
    if index < 0:
        sound, index = sound[-index:], 0
    if end > index:
        gains = np.sqrt([1-pan,1+pan])
        effects[index:end] += sound[:end-index,None] * (amp*gains)

def noise(t):
    raw = rng.normal(0,1,len(t))
    return (raw-np.roll(raw,2)) * 0.24

def strike(start, power, heavy=False):
    t = samples(0.68 if heavy else 0.35)
    phase = 2*np.pi*(46*t + 58*0.033*(1-np.exp(-t/.033)))
    weight = np.sin(phase)*np.exp(-t*(10 if heavy else 19))
    transient = noise(t)*np.exp(-t*205)
    metal = (np.sin(2*np.pi*1562*t)+0.65*np.sin(2*np.pi*2613*t))*np.exp(-t*50)
    add(start,(weight*.68+transient*.32+metal*.18)*np.minimum(t/.002,1), power)

def trace(start, seconds, index):
    t=samples(seconds)
    p=t/seconds
    wavelet=np.sin(2*np.pi*(280*t+(1900+index*106)*t**2/(2*seconds)))
    signal=noise(t)*(0.74+0.24*np.cos(2*np.pi*t*(23+index*2)))+0.12*wavelet
    add(start,signal*np.sin(np.pi*p)**1.8,.12,[.42,.25,.35,.45,.2,.35,.05][index])
    tick(start+seconds, 1260+index*134, .095, .25)

def tick(start, pitch, level, pan=0):
    t=samples(.18)
    bell=(np.sin(2*np.pi*pitch*t)+.35*np.sin(2*np.pi*pitch*1.71*t))*np.exp(-t*33)
    add(start,bell*np.minimum(t/.0015,1),level,pan)

def load_clip(name):
    with wave.open(str(ROOT / 'assets/sfx' / f'{name}.wav'), 'rb') as descriptor:
        if (descriptor.getframerate(), descriptor.getnchannels(), descriptor.getsampwidth()) != (S, 1, 2):
            raise ValueError(f'Unexpected sound effect format: {name}')
        data = np.frombuffer(descriptor.readframes(descriptor.getnframes()), dtype='<i2').astype(np.float32)
    peak = np.max(np.abs(data))
    if peak == 0:
        raise ValueError(f'Empty sound effect: {name}')
    return data / peak

beep, wind, metal, drum, trailer = map(load_clip, ('beep', 'whoosh', 'metal', 'drum', 'grain-impact'))
khufu = load_clip('khufu-impact')
khufu_anchor = round(.18*S)
IMPACT_GAIN = 2.2032
trailer_t = np.arange(len(trailer)) / S
# Keep the supplied texture and its tail, with a strong initial impact.
trailer *= np.where(trailer_t < .24, 1.0, .35+.65*np.exp(-(trailer_t-.24)/.25))

def heavy_hit(when, strength=1):
    add(when, metal, .48 * strength)
    add(when, drum, .72 * strength)
    add(when - .100, wind, .20 * strength, -.18)
    strike(when, .72 * strength, True)

def tech_entry(when, index):
    # Short band-limited electronic transient, distinct from the drum impact.
    t = samples(.105)
    chirp = np.cos(2*np.pi*(2450*t - 1080*t*t/.21)) * np.exp(-t*36)
    add(when, (.70*chirp + .3*noise(t))*np.minimum(t/.0008,1)*np.exp(-t*15), .87, .17)
    add(when, beep[:round(.079*S)], .42, -.18 + index*.035)
    add(when-.080, wind, .17, .26)

def trailer_hit(when, strength=1, hero=False):
    """Retain the supplied grain and add a short, pitched low-end decay."""
    add(when, trailer, strength * IMPACT_GAIN)
    t = samples(.54 if hero else .38)
    frequency_floor = 59 if hero else 69
    phase = 2*np.pi*(frequency_floor*t + 45*.031*(1-np.exp(-t/.031)))
    pitch = .76*np.sin(phase) + .24*np.sin(phase*1.45 + .19)
    onset = np.minimum(t/.005, 1)
    tail = np.clip((t[-1]-t)/.077, 0, 1)
    envelope = onset*np.exp(-t/(.204 if hero else .105))*tail
    add(when, pitch*envelope, (1.23 if hero else .49) * IMPACT_GAIN)
    if hero:
        add(when+.032,trailer[:round(.42*S)], .26 * IMPACT_GAIN)


def khufu_hit(when, hero=False, preroll=True):
    # The pure-effects clip preserves the original lead-in and layered impact.
    clip = khufu if preroll else khufu[khufu_anchor:]
    start = when - khufu_anchor/S if preroll else when
    add(start, clip, (1.48 if hero else 1.08) * IMPACT_GAIN)
    if hero:
        t = samples(.48)
        phase = 2*np.pi*(55*t + 37*.036*(1-np.exp(-t/.036)))
        envelope = np.minimum(t/.006,1)*np.exp(-t/.155)*np.clip((.48-t)/.085,0,1)
        add(when, np.sin(phase)*envelope, .54 * IMPACT_GAIN)


def cartoon_title_hit(when, index, pan):
    t = samples(.31)
    # Short pitched bounce over a dry impact. The low oscillator sweeps down
    # while the higher partials ring briefly, independently of the trailer cue.
    f = 232 + index*9
    chord = np.sin(2*np.pi*(f*.66*t + f*.039*(1-np.exp(-t/.068))))
    overtone = np.sin(2*np.pi*(2.81*f*t + 1.4*(1-np.exp(-t/.022))))
    snap = noise(t)*np.exp(-t*265)
    body = .69*chord*np.exp(-t*18) + .29*overtone*np.exp(-t*34) + .25*snap
    add(when, body*np.minimum(t/.0013,1), 1.04, pan)
    add(when, drum[:round(.17*S)], .32, pan*.45)

for i, when in enumerate(spec['intro']):
    rate = .95 + i*.035
    tuned = np.interp(np.arange(0, len(beep), rate), np.arange(len(beep)), beep)
    pan = (i - 2.5) * .14
    add(when, tuned, .55, pan)
    add(when, drum[:round(.165*S)], .50, pan*.55)
    add(when, metal[:round(.088*S)], .17, -pan)
    strike(when, .50)

trailer_hit(spec['titleHit'], 1.8109375)

for i, (when, name_hit) in enumerate(zip(spec['starts'], spec['nameHits'])):
    if i == 6:
        khufu_hit(when, hero=True)
        continue
    tech_entry(when, i)
    trace(when, spec['draw'][i], i)
    for j, at in enumerate(spec['storyHits'][i]):
        add(at, metal[:round(.13*S)], .08+j*.022, -.24)
        tick(at, 920+j*160, .095, -.25)
    khufu_hit(name_hit)
    for j, point in enumerate(spec['beatMotion'][i][1:],1):
        if min(abs(point-other) for other in [name_hit,*spec['storyHits'][i]])<.065:
            continue
        t = samples(.042)
        ping = np.sin(2*np.pi*(910+(j%5)*145)*t)*np.exp(-t*138)*np.minimum(t/.0025,1)
        add(point,ping,.065 if j%2 else .105, .22 if j%4<2 else -.22)
        if j%4==0:
            add(point-.08,wind,.12,-.2)

for i, when in enumerate(spec['build']):
    add(when, drum, .17+i*.05)
    add(when, metal, .12+i*.035)
    tick(when, 520+i*132, .08, .18)
for i, phrase in enumerate(spec['heroWords']):
    when = phrase['time']
    cartoon_title_hit(when, i, -.28 if i % 2 == 0 else .28)

trailer_hit(spec['out'], 1.12)
tick(spec['outroHit'], 660, .12)
tick(spec['outroHit']+.033, 990, .085)

music *= .60
intro_lift = round(1.8*S)
music[:intro_lift] *= np.linspace(.61,.83,intro_lift)[:,None]
music[intro_lift:intro_lift+round(.2*S)] *= np.linspace(.83,1,round(.2*S))[:,None]
major = [spec['titleHit'], *spec['nameHits'], spec['out']]
tech_starts = spec['starts'][:-1]
for when in [*tech_starts,*major,*[x['time'] for x in spec['heroWords']]]:
    index = round(when*S)
    lead, hold, tail = round(.033*S), round(.055*S), round(.148*S)
    if when == spec['drop']:
        floor = .48
    elif when in major:
        floor = .47
    elif when in tech_starts:
        floor = .49
    else:
        floor = .55
    duck = np.concatenate((np.linspace(1,floor,lead),np.full(hold,floor),np.linspace(floor,1,tail)))
    music[index-lead:index+hold+tail] *= duck[:,None]
music[:960] *= np.linspace(.14,1,960)[:,None]
fade = round(S*.72)
music[-fade:] *= np.linspace(1,0,fade)[:,None]
effects[-fade:] *= np.linspace(1,0,fade)[:,None]
mix = music + effects
magnitude = np.abs(mix)
saturating = magnitude > .77
mix[saturating] = np.sign(mix[saturating])*(.77+.105*np.tanh((magnitude[saturating]-.77)/.105))
# Oversampling catches intersample peaks from the layered impacts.
limiter = 'aresample=192000,alimiter=limit=0.90:attack=0.5:release=3:level=0:latency=1,aresample=48000'
limited_pcm = subprocess.check_output(
    ['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(S), '-ac', '2',
     '-i', 'pipe:0', '-af', limiter, '-f', 's16le', 'pipe:1'],
    input=np.asarray(mix, dtype='<f4').tobytes(),
)
if len(limited_pcm) != len(mix) * 4:
    raise ValueError('The limiter changed the mix duration')
mix = np.frombuffer(limited_pcm, dtype='<i2').reshape(-1, 2).astype(np.float32) / 32768

destination = Path(os.environ.get('GUOBAO_MIX_OUTPUT', ROOT/'assets/mix.wav'))
with wave.open(str(destination),'wb') as output:
    output.setparams((2, 2, S, 0, 'NONE', 'not compressed'))
    output.writeframes(limited_pcm)
if os.environ.get('GUOBAO_EFFECTS_DUMP'):
    np.asarray(effects, dtype='<f4').tofile(os.environ['GUOBAO_EFFECTS_DUMP'])
print(f'length={len(mix)/S:.3f}s peak={np.max(np.abs(mix)):.4f} effects RMS={math.sqrt(float(np.mean(effects*effects))):.4f}')

if os.environ.get('GUOBAO_METER'):
    def rms(t, seconds):
        portion = mix[round(t*S):round((t+seconds)*S)]
        return math.sqrt(float(np.mean(portion**2)))
    for kind, times in [('first',spec['starts']),('title/name/out',major),('intro',spec['intro'][1:]),('build',spec['build']),('phrase',[x['time'] for x in spec['heroWords']])]:
        print(kind, [(round(t,3),round(20*math.log10(rms(t,.1)/rms(max(0,t-.65),min(.55,t-.035))),1)) for t in times])
