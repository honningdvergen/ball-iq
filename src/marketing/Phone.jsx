import React from 'react';

// CSS iPhone device frame, recreated from the handoff's Phone.dc.html
// (titanium bezel gradient, Dynamic Island, side buttons). Renders at 100%
// of its container width; the caller sizes/rotates the wrapper. Pass floatDur
// to enable the ambient float (gated by prefers-reduced-motion via .mkt-float).
export function Phone({ src, alt, floatDur, floatDelay = '0s', style }) {
  const sideBtn = (css) => (
    <div style={{ position: 'absolute', background: 'linear-gradient(to right,#3b3f47,#171a1f)', ...css }} />
  );
  return (
    <div
      className={floatDur ? 'mkt-float' : undefined}
      style={{
        position: 'relative',
        width: '100%',
        filter: 'drop-shadow(0 34px 60px rgba(0,0,0,0.7))',
        ...(floatDur ? { animationDuration: floatDur, animationDelay: floatDelay } : {}),
        ...style,
      }}
    >
      {/* side buttons (silent switch + volume on the left, power on the right) */}
      {sideBtn({ left: '-2px', top: '15.5%', width: 3, height: '3.6%', borderRadius: '2px 0 0 2px' })}
      {sideBtn({ left: '-2.5px', top: '23.5%', width: 3, height: '7%', borderRadius: '2px 0 0 2px' })}
      {sideBtn({ left: '-2.5px', top: '32.2%', width: 3, height: '7%', borderRadius: '2px 0 0 2px' })}
      <div style={{ position: 'absolute', right: '-2.5px', top: '25%', width: 3, height: '10.5%', borderRadius: '0 2px 2px 0', background: 'linear-gradient(to left,#3b3f47,#171a1f)' }} />

      {/* titanium bezel */}
      <div style={{
        position: 'relative', width: '100%', padding: '3.2%', borderRadius: '15.5%/7.1%',
        background: 'linear-gradient(135deg,#52565f 0%,#262931 16%,#13151a 50%,#23262e 84%,#4a4e58 100%)',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.10), inset 0 0 0 3px #0a0b0e, 0 0 0 1px #050608',
      }}>
        {/* screen */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12.4%/5.7%', background: '#0F1117', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.55)' }}>
          <img src={src} alt={alt} loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
          {/* Dynamic Island */}
          <div style={{ position: 'absolute', top: '1.55%', left: '50%', transform: 'translateX(-50%)', width: '30%', height: '2.9%', background: '#000', borderRadius: 999, boxShadow: '0 0 0 0.5px rgba(255,255,255,0.06)' }}>
            <div style={{ position: 'absolute', right: '13%', top: '50%', transform: 'translateY(-50%)', width: '15%', height: '46%', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #14202f, #000 70%)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
