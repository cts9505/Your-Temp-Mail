"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextProps {
  text: string;
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  onLetterAnimationComplete?: () => void;
}

export default function SplitText({
  text,
  tag = "p",
  className = "",
  delay = 50,
  duration = 1.25,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const words = text.split(" ");

    // Clear any existing content
    container.innerHTML = "";

    // Create word and char spans
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.style.display = "inline-block";
      wordSpan.style.whiteSpace = "nowrap";

      if (splitType.includes("chars")) {
        word.split("").forEach((char) => {
          const charSpan = document.createElement("span");
          charSpan.textContent = char;
          charSpan.style.display = "inline-block";
          wordSpan.appendChild(charSpan);
        });
      } else {
        wordSpan.textContent = word;
      }

      container.appendChild(wordSpan);

      // Add space between words
      if (wordIndex < words.length - 1) {
        const space = document.createElement("span");
        space.innerHTML = "&nbsp;";
        space.style.display = "inline-block";
        container.appendChild(space);
      }
    });

    // Get all chars/words to animate
    const elements =
      splitType.includes("chars")
        ? container.querySelectorAll("span span")
        : container.querySelectorAll("span");

    // Set initial state
    gsap.set(elements, from);

    // Create animation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: `top bottom${rootMargin}`,
        toggleActions: "play none none none",
      },
      onComplete: () => {
        if (onLetterAnimationComplete) {
          onLetterAnimationComplete();
        }
      },
    });

    tl.to(elements, {
      ...to,
      duration,
      ease,
      stagger: delay / 1000,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [text, delay, duration, ease, splitType, from, to, threshold, rootMargin, onLetterAnimationComplete]);

  const Tag = tag;

  return (
    <Tag
      ref={containerRef as any}
      className={className}
      style={{ textAlign: textAlign as any }}
    />
  );
}
