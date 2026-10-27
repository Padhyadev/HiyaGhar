import React, { useEffect, useRef } from 'react';
import './ScrollReveal.css';

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-up';
  delay?: number; // ms
  duration?: number; // ms, default 1100ms for smoother slow effect
  threshold?: number;
  once?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  variant = 'fade-up',
  delay = 0,
  duration,
  threshold = 0.02,
  once = true,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let rafId1: number;
    let rafId2: number;

    const reveal = () => {
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          if (node) {
            node.classList.add('is-revealed');
          }
        });
      });
    };

    // Safety fallback: Guarantee elements become visible even if preloader or observer stalls
    const safetyTimer = setTimeout(() => {
      reveal();
    }, 1800);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const preloaderActive = document.querySelector(
            '.hiyaghar-preloader-overlay:not(.hiyaghar-preloader-exiting)'
          );
          if (preloaderActive && !document.body.classList.contains('preloader-done')) {
            const handlePreloaderDone = () => {
              window.removeEventListener('preloaderComplete', handlePreloaderDone);
              reveal();
            };
            window.addEventListener('preloaderComplete', handlePreloaderDone, { once: true });
          } else {
            reveal();
          }

          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          node.classList.remove('is-revealed');
        }
      },
      { threshold, rootMargin: '60px 0px 60px 0px' }
    );

    observer.observe(node);

    return () => {
      clearTimeout(safetyTimer);
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [threshold, once]);

  return (
    <div
      ref={ref}
      className={`reveal-element reveal-${variant} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        ...(duration ? { transitionDuration: `${duration}ms` } : {}),
      }}
    >
      {children}
    </div>
  );
};

