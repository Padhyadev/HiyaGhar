import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

function AnimatedDigit({ digit, duration = 0.6 }: { digit: string; duration?: number }) {
  const prevDigitRef = useRef(digit);
  const isUp = parseInt(digit, 10) >= parseInt(prevDigitRef.current, 10);

  useEffect(() => {
    prevDigitRef.current = digit;
  }, [digit]);

  // Non-digit character (like comma, dot, minus)
  if (isNaN(parseInt(digit, 10))) {
    return <span>{digit}</span>;
  }

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        overflow: 'hidden',
        verticalAlign: 'baseline',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={digit}
          initial={{ y: isUp ? '80%' : '-80%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: isUp ? '-80%' : '80%', opacity: 0 }}
          transition={{ duration, ease: [0.25, 1, 0.5, 1] }}
          style={{ display: 'inline-block' }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function AnimatedNumber({ value, className, duration = 0.6 }: AnimatedNumberProps) {
  const safeVal = typeof value === 'number' && !isNaN(value) ? Math.round(value) : 0;
  const formattedStr = safeVal.toLocaleString('en-IN');
  const digits = formattedStr.split('');

  return (
    <span className={cn('inline-flex items-center', className)} style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      {digits.map((digit, idx) => (
        // Key by distance-from-the-right (place value: units, tens, hundreds, ...) instead of
        // idx+length. Keying on idx+length made EVERY digit remount whenever the digit count
        // changed (e.g. ₹60 -> ₹120), and since AnimatedDigit's AnimatePresence uses
        // initial={false}, a remounted digit shows no transition at all - the price would
        // silently "jump" instead of animating whenever it crossed a digit-count boundary.
        // Keying by place value keeps existing digit slots stable across a length change, so
        // only a genuinely new leading digit skips its animation (nothing to transition from).
        <AnimatedDigit key={digits.length - 1 - idx} digit={digit} duration={duration} />
      ))}
    </span>
  );
}

export function AnimatedScore({
  value,
  className,
  duration = 0.6,
}: AnimatedNumberProps) {
  const prevValueRef = useRef(value);
  const [direction, setDirection] = React.useState<'up' | 'down' | 'same'>('same');

  useEffect(() => {
    if (value > prevValueRef.current) {
      setDirection('up');
    } else if (value < prevValueRef.current) {
      setDirection('down');
    }
    prevValueRef.current = value;
    const timer = setTimeout(() => setDirection('same'), 700);
    return () => clearTimeout(timer);
  }, [value]);

  const colorClass =
    direction === 'up'
      ? 'text-emerald-500 scale-105'
      : direction === 'down'
      ? 'text-rose-500 scale-95'
      : '';

  return (
    <motion.span
      animate={{ scale: direction !== 'same' ? [1, 1.08, 1] : 1 }}
      transition={{ duration: 0.4 }}
      className={cn('transition-colors duration-300 inline-flex items-center', colorClass, className)}
    >
      <AnimatedNumber value={value} duration={duration} />
    </motion.span>
  );
}

export default AnimatedNumber;




