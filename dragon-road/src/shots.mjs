import { actor, hands, prop } from './cast.mjs';
import { W, H, box, clamp, grad, glow, label, line, mix, oval, poly, random, smooth } from './palette.mjs';

const role=(name,x,y,size,pose='stand',view='side',facing=1,variant)=>({kind:'role',name,x,y,size,pose,view,facing,variant});
const item=(name,x,y,size,text='',angle=0)=>({kind:'item',name,x,y,size,text,angle});
const detail=(name,x,y,size,facing=1,variant)=>role(name,x,y,size,'stand','side',facing,variant);
const hand=(name,x=970,y=550,size=1320,light='red')=>({kind:'hand',name,x,y,size,light});
const special=(name,x=960,y=540,size=1)=>({kind:'special',name,x,y,size});
const shot=(world,camera,objects,title='',wipe='')=>({world,camera,objects,title,wipe});
const ming=(x,y,s,pose='stand',view='side',facing=1,variant)=>role('ming',x,y,s,pose,view,facing,variant);
const eri=(x,y,s,pose='stand',view='side',facing=1,variant)=>role('eri',x,y,s,pose,view,facing,variant);

export const shots=[
 // 01–07 | Prologue
 shot('corridor','push',[special('redSlit',1000,410),hand('open',975,592,1420)]),
 shot('redwell','slide',[eri(1210,620,850,'fallen'),special('redVeil',1320,220)]),
 shot('redwell','push',[item('notebook',908,573,680,'',-.16),special('dust',950,530)]),
 shot('corridor','rush',[special('redSlit',980,496),ming(775,800,410,'reach','back'),special('bars')]),
 shot('room','drift',[ming(1040,896,550,'sit','back'),special('screen',824,481,.92)],'', 'match'),
 shot('room','push',[item('keyboard',1030,660,950),hand('open',909,756,630,'cold'),special('screen',1060,245,.65)]),
 shot('room','slide',[item('letter',1035,530,760,'卡塞尔学院',-.17)],'','paper'),
 // 08–14 | Cassell
 shot('hall','rush',[special('gateway',960,472),item('letter',954,686,335,'面试通知',-.1)],'《龙族Ⅰ：火之晨曦》','paper'),
 shot('interview','slide',[role('guda',545,785,495,'sit'),ming(1270,859,434,'sit','side',-1),item('card',930,728,195,'S')]),
 shot('cinema','retreat',[ming(1410,902,410,'stand','back'),role('chen',827,723,240,'stand','front'),special('crowd',1090,870,1.1)]),
 shot('cinema','slide',[role('nono',945,887,630,'walk','side',-1),ming(653,929,396,'stand','back'),special('door',1436,482)],'','pillar'),
 shot('interview','push',[item('letter',900,568,715,'路明非',-.18),item('pen',1070,504,432,'',-.45),special('ink')]),
 shot('rail','rush',[special('railLight',955,539),ming(1010,824,265,'walk','back',1,'school')],'','match'),
 shot('school','retreat',[ming(598,842,410,'stand','back',1,'school'),special('dragon',1180,430,.62)]),
 // 15–21 | Bronze City
 shot('chamber','slide',[detail('oldtang',881,1828,1540),special('screen',1372,327,.41)]),
 shot('chamber','retreat',[special('dragon',1040,405,1.32),role('oldtang',953,921,360,'stand','front')]),
 shot('water','rush',[special('beam',658,386,.91),ming(850,830,390,'swim','side',1,'dive'),role('nono',1180,756,375,'swim','side',1,'dive'),item('lamp',1208,504,94)]),
 shot('water','slide',[special('bell',1020,581,1.16),ming(1080,878,514,'swim','side',-1,'dive'),role('nono',638,830,524,'reach','side',1,'dive')]),
 shot('water','roll',[special('stroke',1090,489,1.12),role('nono',1055,599,577,'fallen','side',-1,'dive'),item('lamp',1294,730,121)]),
 shot('water','push',[role('ze',1310,909,540,'walk','front'),ming(666,900,608,'kneel','side',1,'dive'),special('rings',965,475,.96)],'四分之一'),
 shot('water','retreat',[role('nono',1125,679,480,'swim','side',-1,'dive'),ming(690,855,453,'reach','side',1,'dive'),special('dust',980,469,1.03)]),
 // 22–28 | Nibelung
 shot('station','glide',[special('railLight',809,486,.65),special('stationName',936,380,.7)],'《龙族Ⅱ：悼亡者之瞳》','match'),
 shot('station','slide',[role('chu',1260,960,641,'stand','side',-1),role('xia',743,930,565,'walk','side',1),special('door',130,414)],'','pillar'),
 shot('station','push',[detail('xia',1070,1760,1470,-1),special('railLight',1532,625,.68)]),
 shot('tunnel','rush',[special('fenrir',0,0)],'芬里厄'),
 shot('tunnel','slide',[role('chu',751,1105,873,'stand'),item('sword',1121,650,553,'',-.38),special('slash',1026,552,.66)]),
 shot('tunnel','shake',[special('fenrir',0,0)],'','match'),
 shot('tokyo','travel',[special('train',950,549)],'','train'),
 // 29–40 | Tokyo and Erii
 shot('tokyo','glide',[special('citySigns',1150,478,1.04)],'《龙族Ⅲ：黑月之潮》'),
 shot('tower','rush',[ming(630,1030,265,'walk','back'),role('chu',829,998,282,'walk','back'),role('caesar',1028,1000,286,'walk','back'),special('towerName',1040,462)]),
 shot('hall','push',[eri(1120,1050,780,'stand','side',-1),special('door',480,474)]),
 shot('hall','rush',[special('redSlit',981,515,.61),eri(1007,777,319,'walk','back')]),
 shot('hotel','slide',[item('notebook',1015,580,675,'Sakura',-.10),item('pen',1150,536,250,'',-.36)],'','paper'),
 shot('tokyo','retreat',[ming(817,928,466,'walk','side'),eri(1124,928,423,'walk','side',1,'casual'),special('citySigns',1450,396,.64)]),
 shot('hotel','push',[item('handheld',801,600,422,'',-.14),item('handheld',1231,580,389,'',.12),special('dust',980,510,.69)]),
 shot('hotel','slide',[eri(1035,1069,792,'reach','side',1,'casual'),special('rainGlass',1450,423)]),
 shot('station','glide',[eri(1019,913,507,'walk','back',1,'casual'),ming(751,964,535,'walk','back'),special('train',950,549)],'','train'),
 shot('river','slide',[eri(1070,945,535,'walk','side',1,'casual'),ming(746,958,567,'walk','side')]),
 shot('shop','push',[item('cup',730,731,405),item('cup',1154,724,404),detail('eri',1100,1302,1013,-1,'casual'),special('window',1010,569)]),
 shot('hotel','drift',[item('notebook',930,610,663,'',.15),special('paperTurn',1020,533,1.06)],'','paper'),
 // 41–50 | Separation
 shot('car','retreat',[special('car',1120,717,1.02),ming(680,951,507,'stand'),eri(987,921,460,'stand','side',-1,'casual')]),
 shot('car','slide',[eri(1158,1100,778,'stand','side',-1,'casual'),ming(728,1144,797,'stand'),special('door',969,512,.45)]),
 shot('car','push',[hand('release',952,588,1480),special('door',1490,528,.64)],'','pillar'),
 shot('car','glide',[eri(1107,1280,932,'sit','side',-1,'casual'),item('notebook',867,746,191,'',.23),special('rainGlass',1490,449)]),
 shot('redwell','rush',[special('rings',1120,528,.98),special('redVeil',1210,326)],'','match'),
 shot('redwell','push',[detail('herb',1263,1510,1215,-1),special('redVeil',1449,450)]),
 shot('redwell','slide',[eri(1074,630,815,'fallen'),item('ring',836,744,212,'',.18),special('redVeil',1190,380)]),
 shot('tokyo','retreat',[special('citySigns',1137,463,.88),special('redVeil',1120,342)]),
 shot('hotel','retreat',[special('emptyChair',979,828,.83),item('cup',1302,750,129)],'','pillar'),
 shot('corridor','rush',[ming(921,1663,1630,'run','side'),special('dust',931,790,.79)]),
 // 51–62 | The red well
 shot('corridor','rush',[ming(968,1162,1114,'run','back'),special('dust',892,798,.77)]),
 shot('corridor','glide',[ming(841,925,566,'run','side'),special('door',1300,496,.42)],'','pillar'),
 shot('corridor','shake',[special('redSlit',1000,604,.83),ming(922,958,466,'run','back')]),
 shot('corridor','slide',[role('gen',1200,969,718,'reach','side',-1),item('lock',1050,525,195,'',-.23),special('redVeil',1437,292)]),
 shot('redwell','roll',[eri(1191,625,657,'fallen'),item('notebook',815,758,414,'',-.34),special('dust',909,620,.55)]),
 shot('redwell','push',[role('herb',1390,894,567,'stand','side',-1),eri(1166,657,552,'fallen'),special('redVeil',1109,371)]),
 shot('redwell','push',[item('lock',947,595,494,'',-.26),special('redVeil',1066,375)]),
 shot('corridor','rush',[ming(984,1050,815,'run','back'),special('door',1327,557,.4)]),
 shot('corridor','push',[hand('open',956,621,1530),special('redSlit',1000,505,.72)]),
 shot('redwell','slide',[item('notebook',1008,535,723,'',.20),special('paperTurn',990,495,1.22)],'','paper'),
 shot('corridor','rush',[ming(960,836,599,'fallen','front'),special('redSlit',972,533)]),
 shot('redwell','push',[ming(1010,1064,870,'kneel','back'),special('redVeil',1450,444)]),
 // 63–73 | Arriving in time
 shot('redwell','shock',[special('whiteLight',995,378),ming(964,1433,1220,'stand','front')],'这一次，你赶到了。'),
 shot('redwell','slide',[eri(1185,658,512,'fallen'),special('redwellFight',0,0)]),
 shot('redwell','shake',[special('redwellFight',0,0)]),
 shot('redwell','roll',[special('redwellFight',0,0)]),
 shot('redwell','push',[special('redwellFight',0,0)]),
 shot('redwell','push',[hand('clasp',981,562,1501,'warm'),special('dust',1010,548,.68)]),
 shot('exit','retreat',[ming(741,945,540,'reach'),eri(1124,921,502,'reach','side',-1),item('notebook',1220,821,167,'',.14)]),
 shot('exit','rush',[role('gen',1280,952,599,'reach','side',-1),ming(861,936,459,'run','back'),eri(1044,929,425,'run','back')]),
 shot('exit','travel',[ming(769,1704,1700,'run','back'),eri(1130,1667,1610,'run','back'),special('dust',994,760,1.03)]),
 shot('exit','slide',[ming(955,916,527,'run'),eri(705,945,492,'run'),special('door',1137,519,.39)],'','pillar'),
 shot('exit','retreat',[ming(818,915,520,'reach'),eri(1105,892,485,'stand','side',-1),item('medkit',1420,766,249),special('whiteLight',1068,341,.8)]),
 // 74–79 | Together
 shot('dawn','glide',[ming(703,952,485,'stand','side'),eri(1114,931,455,'stand','side',-1,'casual'),special('days',264,263,.67)],'','match'),
 shot('dawn','drift',[item('notebook',968,601,669,'Sakura，今天去哪？',-.16),item('pen',1109,516,206,'',-.65)],'','paper'),
 shot('dawn','slide',[detail('ming',899,1623,1320,1),special('whiteLight',1493,468,.89)]),
 shot('dawn','push',[eri(1137,1024,770,'reach','side',-1,'casual'),ming(722,1200,845,'stand','back'),special('whiteLight',1399,407,.81)]),
 shot('dawn','push',[hand('clasp',975,579,1615,'warm'),special('dust',1015,558,.69)]),
 shot('dawn','retreat',[special('walkTogether',949,927,1.06)]),
];
