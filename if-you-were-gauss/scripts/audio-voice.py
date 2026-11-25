"""Synthesize the storyboard's Mandarin lines into locally cached clips."""
import asyncio
import re
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = ROOT / 'assets/audio/voice'
STARTS = {1: .06, 2: 2.68, 6: 14.60, 7: 17.33, 27: 84.69, 30: 91.73, 32: 98.60, 37: 113.86}
ENDS = {6: 16.91, 7: 20.85, 27: 86.28, 30: 93.85, 32: 99.99, 37: 118.04}
SPOKEN = {'1801年': '一八零一年', '1855年': '一八五五年'}


def cues():
    lines = (ROOT / '假如你是高斯-分镜脚本.md').read_text(encoding='utf-8')
    for row in lines.splitlines():
        match = re.match(r'^\|\s*(\d\d)\s+([\d.]+).*?([\d.]+)\s*\|', row)
        if not match:
            continue
        scene, start, stop = int(match[1]), float(match[2]), float(match[3])
        speech = re.search('「(.+?)」', row.split('|')[4])
        if not speech:
            continue
        start = STARTS.get(scene, start + .12)
        stop = ENDS.get(scene, stop - .09)
        text = speech[1]
        for value, spoken in SPOKEN.items():
            text = text.replace(value, spoken)
        yield scene, round(start, 3), round(stop, 3), text


async def main():
    VOICE.mkdir(parents=True, exist_ok=True)
    workers = asyncio.Semaphore(6)

    async def generate(scene, start, stop, text):
        path = VOICE / f'{scene:02}.mp3'
        if path.is_file() and path.stat().st_size > 512:
            return
        syllables = len(re.findall(r'[\u4e00-\u9fff]', text))
        rate = min(38, max(0, round(100 * (syllables / (5.0 * (stop - start)) - 1))))
        pending = path.with_suffix('.partial')
        async with workers:
            for attempt in range(4):
                try:
                    speaker = edge_tts.Communicate(text, 'zh-CN-YunxiNeural', rate=f'+{rate}%', pitch='-6Hz')
                    await speaker.save(str(pending))
                    pending.replace(path)
                    print(f'{scene:02} +{rate}% {text}', flush=True)
                    return
                except Exception:
                    pending.unlink(missing_ok=True)
                    if attempt == 3:
                        raise
                    await asyncio.sleep(1 + attempt)

    await asyncio.gather(*(generate(*cue) for cue in cues()))


if __name__ == '__main__':
    asyncio.run(main())
