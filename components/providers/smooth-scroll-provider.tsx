"use client";

import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";

interface SmoothScrollProviderProps {
  children: ReactNode;
}

const DESKTOP_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const desktopPointerMedia = window.matchMedia(DESKTOP_POINTER_QUERY);
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY);

    let lenis: Lenis | null = null;
    let frameId = 0;

    const stopLenis = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      if (lenis) {
        lenis.destroy();
        lenis = null;
      }
    };

    const startLenis = () => {
      if (lenis) {
        return;
      }

      lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.92,
        anchors: true,
        prevent: (node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          return Boolean(
            node.closest(
              "[data-lenis-prevent], [data-radix-scroll-lock], [cmdk-list]",
            ),
          );
        },
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frameId = window.requestAnimationFrame(raf);
      };

      frameId = window.requestAnimationFrame(raf);
    };

    const syncState = () => {
      if (
        shouldReduceMotion ||
        reducedMotionMedia.matches ||
        !desktopPointerMedia.matches
      ) {
        stopLenis();
        return;
      }

      startLenis();
    };

    syncState();

    const handleDesktopPointerChange = () => {
      syncState();
    };
    const handleReducedMotionChange = () => {
      syncState();
    };

    desktopPointerMedia.addEventListener("change", handleDesktopPointerChange);
    reducedMotionMedia.addEventListener("change", handleReducedMotionChange);

    return () => {
      desktopPointerMedia.removeEventListener(
        "change",
        handleDesktopPointerChange,
      );
      reducedMotionMedia.removeEventListener(
        "change",
        handleReducedMotionChange,
      );
      stopLenis();
    };
  }, [shouldReduceMotion]);

  return children;
}
