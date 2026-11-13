/**
 * One motion language for the whole admin.
 *
 * Micro interaction  100–180ms
 * Popover            150–220ms
 * Drawer             250–400ms
 * Major transition   300–450ms
 *
 * Every value here is reduced-motion aware through `useMotionPrefs()`.
 */
import { useEffect, useState } from "react";

export const DURATION = {
  micro: 0.14,
  popover: 0.18,
  drawer: 0.32,
  major: 0.4,
} as const;

export const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Controlled spring — physical, never floaty. */
export const springDrawer = { type: "spring" as const, stiffness: 380, damping: 34, mass: 0.8 };
export const springCard = { type: "spring" as const, stiffness: 420, damping: 32 };
export const easeMicro = { duration: DURATION.micro, ease: EASE };
export const easePopover = { duration: DURATION.popover, ease: EASE };

/** Standard press feedback for any interactive element. */
export const press = { scale: 0.97 };

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Motion props resolved against the user's reduced-motion preference. */
export function useMotionPrefs() {
  const reduced = usePrefersReducedMotion();
  return {
    reduced,
    press: reduced ? {} : press,
    spring: reduced ? { duration: 0.001 } : springDrawer,
    card: reduced ? { duration: 0.001 } : springCard,
    popover: reduced ? { duration: 0.001 } : easePopover,
    /** slide-in variants for a right-hand drawer / bottom sheet */
    sheet: (mobile: boolean) =>
      reduced
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.001 } }
        : mobile
          ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" }, transition: springDrawer }
          : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" }, transition: springDrawer },
  };
}

/** True below the `sm` breakpoint. Stable across SSR (defaults to desktop). */
export function useIsMobile(query = "(max-width: 639px)") {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    setIs(mq.matches);
    const on = (e: MediaQueryListEvent) => setIs(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return is;
}
