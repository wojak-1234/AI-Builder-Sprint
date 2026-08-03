import { useEffect, useRef } from "react";
import { animate, remove } from "animejs";

/**
 * A custom hook to safely apply anime.js animations to a DOM element on mount/update.
 * Handles server-side rendering safety and automatically cleans up animations on unmount.
 * 
 * @param config anime.js configuration object, or a function returning it.
 * @param triggerDeps array of dependencies to trigger the animation again.
 * @returns ref to bind to the target DOM element.
 */
export function useAnime<T extends HTMLElement = any>(
  config: any | ((target: T) => any),
  triggerDeps: any[] = []
) {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && elementRef.current) {
      // Determine configuration params
      let params = typeof config === "function" 
        ? config(elementRef.current) 
        : { ...config };
      
      // Extract target if specified in params, default to elementRef.current
      const targetElement = params.targets || elementRef.current;
      
      // Clean up targets from parameters since v4 takes it as the first argument
      if (params.targets) {
        delete params.targets;
      }

      // Initialize animation using two-argument signature: animate(targets, params)
      animate(targetElement, params);

      // Cleanup on unmount/re-trigger
      return () => {
        if (elementRef.current) {
          remove(elementRef.current);
        }
      };
    }
  }, triggerDeps);

  return elementRef;
}
