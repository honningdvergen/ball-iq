import { useEffect, useRef } from 'react';

export function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    // Honor prefers-reduced-motion (vestibular disorders / migraine): skip the
    // full-viewport confetti animation entirely. (medical, accessibility.)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // visualViewport reflects the actual visible area (excludes a collapsed
    // mobile URL bar). innerWidth/Height fall back for older WebViews.
    canvas.width = window.visualViewport?.width ?? window.innerWidth;
    canvas.height = window.visualViewport?.height ?? window.innerHeight;
    const pieces = Array.from({length:80}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      r: Math.random() * Math.PI * 2,
      dr: (Math.random() - 0.5) * 0.2,
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
      color: ["#58CC02","#FFC800","#FF4B4B","#1CB0F6","#CE82FF","#FF9600"][Math.floor(Math.random()*6)],
    }));
    let alive = true;
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.r += p.dr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      if (pieces.some(p => p.y < canvas.height)) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
    return () => { alive = false; };
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:500,width:"100%",height:"100%"}} />;
}
