

import React, { useRef, useMemo, ReactNode, RefObject } from 'react';
import { useScroll, motion, useTransform, useMotionTemplate, MotionValue } from 'framer-motion';

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  staggerWindow?: number;
}

interface AnimatedWordProps {
  word: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  baseOpacity: number;
  enableBlur: boolean;
  blurStrength: number;
}

const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  progress,
  start,
  end,
  baseOpacity,
  enableBlur,
  blurStrength,
}) => {
  const opacity = useTransform(progress, [start, end], [baseOpacity, 1]);
  const blurPx = useTransform(progress, [start, end], [blurStrength, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.span
      className="inline-block"
      style={enableBlur ? { opacity, filter, willChange: 'opacity, filter' } : { opacity, willChange: 'opacity' }}
    >
      {word}
    </motion.span>
  );
};

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.05,
  baseRotation: _baseRotation = 3,
  blurStrength = 8,
  containerClassName = '',
  textClassName = '',
  staggerWindow = 0.35,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress: scrollA } = useScroll({
    target: containerRef,
    container: scrollContainerRef as RefObject<HTMLElement>,
    offset: ['start end', 'end center'],
  });

  const { scrollYProgress: scrollB } = useScroll({
    target: containerRef,
    offset: ['start end', 'end center'],
  });

  const scrollYProgress = scrollContainerRef ? scrollA : scrollB;

  const tokens = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    return text.split(/(\s+)/);
  }, [children]);

  const wordTokens = useMemo(
    () => tokens.filter((t) => !/^\s+$/.test(t)),
    [tokens]
  );

  const wordRanges = useMemo(() => {
    const count = wordTokens.length;
    if (count === 0) return [];
    return wordTokens.map((_, i) => {
      const wordStart = (i / count) * (1 - staggerWindow);
      const wordEnd = wordStart + staggerWindow;
      return { start: wordStart, end: wordEnd };
    });
  }, [wordTokens, staggerWindow]);

  const splitText = useMemo(() => {
    let wIdx = 0;
    return tokens.map((token, i) => {
      if (/^\s+$/.test(token)) {
        return <span key={i}>{token}</span>;
      }
      const range = wordRanges[wIdx] ?? { start: 0, end: 1 };
      wIdx++;
      return (
        <AnimatedWord
          key={i}
          word={token}
          progress={scrollYProgress}
          start={range.start}
          end={range.end}
          baseOpacity={baseOpacity}
          enableBlur={enableBlur}
          blurStrength={blurStrength}
        />
      );
    });
  }, [tokens, wordRanges, scrollYProgress, baseOpacity, enableBlur, blurStrength]);

  return (
    <h2 ref={containerRef} className={`my-5 ${containerClassName}`}>
      <p className={`text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] font-semibold ${textClassName}`}>
        {splitText}
      </p>
    </h2>
  );
};

export default ScrollReveal;