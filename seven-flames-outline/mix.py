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
EXPORT = "import {FPS,LENGTH,DROP,FRAME_COUNT,STARTS,NAMES,HERO_STORIES,ITEMS} from './src/timeline.js'; console.log(JSON.stringify({FPS,LENGTH,DROP,FRAME_COUNT,STARTS,NAMES,HERO_STORIES,ITEMS}));"
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
def bandpass(data,low,high):
    sos=signal.butter(3,[low,high],btype='bandpass',fs=SR,output='sos')
    return signal.sosfiltfilt(sos,data,axis=0)

low=bandpass(music,22,120)
mid=bandpass(music,270,1080)
music=(.60*music+1.03*low-.33*mid).astype(np.float32)
fx = np.zeros_like(music)
foley_power = []
cues = []
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

def reference_bell():
    path=ROOT/'assets'/'sfx'/'bell-tone.wav'
    command=['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(SR),'-af',
             'lowpass=f=2180:p=2,lowpass=f=2180:p=2','-f','f32le','-']
    pcm=np.frombuffer(subprocess.check_output(command),'<f4')[:round(.64*SR)].copy()
    u=np.arange(len(pcm))/SR
    pcm/=abs(pcm).max()
    pcm*=np.minimum(u/.004,1)
    pcm*=.5-.5*np.cos(np.pi*np.clip((.64-u)/.20,0,1))
    return pcm

bell=reference_bell()

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

def tap(at,gain,kind=0,pan=0):
    u=sound_time(.16)
    freq=(3700,5100,2200,2900)[kind%4]
    top=.48*noise(u,2600,10300)+.40*bend(u,freq*1.36,freq*.81,80)
    body=.24*bend(u,111,62,18)
    put(at,(top+body)*np.exp(-u*41)*np.minimum(1,u/.0018),gain,pan)
    cues.append(at)

def throb(at,gain,root=64,decay=11):
    u=sound_time(.35)
    v=(.86*bend(u,root*1.23,root,24)+.22*bend(u,root*1.5,root*1.12,19))*np.exp(-u*decay)
    put(at,v*np.minimum(1,u/.003),gain)

for i,at in enumerate((.11,.30,.54,.77,1.01,1.31,1.56,2.13,2.45,2.91,3.19,3.42,3.88,4.14,4.33,4.76,5.02,5.21)):
    tap(at,.36+.040*(i%4),i,(-1)**i*.23)
    if i%3==1:throb(at,.16,69+i%3*10,19)

for i,(entry,name) in enumerate(zip(TIMELINE['STARTS'],TIMELINE['NAMES'])):
    rank=TIMELINE['ITEMS'][i]['rank']
    throb(entry,.72,63+i*3,12)
    tap(entry,.52,i,.12)
    scoop(entry,.35,pre=.049,hold=.039,tail=.15)
    foley(entry+.15,rank)
    for j,d in enumerate((.24,.50,.78,1.07,1.36,1.63)):
        at=entry+d
        tap(at,[.46,.43,.51,.49,.56,.39][j],i+j,(-1)**j*.35)
        if j in (1,3,4):throb(at,[.25,.36,.31][(j-1)//2],72+i*3,18)
        if j in (2,4):scoop(at,.26,pre=.025,hold=.03,tail=.095)
    hit(name,1.10,0,heavy=True)
    put(name,bell,.91)
    scoop(name,.68,pre=.28,hold=.065,tail=.14)
    for j,d in enumerate((.31,.56,.81,1.12,1.47)):
        at=name+d
        tap(at,[.53,.39,.44,.57,.43][j],i+j+1,(-1)**j*.26)
        if j in (0,3):throb(at,.41,66+i*2,15)

# The running bass and faster details increase in density until the last short breath.
for i,b in enumerate((-32,-28,-24,-20,-16,-12,-8,-4)):
    at=sec(b)
    throb(at,.55+.056*i,58+2*i,8.7)
    tap(at,.32+.035*i,i,.22)
for j in range(66):
    at=27.13+j*.211
    if at>DROP-.23:break
    progress=(at-27.13)/(DROP-27.13)
    tap(at,.27+progress*.40,j,(-1)**j*.22)
    if j%2==0:throb(at,.21+progress*.72,51+int(progress*18),13-5*progress)
    elif at>=35.9:throb(at,.33+progress*.28,72+int(progress*10),10)
for k,b in enumerate(range(-7,-1)):
    at=sec(b); hit(at,.45+.062*k,k%3);tap(at+.11,.43+.052*k,k,.18)

u=sound_time(DROP-sec(-32)); envelope=np.sin(np.pi*np.minimum(1,u/(DROP-sec(-32))))**.55
put(sec(-32),(.75*bend(u,49,35,.22)+.25*np.sin(2*np.pi*61*u))*envelope,.22)
u=sound_time(.78)
put(DROP-.88,noise(u,820,9400)*(u/u[-1])**1.65,.42)
scoop(DROP-.035,.91,.11,.028,.064)
hit(DROP,1.93,0,heavy=True)
put(DROP,bell,1.32)
tap(DROP,.88,1)
u=sound_time(.58)
attack=np.minimum(1,u/.006)
body=(.81*bend(u,66,48,9)+.32*bend(u,103,68,13))*attack*np.exp(-u*1.22)
put(DROP,body,1.28)
foley(DROP+.41,2)
for j in range(28):
    at=DROP+.21+j*.226
    if at>sec(16)-.14:break
    tap(at,.33+.065*(j%4),j,(-1)**j*.25)
    if j%2:throb(at,.46,64+j%3*7,10)
for j in range(4):
    at=DROP+j*.45
    u=sound_time(.45)
    battery=(.78*bend(u,78,51,10)+.24*bend(u,108,76,13))*np.minimum(1,u/.008)*np.exp(-u*.72)
    put(at,battery,.83 if j==0 else 1.01)
for i,at in enumerate(TIMELINE['HERO_STORIES']):
    u=sound_time(.116)
    put(at,noise(u,1300,7400)*np.sin(np.pi*u/u[-1])**2,.32,(-1)**i*.32)
    land=at+.105
    hit(land,.93,2,heavy=True);tap(land,.68,i);throb(land,.44,70,10)
    scoop(land,.41,pre=.033,hold=.046,tail=.12)

hit(sec(16),.68,1);scoop(sec(16),.55)

intro=decode(ROOT/'assets'/'intro-original.wav',SR)
splice_start=round(5.32*SR)
splice_end=round(5.40*SR)
if len(intro)<splice_end:raise ValueError('Reference intro is shorter than 5.40 s')
blend=(.5-.5*np.cos(np.linspace(0,np.pi,splice_end-splice_start)))[:,None]
# Keep the two recognizable intro sounds in their existing layer, and add the new detail cues around them.
bed=music*level[:,None]
bed[:splice_start]=intro[:splice_start]
bed[splice_start:splice_end]=intro[splice_start:splice_end]*(1-blend)+bed[splice_start:splice_end]*blend
raw=bed+fx
mag=abs(raw)
# Compressor preserves the softer attacks; leave additional room for the last hit.
knee=.71; ceiling=.88
hot=mag>knee
mag[hot]=knee+(ceiling-knee)*np.tanh((mag[hot]-knee)/(ceiling-knee))
audio=np.copysign(mag,raw)*np.minimum(1,t/.008)[:,None]*np.minimum(1,(DURATION-t)/.42)[:,None]
# AAC can overshoot at those two hard composite attacks. Leave space only around the peaks.
trim=np.full(n,10**(-.24/20))
for at,width,decibels in ((DROP+.016,.044,1.42),(DROP+2.033,.047,1.56)):
    a=max(0,round((at-width)*SR));b=min(n,round((at+width)*SR))
    loss=(.5+.5*np.cos(np.pi*np.clip((t[a:b]-at)/width,-1,1)))*decibels
    trim[a:b]*=10**(-loss/20)
audio*=trim[:,None]
out=ROOT/'assets'/'mix.wav'
quantized=np.int16(np.rint(audio*32767))

with wave.open(str(out),'wb') as f:
    f.setparams((2,2,SR,0,'NONE','not compressed'))
    f.writeframes(quantized.tobytes())

hits=sorted(TIMELINE['STARTS']+TIMELINE['NAMES'])
metrics={'source_song':'霓虹兔 - Chaikovsky','source_drop_s':SOURCE_DROP,'source_pcm_offset_s':start_pcm/SR,'music_rate':MUSIC_RATE,'picture_drop_s':DROP,'picture_drop_frame':round(DROP*FPS),'frame_count':TIMELINE['FRAME_COUNT'],'rms_dbfs':round(db(rms(audio)),2),'peak_dbfs':round(db(abs(audio).max()),2),'chapter_impacts_db':[round(db(rms(audio[round(mark*SR):round((mark+.1)*SR)])/rms(audio[round((mark-1)*SR):round(mark*SR)])),1) for mark in hits],'designed_transient_cues':len(cues),'foley':foley_power,'original_intro_layer_until_s':5.32,'original_intro_crossfade_end_s':5.40}
(ROOT/'assets'/'sync.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+chr(10),encoding='utf-8')
print(json.dumps(metrics,ensure_ascii=False,indent=2))
