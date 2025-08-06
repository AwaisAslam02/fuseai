'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TextCyclerProps {
  texts: string[];
  interval?: number;
  duration?: number;
  letterDelay?: number;
  blurStrength?: number;
  autoplay?: boolean;
}

export default function TextCycler({
  texts,
  interval = 2000,
  duration = 400,
  letterDelay = 0.025,
  blurStrength = 5,
  autoplay = true
}: TextCyclerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!autoplay) return;

    const cycleText = () => {
      setIsTyping(true);
      setDisplayText('');
      
      const currentText = texts[currentIndex];
      let charIndex = 0;

      const typeInterval = setInterval(() => {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, letterDelay * 1000);

      return () => clearInterval(typeInterval);
    };

    const timeout = setTimeout(() => {
      cycleText();
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentIndex, texts, autoplay, letterDelay]);

  useEffect(() => {
    if (!autoplay) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, texts.length, autoplay]);

  return (
    <div className="relative h-16 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ 
            opacity: 0, 
            y: 20,
            filter: `blur(${blurStrength}px)`
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            filter: 'blur(0px)'
          }}
          exit={{ 
            opacity: 0, 
            y: -20,
            filter: `blur(${blurStrength}px)`
          }}
          transition={{ duration: duration / 800 }}
          className="absolute inset-0 flex items-center"
        >
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            {displayText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="ml-1"
              >
                |
              </motion.span>
            )}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 