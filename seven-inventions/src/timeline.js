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
  {
    "name": "摄影术",
    "era": "1839",
    "kind": "银版摄影法",
    "roman": "DAGUERREOTYPE",
    "color": "#efb774",
    "badge": "达盖尔公布工艺",
    "lines": [
      "光在镀银铜板上",
      "留下可以保存的影像"
    ],
    "size": 740
  },
  {
    "name": "电话",
    "era": "1876",
    "kind": "贝尔获得专利",
    "roman": "TELEPHONE",
    "color": "#77dfc5",
    "badge": "人声与电信号来回转换",
    "lines": [
      "一端把声音变成电信号",
      "另一端再把声音还原"
    ],
    "size": 744
  },
  {
    "name": "白炽灯",
    "era": "1880",
    "kind": "碳丝电灯专利",
    "roman": "INCANDESCENT LAMP",
    "color": "#ffd365",
    "badge": "灯泡内抽真空",
    "lines": [
      "电流穿过细细的碳丝",
      "把它烧到发光"
    ],
    "size": 715
  },
  {
    "name": "动力飞机",
    "era": "1903",
    "kind": "莱特飞行者号",
    "roman": "WRIGHT FLYER",
    "color": "#86cdf7",
    "badge": "飞行约 36.6 米",
    "lines": [
      "莱特兄弟的双翼机",
      "离开地面十二秒"
    ],
    "size": 794
  },
  {
    "name": "集装箱",
    "era": "1956",
    "kind": "理想 X 号货轮",
    "roman": "SHIPPING CONTAINER",
    "color": "#f39668",
    "badge": "首航载有 58 个箱子",
    "lines": [
      "货物留在同一个箱里",
      "箱子从卡车吊到船上"
    ],
    "size": 754
  },
  {
    "name": "GPS",
    "era": "1978",
    "kind": "首颗试验卫星发射",
    "roman": "SATELLITE NAVIGATION",
    "color": "#a0a9ff",
    "badge": "接收机测算到多颗卫星的距离",
    "lines": [
      "卫星发出带时间的信号",
      "接收机靠它们算位置"
    ],
    "size": 795
  },
  {
    "name": "万维网",
    "era": "1990",
    "kind": "欧洲核子研究中心",
    "roman": "WORLD WIDE WEB",
    "color": "#69e9cc",
    "badge": "首台 Web 服务器 · NeXT 工作站",
    "lines": [
      "给文档地址",
      "用超链接把网页连起来"
    ],
    "size": 825
  }
];
export const starts = [163, 271, 379, 487, 595, 703, 1243].map(frame);
export const nameHits = [217, 325, 433, 541, 649, 757, 1243].map(frame);
export const detailDelay = frame(8);
export const title = frame(60);
export const titleHit = title;
export const titlePulses = [81, 109, 136].map(frame);
export const introHits = [0, 6, 13, 20, 27, 34].map(frame);
export const storyHits = starts.map(t => [t, t+.12, t+.35]);
export const beatMotion = starts.slice(0,6).map(t => Array.from({length:16},(_,j)=>Math.round((t+j*BEAT/2)*FPS)/FPS));
export const build = frame(811);
export const heroLeadHits = [811, 865, 919, 960, 1014, 1095].map(frame);
export const heroLeadLines = [
  [
    "研究人员需要互相查资料",
    "文档却散落在不同电脑里"
  ],
  [
    "换到另一台电脑",
    "刚才读到哪，得重新找"
  ],
  [
    "1989 年，伯纳斯-李提出",
    "用超文本把资料串起来"
  ],
  [
    "给每份文档一个地址",
    "再给读者一条跳转的路"
  ],
  [
    "这个入口有了名字",
    "叫超链接"
  ],
  [
    "点一下链接",
    "就能跳到另一份文档"
  ]
];
export const heroTease = [1135,1148,1162,1175,1189,1202].map(frame);
export const buildHits = [...heroLeadHits,...heroTease];
export const heroWords = [
  {time:frame(1288),label:'首站设在 CERN',x:1480,y:201,angle:.075,size:52,align:'center'},
  {time:frame(1315),label:'1991 年向公众开放',x:161,y:235,angle:-.085,size:56,align:'left'},
  {time:frame(1342),label:'URL 定位资源',x:1059,y:915,angle:-.11,size:54,align:'center'},
  {time:frame(1369),label:'首款浏览器也能编辑',x:648,y:313,angle:.055,size:44,align:'left'},
  {time:frame(1396),label:'HTTP 传输网页',x:157,y:918,angle:.065,size:49,align:'left'},
  {time:frame(1423),label:'HTML 组织内容',x:1625,y:928,angle:.095,size:47,align:'center'},
];
export const out = frame(1513);
export const outroHit = frame(1540);
export const cuts = [...new Set([title,...starts,...nameHits,...buildHits,...heroWords.map(x=>x.time),out,outroHit])].sort((a,b)=>a-b);
export const drawLengths = [1.3,1.3,1.35,1.4,1.35,1.30,1.48];
