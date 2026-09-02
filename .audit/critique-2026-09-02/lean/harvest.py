import json, sys, io, os
J = sys.argv[1]; OUT = sys.argv[2]
res = {}
for line in io.open(J, encoding='utf-8', errors='replace'):
    try: d = json.loads(line)
    except: continue
    if d.get('type') != 'result': continue
    label = d.get('label') or d.get('key') or ''
    res[label] = d.get('result', d.get('value'))
os.makedirs(OUT, exist_ok=True)
io.open(os.path.join(OUT,'raw.json'),'w',encoding='utf-8').write(json.dumps(res, indent=2, ensure_ascii=False))
for k, fn in (('report:design','design.md'), ('report:strategy','strategy.md')):
    v = res.get(k)
    if isinstance(v, str) and v.strip():
        io.open(os.path.join(OUT, fn), 'w', encoding='utf-8').write(v)
print('harvested', len(res), 'agent results ->', OUT, '| reports:', [k for k in ('report:design','report:strategy') if isinstance(res.get(k), str)])
