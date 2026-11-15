// 导出时间表给音效脚本：node tools/dump_timing.mjs > .tmp/timing.json
// 单一真源：src/timing.js 改了以后重跑这个，再重跑 gen_sfx.py

import { EVENTS, SHOTS, SUBS, FLASHES } from '../src/timing.js';
import fs from 'node:fs';

const out = { duration: 66.05, events: EVENTS, shots: SHOTS, subs: SUBS, flashes: FLASHES };
process.stdout.write(JSON.stringify(out, null, 1));
