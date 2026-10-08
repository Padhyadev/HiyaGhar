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
  threshold = 0.12,
  once = false,
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const preloaderActive = document.querySelector('.hiyaghar-preloader-overlay:not(.hiyaghar-preloader-exiting)');
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
      { threshold }
    );

    observer.observe(node);

    return () => {
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

