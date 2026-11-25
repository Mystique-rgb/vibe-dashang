export const FPS = 30;
export const FRAME_COUNT = 1505;
export const LENGTH = FRAME_COUNT / FPS;
export const DROP = 41.4;
export const BEAT = 0.45;
export const onBeat = count => Math.round((DROP + count * BEAT) * FPS) / FPS;

export const ITEMS = [
  {rank:19, name:'青莲地心火', color:'#36e1b4', light:'#d6ffec',
    key:'地底千年，火凝成莲', origin:'地心熔岩  /  暗青',
    stories:['萧炎炼化的第一簇异火', '美杜莎借它完成进化'], mark:'地心青莲'},
  {rank:15, name:'海心焰', color:'#438efc', light:'#d9edff',
    key:'深蓝火浪，形如水波', origin:'深蓝  /  如水流动',
    stories:['韩枫所得，后落入慕骨老人手中', '最终被萧炎炼化'], mark:'深海流火'},
  {rank:14, name:'陨落心炎', color:'#e3bd85', light:'#fcf2da',
    key:'无形心火，修炼作弊器', origin:'天焚炼气塔  /  能自体内焚烧',
    stories:['心火日夜淬炼斗气', '萧炎炼化成熟体，幼火留在内院'], mark:'塔底心火'},
  {rank:11, name:'骨灵冷火', color:'#a5d6ff', light:'#f2fbff',
    key:'极寒与极热，同生一焰', origin:'极寒极阴之地  /  森白',
    stories:['生于百年日月交替之际', '药老将它传给了萧炎'], mark:'极寒之火'},
  {rank:9, name:'三千焱炎火', color:'#b474ff', light:'#f0dcff',
    key:'以星辰之力修复伤势', origin:'星空  /  紫黑',
    stories:['炼化者可获「三千星辰体」', '丹塔曾长期封住它'], mark:'星空龙火'},
  {rank:3, name:'净莲妖火', color:'#ff91b7', light:'#fff0ed',
    key:'循情绪入体，焚灼灵魂', origin:'乳白  /  本源显粉红',
    stories:['造幻境、炼火奴，净化万物', '曾反噬净莲妖圣'], mark:'梦魇妖莲'},
  {rank:2, name:'虚无吞炎', color:'#955dff', light:'#efe0ff',
    key:'生于虚无，吞噬万物', origin:'虚无  /  黑焰',
    stories:['无形无相，却拥有极高灵智', '魂族的核心底牌', '双帝决战，响应萧炎号令'], mark:'吞噬万物'},
];

export const TITLE = onBeat(-88);
export const STARTS = [-80,-72,-64,-56,-48,-40].map(onBeat);
export const NAMES = [-76,-68,-60,-52,-44,-36].map(onBeat);
export const BUILD = [-32,-28,-24,-20,-16,-12].map(onBeat);
export const SPRINT = [-7,-6,-5,-4,-3,-2].map(onBeat);
export const HERO_STORIES = [4,7,11].map(onBeat);
export const HERO_WORD_FALL = 3/FPS;
export const HERO_WORDS = [
  {at:1272/FPS, text:'吞噬万物', x:154, y:868, angle:-.125, size:81, align:'left'},
  {at:1285/FPS, text:'魂族底牌', x:1585, y:222, angle:.125, size:67, align:'center'},
  {at:1336/FPS, text:'双帝决战', x:193, y:237, angle:.11, size:72, align:'left'},
  {at:1388/FPS, text:'万火归位', x:1643, y:935, angle:-.118, size:74, align:'center'},
];
export const LAST_DETAIL_DELAY = 13/FPS;
export const OUTRO = onBeat(16);
export const HOOK_BEATS = [0,6,13,20,27,34].map(frame => frame / FPS);
export const TITLE_PULSES = [81,109,136].map(frame => frame / FPS);
export const CUTS = [
  ...STARTS.map(at => ({at, strength:.37})),
  ...NAMES.map(at => ({at, strength:.89})),
  ...BUILD.map((at,i) => ({at, strength:i%2 ? .29 : .55})),
  ...SPRINT.map(at => ({at, strength:0})),
  ...HERO_STORIES.map(at => ({at, strength:.24})),
  {at:TITLE,strength:.92}, {at:DROP,strength:1}, {at:OUTRO,strength:.69}
].sort((a,b) => a.at-b.at);

export const DETAIL_OFFSETS = [8,10];
export const DETAIL_PITCHES = [1480,1960];
export const DETAIL_FRAMES = [...NAMES,DROP].map(at => {
  const hit = Math.round(at*FPS);
  return DETAIL_OFFSETS.map(offset => hit+offset);
});
