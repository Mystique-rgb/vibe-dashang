
import re, json
src = open('mkprofile.py', encoding='utf-8').read()
m = re.search(r'P = \[(.*?)\n\]', src, re.S)
body = m.group(1)
pts = re.findall(r'\(([0-9.]+),([0-9.]+)\)', body)
pts = [(float(a), float(b)) for a,b in pts]
print('points', len(pts))

s = '// \u4EBA\u7269\u4FA7\u8138\u526A\u5F71\uFF0C\u5F52\u4E00\u5316\u5750\u6807\uFF08\u671D\u5DE6\uFF09\n'
s += '// \u624B\u8C03\u8DEF\u5F84\uFF1A\u989D -> \u53D1\u5C16\u7FA4 -> \u540E\u8111 -> \u9888\u540E -> \u80A9 -> \u80F8 -> \u9888\u524D -> \u4E0B\u5DF4 -> \u5507 -> \u9F3B -> \u9F3B\u6881 -> \u989D\n'
s += 'export const FIGURE = [\n'
line = '  '
for x,y in pts:
    t = '[%.4f,%.4f],' % (x,y)
    if len(line)+len(t) > 92:
        s += line + '\n'; line = '  '
    line += t
s += line + '\n];\n'
open('src/lib/figure-data.js','w',encoding='utf-8').write(s)
print('written')
print('bbox x %.3f-%.3f y %.3f-%.3f' % (min(p[0] for p in pts), max(p[0] for p in pts),
                                        min(p[1] for p in pts), max(p[1] for p in pts)))
