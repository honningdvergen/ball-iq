import { useState, useRef, useEffect } from "react";
import { haptic } from "../App.jsx";

// Animated count-up for score numbers. Moved out of App.jsx on 2026-09-06
// (review E16). `haptic` comes from App along the seam the screens already use.
export function CountUp({ value, duration = 900, delay = 150, triggerHaptic = false, suffix = "", ...rest }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  useEffect(() => {
    const target = Number(value) || 0;
    if (target === 0) { setDisplay(0); return; }
    const timeoutId = setTimeout(() => {
      const step = (t) => {
        if (!startRef.current) startRef.current = t;
        const elapsed = t - startRef.current;
        const progress = Math.min(1, elapsed / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(target * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplay(target);
          if (triggerHaptic && typeof haptic === "function") haptic("correct");
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [value, duration, delay, triggerHaptic]);
  return <span {...rest}>{display}{suffix}</span>;
}


export default CountUp;
