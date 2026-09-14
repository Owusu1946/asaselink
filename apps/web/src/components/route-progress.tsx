"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const finish = () => {
      clearTimers();
      setProgress(100);
      timers.current.push(window.setTimeout(() => setVisible(false), 220));
      timers.current.push(window.setTimeout(() => setProgress(0), 420));
    };

    if (visible) finish();
    return clearTimers;
    // A changed pathname is the completion signal for a client navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const start = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;

      clearTimers();
      setVisible(true);
      setProgress(18);
      timers.current.push(window.setTimeout(() => setProgress(62), 140));
      timers.current.push(window.setTimeout(() => setProgress(82), 650));
      timers.current.push(window.setTimeout(() => {
        setProgress(100);
        timers.current.push(window.setTimeout(() => setVisible(false), 220));
      }, 6000));
    };

    document.addEventListener("click", start, true);
    return () => {
      document.removeEventListener("click", start, true);
      clearTimers();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[10000] h-0.5 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div
        className="h-full bg-brand-gold-500 shadow-[0_0_10px_rgba(212,166,35,0.65)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
