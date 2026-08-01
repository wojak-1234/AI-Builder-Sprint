import React from "react";
import { useAnime } from "@/hooks/useAnime";

type QuietFadeInProps = {
  children: React.ReactNode;
  delay?: number;     // Milliseconds to delay the start
  duration?: number;  // Animation duration (default: 700ms for slow, calm transition)
  yOffset?: number;   // Small vertical movement (default: 8px to prevent motion sickness)
  className?: string;
};

/**
 * QuietFadeIn wraps any child content with a senior-friendly micro-animation.
 * Instead of fast or sudden layout movements, it gently fades and drifts elements into view.
 */
export function QuietFadeIn({
  children,
  delay = 0,
  duration = 700,
  yOffset = 8,
  className = "",
}: QuietFadeInProps) {
  // Apply anime.js configurations matching senior accessibility standards
  const ref = useAnime({
    opacity: [0, 1],
    translateY: [yOffset, 0],
    duration: duration,
    delay: delay,
    easing: "easeOutCubic", // Decelerates softly towards the end
  });

  return (
    <div ref={ref} className={`opacity-0 ${className}`}>
      {children}
    </div>
  );
}
