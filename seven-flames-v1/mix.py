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
DURATION = 1505/30
DROP = 41.4

def decode(path, rate):
    command = ['ffmpeg','-v','error','-i',str(path),'-vn','-f','f32le','-ac','2','-ar',str(rate),'-']
    return np.frombuffer(subprocess.check_output(command), dtype='<f4').reshape(-1,2)

def sec(beat):
    return math.floor((DROP+beat*.45)*30+.5)/30

def db(a):
    return 20*np.log10(max(float(a),1e-8))

def rms(a):
    return np.sqrt(np.mean(a**2))

source = decode(SRC, SR)
search = np.arange(round(91.3*SR), round(91.9*SR), SR//200)
mono = source.mean(axis=1)
sub = signal.sosfilt(signal.butter(3,[28,125],fs=SR,btype='bandpass',output='sos'),mono)
# Compare an 85ms bass onset with its previous 500ms and retain the phase-stable peak.
ratios = [rms(sub[i:i+4080]) / max(.001,rms(sub[i-24000:i-520])) for i in search]
peak_time=search[int(np.argmax(ratios))]/SR
# A 5ms RMS onset in the verified 1:31 drop neighborhood is the edit point.
onset=[]
for i in range(round(91.5*SR),round(91.8*SR),SR//200):
    before=rms(sub[i-3840:i]); after=rms(sub[i:i+960]);
    if after>.055 and after>before*2.3:
        onset.append(i)
source_drop=(onset[0]/SR if onset else peak_time)
offset = int(round((source_drop-DROP)*SR))
n = round(DURATION*SR)
music = source[offset:offset+n].copy()
t = np.arange(n)/SR

# Mild bass tilt and tightly scoped sidechain around editorial hits.
low = signal.sosfiltfilt(signal.butter(2,115,fs=SR,output='sos'),music,axis=0)
mid = signal.sosfiltfilt(signal.butter(2,1200,fs=SR,output='sos'),music,axis=0)
music = (.87*music+.50*low+.11*mid).astype(np.float32)
fx = np.zeros_like(music)
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

for i,b in enumerate((-92,-91,-90)):
    tone(sec(b),[510,672,898][i],.14,[-.35,0,.35][i]);scoop(sec(b),.28)
hit(sec(-88),1.28,1,heavy=True);scoop(sec(-88),.78,pre=.75)
for i,b in enumerate((-80,-72,-64,-56,-48,-40)):
    at=sec(b); light=sec(b+4)
    hit(at,1.50+i*.024,i%3,heavy=True);scoop(at,.83,pre=.64,hold=.068,tail=.24)
    tone(at+.16,[197,321,110,560,287,382][i],.095,[-.4,.4,0,.42,-.38,.30][i])
    tone(at+.36,[314,278,82,802,392,579][i],.072,[.42,-.38,0,-.4,.36,-.30][i])
    hit(light,.53,i%3);tone(light+.01,[508,715,350,1180,629,901][i],.13,.13);scoop(light,.20)
    tone(light-.124,[306,434,194,723,397,603][i],.057,-.16)

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
hit(DROP,1.51,0,heavy=True)
u=sound_time(1.12);put(DROP,bend(u,72,31,10)*np.exp(-u*5)*np.minimum(1,u/.006),.23)
for b in (2,5,9,12):
    hit(sec(b),.28,2);tone(sec(b)+.07,298+b*23,.09,.20);scoop(sec(b),.25)
hit(sec(16),.68,1);scoop(sec(16),.55)

audio=(music*level[:,None]*.82+fx)*1.04
mag=abs(audio);knee=.65; ceiling=.90
mask=mag>knee
mag[mask]=knee+(ceiling-knee)*np.tanh((mag[mask]-knee)/(ceiling-knee))
audio=np.copysign(mag,audio)*np.minimum(1,t/.044)[:,None]*np.minimum(1,(DURATION-t)/.47)[:,None]
out=ROOT/'assets'/'mix.wav'
with wave.open(str(out),'wb') as f:
    f.setparams((2,2,SR,0,'NONE','not compressed'))
    f.writeframes(np.int16(audio*32767).tobytes())

metrics={'source_song':'霓虹兔 - Chaikovsky','source_drop_s':source_drop,'source_pcm_offset_s':offset/SR,'picture_drop_s':DROP,'picture_drop_frame':1242,'frame_count':1505,'rms_dbfs':round(db(rms(audio)),2),'peak_dbfs':round(db(abs(audio).max()),2),'chapter_impacts_db':[round(db(rms(audio[round(sec(b)*SR):round((sec(b)+.1)*SR)])/rms(audio[round((sec(b)-1)*SR):round(sec(b)*SR)])),1) for b in (-80,-76,-72,-68,-64,-60,-56,-52,-48,-44,-40,-36)]}
(ROOT/'assets'/'sync.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False,indent=2))
