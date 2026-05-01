"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observes when the returned ref enters the viewport. Once visible, the hook
 * disconnects — this is "animate-in-once" behavior, which is almost always
 * what landing pages want (no re-triggering on every scroll).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect reduced motion — just mark in-view immediately.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px", ...options }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [options]);

  return { ref, inView };
}
