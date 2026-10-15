import React, { useEffect, useRef, useState } from 'react';

export interface AppleRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  delay?: number;
  variant?: 'default' | 'subtle' | 'scale';
  as?: React.ElementType;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const AppleReveal: React.FC<AppleRevealProps> = ({
  children,
  delay = 0,
  variant = 'default',
  as: Component = 'div',
  className = '',
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  style,
  ...props
}) => {
  const elementRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Check if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    // Check if element is already inside the viewport upon initial load
    const rect = el.getBoundingClientRect();
    const isAboveOrInViewport = rect.top < (window.innerHeight || document.documentElement.clientHeight) - 30;

    if (isAboveOrInViewport && delay === 0) {
      // Trigger smoothly on initial frame
      const frame = requestAnimationFrame(() => {
        setIsRevealed(true);
      });
      return () => cancelAnimationFrame(frame);
    } else if (isAboveOrInViewport) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, delay);
      return () => clearTimeout(timer);
    }

    // Intersection Observer for scroll-driven reveals
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => {
                setIsRevealed(true);
              }, delay);
            } else {
              setIsRevealed(true);
            }
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [delay, threshold, rootMargin]);

  const variantClass = 
    variant === 'subtle'
      ? 'apple-reveal-subtle'
      : variant === 'scale'
      ? 'apple-reveal-scale'
      : 'apple-reveal';

  return (
    <Component
      ref={elementRef}
      className={`${variantClass} ${isRevealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={{
        ...style,
        ...(delay > 0 && !isRevealed ? { transitionDelay: `${delay}ms` } : {}),
      }}
      {...props}
    >
      {children}
    </Component>
  );
};
