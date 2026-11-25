export const FPS = 30;
export const BPM = 132;
export const BEAT = .45;
export const DROP = 1243 / FPS;
export const MUSIC_DROP = 91.640;
// The reference cuts every 1.800 s. Speed the source bed up 1.01% to align both grids.
export const MUSIC_RATE = 60 / BPM / BEAT;
export const MUSIC_OFFSET = MUSIC_DROP - DROP * MUSIC_RATE;
export const LENGTH = 1594 / FPS;
const frame = n => n / FPS;
export const items = [
  { name:'何尊', era:'西周早期', kind:'青铜礼器', roman:'HE ZUN', color:'#72edc1', badge:'宅兹中国', lines:['铭文里的“中国”二字','是目前已知最早的实物见证'], size:700 },
  { name:'越王勾践剑', era:'春秋晚期', kind:'青铜兵器', roman:'SWORD OF GOUJIAN', color:'#f5bf62', badge:'八字鸟篆', lines:['“越王鸠浅 自作用剑”','鸠浅，即越王勾践'], size:800 },
  { name:'鎏金舞马衔杯纹银壶', era:'唐', kind:'金银器', roman:'DANCING HORSE FLASK', color:'#f4b064', badge:'舞马衔杯', lines:['壶身仿皮囊的形状','两面各有一匹衔杯的舞马'], size:712 },
  { name:'清明上河图', era:'北宋', kind:'绢本设色', roman:'ALONG THE RIVER', color:'#e5b484', badge:'汴河虹桥', lines:['张择端画下汴京的市井生活','汴河上的木桥拱起如虹'], size:1000 },
  { name:'太阳神鸟金饰', era:'商周时期', kind:'镂空金饰', roman:'SUN AND IMMORTAL BIRDS', color:'#ffc45b', badge:'四鸟逐日', lines:['外圈四鸟逆时针飞翔','内圈十二道齿芒顺时针旋转'], size:712 },
  { name:'曾侯乙尊盘', era:'战国早期', kind:'青铜酒器', roman:'ZENG HOU YI VESSELS', color:'#88e3f4', badge:'尊与盘', lines:['上为尊，下为盘','尊口叠着多层镂空龙蛇纹'], size:866 },
  { name:'大盂鼎', era:'西周早期', kind:'青铜礼器', roman:'DA YU DING', color:'#ffb558', badge:'19 行 · 291 字', lines:['鼎内铭文记下周王的册命','受命的人，名叫盂'], size:835 },
];
export const starts = [163, 271, 379, 487, 595, 703, 1243].map(frame);
export const nameHits = [217, 325, 433, 541, 649, 757, 1243].map(frame);
export const title = frame(60);
export const titleHit = title;
export const titlePulses = [81, 109, 136].map(frame);
export const introHits = [0, 6, 13, 20, 27, 34].map(frame);
export const storyHits = starts.map(t => [t, t+.12, t+.35]);
export const beatMotion = starts.slice(0,6).map(t => Array.from({length:16},(_,j)=>Math.round((t+j*BEAT/2)*FPS)/FPS));
export const build = frame(811);
export const heroLeadHits = [811, 865, 919, 960, 1014, 1095].map(frame);
export const heroLeadLines = [
  ['鼎腹铸有十九行铭文', '共二百九十一字'],
  ['周康王二十三年', '周王下达册命'],
  ['受册命的贵族', '名叫盂'],
  ['铭文记下了王命', '也追述了周人立国的往事'],
  ['一篇青铜铭文', '留住了西周的声音'],
  ['双立耳，三柱足', '这尊鼎如今藏于中国国家博物馆'],
];
export const heroTease = [1135,1148,1162,1175,1189,1202].map(frame);
export const buildHits = [...heroLeadHits,...heroTease];
export const heroWords = [
  {time:frame(1288),label:'周王册命',x:603,y:866,angle:-.04,size:52},
  {time:frame(1315),label:'十九行铭文',x:1111,y:212,angle:.05,size:55},
  {time:frame(1342),label:'二百九十一字',x:1455,y:937,angle:-.04,size:53},
  {time:frame(1369),label:'铭刻西周',x:1552,y:158,angle:.035,size:56},
  {time:frame(1396),label:'康王二十三年',x:843,y:280,angle:-.05,size:46},
  {time:frame(1423),label:'一鼎记西周',x:548,y:943,angle:.04,size:56},
];
export const out = frame(1513);
export const outroHit = frame(1540);
export const cuts = [...new Set([title,...starts,...nameHits,...buildHits,...heroWords.map(x=>x.time),out,outroHit])].sort((a,b)=>a-b);
export const drawLengths = [1.3,1.3,1.35,1.4,1.35,1.30,1.48];
