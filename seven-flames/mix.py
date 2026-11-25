from pathlib import Path
import json
import math
import subprocess
import sys
import wave

import numpy as np
from scipy import signal

ROOT = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv)>1 else Path('D:/vibe小曲/霓虹兔 - Chaikovsky.mp3')
SR = 48000
EXPORT = "import {FPS,LENGTH,DROP,FRAME_COUNT,DETAIL_FRAMES,DETAIL_PITCHES,STARTS,NAMES,HERO_STORIES,ITEMS} from './src/timeline.js'; console.log(JSON.stringify({FPS,LENGTH,DROP,FRAME_COUNT,DETAIL_FRAMES,DETAIL_PITCHES,STARTS,NAMES,HERO_STORIES,ITEMS}));"
TIMELINE = json.loads(subprocess.check_output(['node','--input-type=module','-e',EXPORT],cwd=ROOT,encoding='utf-8'))
FPS = TIMELINE['FPS']
DURATION = TIMELINE['LENGTH']
DROP = TIMELINE['DROP']
SOURCE_DROP = 91.640
MUSIC_RATE = 100/99

def decode(path, rate):
    command = ['ffmpeg','-v','error','-i',str(path),'-vn','-f','f32le','-ac','2','-ar',str(rate),'-']
    return np.frombuffer(subprocess.check_output(command), dtype='<f4').reshape(-1,2)

def sec(beat):
    return math.floor((DROP+beat*.45)*FPS+.5)/FPS

def db(a):
    return 20*np.log10(max(float(a),1e-8))

def rms(a):
    return np.sqrt(np.mean(a**2))

source = decode(SRC, SR)
# A 100:99 tempo correction maps the 132 BPM track to the project's 450 ms grid.
offset = (SOURCE_DROP-DROP*MUSIC_RATE)
start_pcm = round(offset*SR)
n = round(DURATION*SR)
music = signal.resample_poly(source[start_pcm:start_pcm+math.ceil(n*MUSIC_RATE)+100],99,100,axis=0)[:n]
t = np.arange(n)/SR

# Mild bass tilt and tightly scoped sidechain around editorial hits.
low = signal.sosfiltfilt(signal.butter(2,115,fs=SR,output='sos'),music,axis=0)
mid = signal.sosfiltfilt(signal.butter(2,1200,fs=SR,output='sos'),music,axis=0)
music = (.87*music+.50*low+.11*mid).astype(np.float32)
fx = np.zeros_like(music)
foley_power = []
timer_marks = []
level = np.ones(n,dtype=np.float32)
rng=np.random.default_rng(58192)

def put(at, body, gain, pan=0):
    start = max(0,round(at*SR)); length = min(len(body),n-start)
    if length<=0:return
    fx[start:start+length,0] += body[:length]*gain*np.sqrt(1-pan)
    fx[start:start+length,1] += body[:length]*gain*np.sqrt(1+pan)

def scoop(at, power, pre=.065, hold=.046, tail=.18):
    a=np.searchsorted(t,max(0,at-pre));b=np.searchsorted(t,at+hold+tail)
    level[a:b] *= 1-power*np.interp(t[a:b], [at-pre,at,at+hold,at+hold+tail],[0,1,1,0])

def sound_time(duration):
    return np.arange(round(duration*SR))/SR

def noise(u, low, high):
    v=signal.sosfilt(signal.butter(2,[low,high],fs=SR,btype='bandpass',output='sos'),rng.normal(size=len(u)))
    return v/max(abs(v).max(),1e-8)

def bend(u, f0,f1,speed):
    return np.sin(2*np.pi*(f1*u+(f0-f1)*(-np.expm1(-speed*u))/speed))

def hit(at,gain,kind,heavy=False):
    u=sound_time(.83)
    body=(.76*bend(u,90+kind*4,47+kind*4,15)*np.exp(-u*(4.5 if heavy else 10))+.24*bend(u,138,71,18)*np.exp(-u*(6.5 if heavy else 15)))
    grit=noise(u,130,590)*np.exp(-u*27)*.22+noise(u,1900,6700)*np.exp(-u*74)*.20
    put(at,np.tanh(1.3*(body+grit))*np.minimum(1,u/.0025),gain)

def tone(at,freq,gain,pan=0):
    u=sound_time(.24)
    v=(.68*bend(u,freq*1.16,freq,25)+.22*np.sin(2*np.pi*freq*2.63*u)+.10*noise(u,2000,7000))
    put(at,v*np.exp(-u*23)*np.minimum(1,u/.004),gain,pan)

def timer(at, freq, gain):
    u=sound_time(.051)
    v=(np.sin(2*np.pi*freq*u)+.24*np.sin(2*np.pi*freq*1.53*u))*np.exp(-u*74)
    put(at,v*np.minimum(1,u/.002),gain,-.52)
    timer_marks.append({'frame':round(at*FPS),'hz':freq})

def chime(at,gain,root=389,hero=False):
    u=sound_time(.58 if hero else .44)
    # One dry struck bell with its own inharmonic modes.
    partials=((1,.50,17),(1.51,.22,23),(2.10,.16,33),(2.78,.12,47),(4.07,.09,64))
    bell=sum(m*np.sin(2*np.pi*root*f*u)*np.exp(-u*d) for f,m,d in partials)
    put(at,bell*np.minimum(1,u/.003),gain)

def foley(at,rank):
    # Each texture begins with the visible growth and resolves before the nameplate.
    u=sound_time(.91)
    attack=np.minimum(1,u/.045)
    bed=noise(u,370,2900)
    if rank==19:
        crackle=np.zeros_like(u)
        for time in (.022,.087,.125,.175,.283,.374,.532,.637,.731):
            pos=int(time*SR); d=u[pos:]-time
            crackle[pos:]+=noise(d,900,4200)*np.exp(-np.maximum(d,0)*118)
        shape=(.81*crackle+.19*bend(u,100,58,8))*np.exp(-u*1.36)
    elif rank==15:
        shape=(.64*bed+.40*bend(u,675,217,9))*(.45+.55*np.sin(28*u)**2)*np.sin(np.pi*u/u[-1])**1.25
    elif rank==14:
        beat=(np.exp(-((u-.096)/.044)**2)+.53*np.exp(-((u-.266)/.038)**2)+.68*np.exp(-((u-.577)/.044)**2))
        shape=beat*(.82*bend(u,108,48,5)+.18*bed)
    elif rank==11:
        clicks=sum(np.exp(-(u-when)*26)*np.sin(2*np.pi*f*(u-when))*(u>=when) for when,f in ((.035,1534),(.102,2173),(.201,2636),(.447,1776)))
        shape=.53*clicks+.32*noise(u,1770,5780)*np.exp(-u*4)
    elif rank==9:
        strikes=sum(np.exp(-np.maximum(u-when,0)*23)*(.55*bend(u-when,f*1.92,f,34)+.45*bed)*(u>=when) for when,f in ((.032,565),(.168,753),(.345,489),(.515,340)))
        shape=.60*strikes+.24*bend(u,93,62,3)*np.sin(np.pi*u/u[-1])
    elif rank==3:
        breath=noise(u,620,3900)*np.sin(np.pi*u/u[-1])**2
        shape=.54*breath+.38*(bend(u,830,410,5)+.45*bend(u,1007,625,5))*np.sin(np.pi*u/u[-1])*np.exp(-u*2)
    else:
        shape=(.57*noise(u,400,2600)+.52*bend(u,203,37,7))*np.sin(np.pi*u/u[-1])**1.45
    shaped=shape*attack*np.minimum(1,(u[-1]-u)/.072)
    shaped*=.36/max(abs(shaped).max(),.01)
    put(at,shaped,1,.24)
    foley_power.append({'rank':rank,'start_s':round(at,6),'rms_dbfs':round(db(rms(shaped)),2)})

def details(index):
    for i,(frame,freq) in enumerate(zip(TIMELINE['DETAIL_FRAMES'][index],TIMELINE['DETAIL_PITCHES'])):
        at=frame/FPS
        scoop(at,.33,pre=.012,hold=.023,tail=.032)
        timer(at,freq,.115 if i==0 else .106)

for i,b in enumerate((-92,-91,-90)):
    tone(sec(b),[510,672,898][i],.14,[-.35,0,.35][i]);scoop(sec(b),.28)
hit(sec(-88),1.07,1,heavy=True);chime(sec(-88),1.43);scoop(sec(-88),.74,pre=.43)
for i,(entry,name) in enumerate(zip(TIMELINE['STARTS'],TIMELINE['NAMES'])):
    tone(entry,[284,347,186,541,428,659][i],.055,.14)
    scoop(entry+.23,.42,pre=.042,hold=.32,tail=.44)
    foley(entry+.23,TIMELINE['ITEMS'][i]['rank'])
    hit(name,1.10,0,heavy=True)
    chime(name,1.44)
    scoop(name,.74,pre=.51,hold=.072,tail=.16)
    details(i)

for i,b in enumerate((-32,-28,-24,-20,-16,-12)):
    at=sec(b); hit(at,.45+i*.038,i%4);scoop(at,.45)
    tone(at+.52,210+i*43,.065,-.24);tone(at+1.05,260+i*54,.080,.25)
for k,b in enumerate(range(-7,-1)):
    at=sec(b); hit(at,.38+.048*k,k%3);tone(at,370+81*k,.093,(-1)**k*.26);scoop(at,.46)

# Pressure rising in the void, then a breath of space on the last beat.
u=sound_time(DROP-sec(-32)); envelope=np.sin(np.pi*np.minimum(1,u/(DROP-sec(-32))))**.55
v=(.68*bend(u,53,38,.22)+.32*np.sin(2*np.pi*74*u))*envelope
put(sec(-32),v,.072)
u=sound_time(.64); v=noise(u,290,5900)*(u/u[-1])**1.8
put(DROP-.73,v,.255)
scoop(DROP-.09,.86,.22,.068,.12)
hit(DROP,1.53,0,heavy=True)
chime(DROP,1.01,root=314,hero=True)
details(6)
foley(DROP+.47,2)
u=sound_time(1.12);put(DROP,bend(u,72,31,10)*np.exp(-u*5)*np.minimum(1,u/.006),.23)
for i,at in enumerate(TIMELINE['HERO_STORIES']):
    hit(at,.28,2);tone(at+.07,298+i*107,.09,.20);scoop(at,.25)
hit(sec(16),.68,1);scoop(sec(16),.55)

audio=(music*level[:,None]*.82+fx)*1.04
mag=abs(audio);knee=.61; ceiling=.78
mask=mag>knee
mag[mask]=knee+(ceiling-knee)*np.tanh((mag[mask]-knee)/(ceiling-knee))
audio=.89*np.copysign(mag,audio)*np.minimum(1,t/.044)[:,None]*np.minimum(1,(DURATION-t)/.47)[:,None]
out=ROOT/'assets'/'mix.wav'
with wave.open(str(out),'wb') as f:
    f.setparams((2,2,SR,0,'NONE','not compressed'))
    f.writeframes(np.int16(audio*32767).tobytes())

hits=sorted(TIMELINE['STARTS']+TIMELINE['NAMES'])
metrics={'source_song':'霓虹兔 - Chaikovsky','source_drop_s':SOURCE_DROP,'source_pcm_offset_s':start_pcm/SR,'music_rate':MUSIC_RATE,'picture_drop_s':DROP,'picture_drop_frame':round(DROP*FPS),'frame_count':TIMELINE['FRAME_COUNT'],'rms_dbfs':round(db(rms(audio)),2),'peak_dbfs':round(db(abs(audio).max()),2),'chapter_impacts_db':[round(db(rms(audio[round(mark*SR):round((mark+.1)*SR)])/rms(audio[round((mark-1)*SR):round(mark*SR)])),1) for mark in hits],'timers':timer_marks,'foley':foley_power}
(ROOT/'assets'/'sync.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False,indent=2))
