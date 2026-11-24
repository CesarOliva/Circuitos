"use client";

import { useEffect, useRef, useState } from "react";

// Cuenta de 0 a value cuando la cifra entra al viewport.
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let frame = 0;

    const run = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setShown(value);
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / 1200, 1);
        setShown(Math.round(value * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        run();
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{shown}</span>;
}
