"""Mix Freesound-based effects over the existing automated background."""
from functools import lru_cache
import json
from pathlib import Path
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, resample, resample_poly

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
RATE = 48000
BGM_GAIN = 10 ** (-2.8 / 20)


def gain(db):
    return 10 ** (db / 20)


def load_cues():
    payload = subprocess.check_output(['node', '--input-type=module', '-e', '''
import {soundCues, titleCues} from './src/sound-cues.js';
console.log(JSON.stringify({soundCues, titleCues}));
'''], cwd=ROOT)
    return json.loads(payload)


@lru_cache(maxsize=None)
def sample(name, speed):
    rate, data = wavfile.read(ASSETS / 'sfx' / f'{name}.wav')
    if rate != RATE or data.ndim != 1:
        raise ValueError(f'Expected a mono {RATE} Hz recording for {name}')
    pcm = data.astype(np.float64) / 32768
    return resample(pcm, round(len(pcm) / speed)) if speed != 1 else pcm


# Layers are (sample, delay in seconds, relative level, speed).
def layers(cue, sweep):
    voice, mode = cue['voice'], cue.get('material')
    index = cue.get('variation', 0)
    speed = (1, 1.10, .92, 1.05, .96)[index % 5]
    if voice == 'seat':
        return [('deal-tap',0,.77,1.26),('crystal',.008,.57,1.71+index*.046)], 4.3, .53
    if voice == 'rule-tick':
        return [('deal-snap',0,.66,1.34),('crystal',.009,.49,1.82+index*.12)], 4.5, .52
    if voice == 'rule-failure':
        return [('scan-ping',0,.19,1.56),('signal-glitch',0,1,1.72)], 6.2, .62
    if voice == 'comparison-hit':
        return [('fracture',0,.86,1.38),('steel',.009,.49,1.38),('sub-hit',.015,.43,1.11)], 7.8, .69
    if voice == 'page-turn':
        return [('flip-light',0,.65,1.18),('flip-heavy',.079,1,.92)], 1.8, .58
    if voice == 'table-flight':
        return [('air-rush',0,.72,1.04),('air-glide',.017,.69,1.02)], 3.9, .55
    if voice == 'table-land':
        return [('wood-block',0,.82,.64),('sub-hit',.008,.65,.93)], 4.5, .53
    if voice == 'glitch':
        return [('signal-glitch',0,1,1.18)], 6.1, .48
    if voice == 'clock':
        name=('clock-tick','clock-tock')[index%2]
        return [(name,0,1,.99)], 4.5, .46
    if voice == 'card':
        if mode in {'paper','flip'}:
            name = ('flip-light','flip-heavy')[index % 2]
            return [(name,0,1,speed),('deal-tap',.09,.31,1.07)], 4.4, .55
        name = ('deal-snap','deal-slide','deal-tap')[index % 3]
        return [(name,0,1,speed),('wood-block',.041,.22,1.17)], 4.5, .55
    if voice == 'write':
        variant = ('pencil-close','pencil-rough')[index % 2]
        return [(variant,0,1,speed)], 2.9, .49
    if voice == 'click':
        if mode == 'count':
            return [('wood-block',0,1,speed),('crystal',.022,.49,.86+index*.11)], 4.1, .48
        return [('wood-block',0,1,speed)], .9, .33
    if voice == 'foil':
        if abs(cue['time']-sweep)<.01:
            return [('air-glide',0,.72,1.16),('crystal',.093,.55,1.14)], 2.5, .34
        if mode == 'reveal':
            return [('flip-heavy',0,1,1.06),('crystal',.073,.24,1.32)], 3.0, .34
        return [('crystal',0,.75,.90),('air-glide',.037,.68,1.32)], 2.2, .34
    if voice == 'seal':
        if cue['gain'] == 1:
            return [('steel',0,.63,.95),('sub-hit',.012,.68,.81),('crystal',.067,.40,.92)], 5.5, .53
        if cue['gain'] > .83:
            return [('sub-hit',0,.80,1.17),('flip-heavy',.018,.81,1.12)], 4.8, .46
        return [('wood-block',0,.65,.76),('sub-hit',.012,.61,1.06)], 4.1, .44
    if voice == 'release':
        return [('air-glide',0,.69,.79),('crystal',.07,.49,.76)], 1.5, .47
    raise ValueError(f'Unknown action sound {voice}')


def stack(parts):
    layers_at = [(round(delay * RATE),sample(name,speed)*level) for name,delay,level,speed in parts]
    output = np.zeros(max(start+len(clip) for start,clip in layers_at))
    for start, clip in layers_at:
        output[start:start+len(clip)] += clip
    return output


def failure_signal():
    t = np.arange(round(.30 * RATE)) / RATE
    result = np.zeros_like(t)
    for offset, high, low in [(0,1560,900),(.139,1250,605)]:
        age = t-offset
        on = (age>=0)&(age<.096)
        x=age[on]
        phase=high*x-(high-low)*x*x/(2*.096)
        envelope=np.minimum(x/.004,1)*np.minimum((.096-x)/.014,1)
        result[on]=envelope*(np.sin(2*np.pi*phase)*.77+np.sin(2*np.pi*phase*2.06)*.20)
    return result


def crop_tail(clip, seconds):
    cropped = clip[:round(RATE * seconds)].copy()
    fade = min(len(cropped),round(.024*RATE))
    if fade:
        ramp = np.linspace(1,0,fade).reshape((-1,) + (1,)*(cropped.ndim-1))
        cropped[-fade:] *= ramp
    return cropped


BAND = butter(2, [1100,7600], btype='bandpass', fs=RATE, output='sos')


def rms(samples):
    return float(np.sqrt(np.mean(samples**2)))


def background_for_marks():
    rate, source = wavfile.read(ASSETS / 'music-ducked.wav')
    if rate != RATE:
        raise ValueError('Unexpected background sample rate')
    # Undo only the old scanner duck. The requested quiet passage keeps music alone.
    cmd = ['ffmpeg','-v','error','-i',str(ASSETS/'nov24.mp3'),'-vn','-ac','2',
           '-ar',str(RATE),'-t',str(len(source)/RATE),'-f','f32le','-']
    music = np.frombuffer(subprocess.check_output(cmd),dtype=np.float32).reshape(-1,2)
    if music.shape != source.shape:
        raise ValueError('Background length differs from the original MP3')
    start,end=21.32,22.02
    first,last=round(start*RATE),round(end*RATE)
    time = np.arange(first,last)/RATE
    cover = np.minimum(np.clip((time-start)/.075,0,1),np.clip((end-time)/.18,0,1))
    cover = (cover**2*(3-2*cover))[:,None]
    dry = source.copy()
    dry[first:last]=source[first:last]*(1-cover)+music[first:last]*gain(-5.4)*cover
    # Remove the old title carry's duck, and make space for the comparison hit at its new frame.
    for at, pre, hold, release, amount in [(6.97,.08,.25,.23,0),
                                            (25.8766667,.08,.12,.24,0),
                                            (26.7,.052,.14,.23,4.0)]:
        first,last=round((at-pre)*RATE),round((at+hold+release)*RATE)
        t=np.arange(first,last)/RATE-at
        fade=np.minimum(np.clip((t+pre)/pre,0,1),np.clip((hold+release-t)/release,0,1))
        fade=fade**2*(3-2*fade)
        if amount:
            dry[first:last]*=10**(-amount*fade[:,None]/20)
        else:
            dry[first:last]=dry[first:last]*(1-fade[:,None])+music[first:last]*gain(-5.4)*fade[:,None]
    return dry


def render_cue(cue, sweep, band):
    parts, target, peak = layers(cue,sweep)
    dry = stack(parts)
    voice = cue['voice']
    if voice == 'rule-failure':
        buzzer = failure_signal()
        buzzer[:min(len(dry),len(buzzer))] += .48*dry[:len(buzzer)]
        dry = buzzer
    if voice in {'seat','rule-tick'}:
        dry=sosfilt(butter(2,1000,btype='highpass',fs=RATE,output='sos'),crop_tail(dry,.13))
    knee = .40 if voice in {'glitch','seal','comparison-hit','table-land','rule-failure'} else .28
    dry = knee * np.tanh(dry / knee)
    at = round(cue['time']*RATE)
    size = min(len(dry),len(band)-at)
    window = min(size,round(.16*RATE))
    pan = cue['pan']
    if 'panEnd' in cue:
        pan = np.linspace(pan,cue['panEnd'],size)
    theta = (pan+1)*np.pi/4
    stereo = np.stack((np.cos(theta),np.sin(theta)),axis=-1)
    desired = max(.012,rms(band[at:at+window]))*gain(target)
    actual = rms(sosfilt(BAND,dry[:window])) / np.sqrt(2)
    ceiling = peak / max(.00001,np.max(np.abs(dry)))
    factor = min(ceiling,desired/max(.00001,actual))
    return at,dry[:size,None]*factor*stereo*cue.get('postGain',1)



def shape_peaks(samples, max_boost=1.8):
    # Keep the 3x RMS gain with enough true-peak margin for AAC encoding.
    original_rms=rms(samples)
    oversampled=resample_poly(samples,4,1,axis=0)
    low,high=1.0,max_boost
    for _ in range(22):
        boost=(low+high)/2
        shaped=oversampled*boost
        peak=np.abs(shaped)>.49
        shaped[peak]=np.sign(shaped[peak])*(.49+.20*np.tanh((np.abs(shaped[peak])-.49)/.20))
        reconstructed=resample_poly(shaped,1,4,axis=0)[:len(samples)]
        if rms(reconstructed)>original_rms:
            high=boost
        else:
            low=boost
    return reconstructed

def reserve_headroom(background, bus, cue, floor=.88):
    # Preserve the requested 3x gain. Reduce only the backing track under any near-full-scale peaks.
    at=round(cue['time']*RATE)
    lo=at-round(.035*RATE)
    hi=min(len(bus),at+round(.43*RATE))
    shadow=background[lo:hi].astype(float)*BGM_GAIN
    effects=bus[lo:hi]
    highest=np.abs(effects).max()
    ceiling=max(floor,min(.98,highest+.007))
    high=(np.sign(shadow)*effects+np.abs(shadow)>ceiling)
    if high.any():
        weight=np.ones_like(shadow)
        weight[high]=np.clip((ceiling-np.sign(shadow[high])*effects[high])/np.abs(shadow[high]),0,1)
        # Fade over the envelope of the brief hit, keeping the music continuous.
        from scipy.ndimage import maximum_filter1d, gaussian_filter1d
        dip=1-weight.min(axis=1)
        expanded=maximum_filter1d(dip,size=round(.022*RATE))
        enveloped=np.maximum(dip,gaussian_filter1d(expanded,round(.003*RATE)))
        background[lo:hi]*=(1-enveloped)[:,None]
    return lo,hi


def main():
    data = load_cues()
    background = background_for_marks()
    bed = background.astype(np.float64)*BGM_GAIN
    tail = round(.7*RATE)
    bed[-tail:] *= np.linspace(1,0,tail,endpoint=False)[:,None]
    band = sosfilt(BAND,bed,axis=0)
    bus = np.zeros_like(bed)
    sweep = data['titleCues']['sweep']
    count_sources = {cue.get('countSource', 0) for cue in data['soundCues']
                     if cue['voice'] == 'count-reuse'}
    reused = {cue['variation']: crop_tail(render_cue(cue,sweep,band)[1],.119)
              for cue in data['soundCues']
              if cue.get('material') == 'count' and cue['variation'] in count_sources}
    comparison = next(c for c in data['soundCues'] if c['voice']=='comparison-hit')
    clock_windows = []
    for cue in data['soundCues']:
        if cue['voice']=='count-reuse':
            at=round(cue['time']*RATE)
            samples=reused[cue.get('countSource', 0)]
        else:
            at,samples=render_cue(cue,sweep,band)
        if cue['voice'] in {'comparison-hit','clock'}:
            samples=shape_peaks(samples, max_boost=12 if cue['voice']=='clock' else 1.8)
        bus[at:at+len(samples)] += samples
        if cue['voice']=='clock':
            clock_windows.append(reserve_headroom(background,bus,cue,.73))
    protected=reserve_headroom(background,bus,comparison)
    wavfile.write(ASSETS/'music-precision.wav',RATE,background)
    windows = [protected, *clock_windows]
    for lo,hi in windows:
        bed[lo:hi]=background[lo:hi].astype(float)*BGM_GAIN
    # Preserve transients and cap only the small fraction of peaks near full scale.
    maximum = .98
    summed = bed+bus
    crest = np.abs(summed)
    over = crest>.70
    for lo,hi in windows:
        over[lo:hi]=False
    limited = .70+.15*np.tanh((crest[over]-.70)/.15)
    summed[over] = np.sign(summed[over])*limited
    correction = summed-bed
    # The dialogue before the first hit is bit-for-bit silence on the effects bus.
    start = round(data['titleCues']['stamp']*RATE)
    correction[:start] = 0
    if np.max(np.abs(correction)) >= 1 or np.max(np.abs(summed[start:])) > maximum:
        raise RuntimeError('Unexpected sound bus peak')
    wavfile.write(ASSETS/'foley-precision.wav',RATE,np.rint(correction*32767).astype(np.int16))
    print(f"{len(data['soundCues'])} sound cues, projected mix peak {20*np.log10(np.max(np.abs(summed))):.1f} dBFS")


if __name__ == '__main__':
    main()
