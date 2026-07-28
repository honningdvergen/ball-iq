import { chromium } from 'playwright';
const br = await chromium.launch();
const ctx = await br.newContext({ viewport:{width:375,height:812}, isMobile:true, hasTouch:true });

for (const url of ['https://balliq.app/','https://balliq.app/quiz/']) {
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil:'networkidle' });
  const out = await p.evaluate(() => {
    const hits = [];
    document.querySelectorAll('*').forEach(el => {
      const t = (el.textContent||'').trim();
      if (!/^(Seven questions|Think you know football|Daily 7$)/.test(t)) return;
      if (el.children.length > 2) return;
      const chain = [];
      let n = el;
      for (let i=0;i<5 && n;i++,n=n.parentElement){
        const cs = getComputedStyle(n);
        chain.push(`${n.tagName}.${String(n.className||'').trim().split(/\s+/).join('.')} | color:${cs.color} | bgC:${cs.backgroundColor} | bgImg:${cs.backgroundImage.slice(0,70)}`);
      }
      hits.push({ text: t.slice(0,40), chain });
    });
    return hits;
  });
  console.log('\n===', url);
  out.forEach(h => { console.log(' TEXT:', h.text); h.chain.forEach((c,i)=>console.log('   '.repeat(1)+ (i? '  ↑ ':'  → ')+c)); });
  await p.close();
}
await br.close();
