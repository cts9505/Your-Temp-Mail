"use client";

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollStackProps {
  children: React.ReactNode;
  className?: string;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  scaleDuration?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
}

interface ScrollStackItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollStackItem({ children, className = "" }: ScrollStackItemProps) {
  return (
    <div className={`scroll-stack-item ${className}`}>
      {children}
    </div>
  );
}

export default function ScrollStack({
  children,
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  scaleDuration = 0.5,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}: ScrollStackProps) {
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stackRef.current) return;

    // Initialize Lenis for smooth scrolling
    let lenis: Lenis | null = null;
    if (!useWindowScroll) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    }

    const items = stackRef.current.querySelectorAll(".scroll-stack-item");

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;

      gsap.to(item, {
        scrollTrigger: {
          trigger: item,
          start: `top ${stackPosition}`,
          end: isLast ? `+=${itemDistance * 3}` : `+=${itemDistance}`,
          scrub: true,
          pin: true,
          pinSpacing: false,
        },
        y: -itemStackDistance * (items.length - index - 1),
        scale: baseScale + itemScale * (items.length - index - 1),
        rotateZ: rotationAmount * (items.length - index - 1),
        filter: `blur(${blurAmount * (items.length - index - 1)}px)`,
        ease: "none",
      });

      // Scale animation
      if (!isLast) {
        gsap.fromTo(
          item,
          { scale: 1 },
          {
            scale: baseScale,
            scrollTrigger: {
              trigger: item,
              start: `top ${scaleEndPosition}`,
              end: `+=${itemDistance * scaleDuration}`,
              scrub: true,
            },
          }
        );
      }
    });

    if (onStackComplete) {
      ScrollTrigger.create({
        trigger: items[items.length - 1],
        start: "bottom bottom",
        onEnter: onStackComplete,
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis?.destroy();
    };
  }, [
    itemDistance,
    itemScale,
    itemStackDistance,
    stackPosition,
    scaleEndPosition,
    baseScale,
    scaleDuration,
    rotationAmount,
    blurAmount,
    useWindowScroll,
    onStackComplete,
  ]);

  return (
    <div ref={stackRef} className={`scroll-stack ${className}`}>
      {children}
    </div>
  );
}
