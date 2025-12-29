import { useState, useEffect, useRef, memo } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component that only loads images when they're in the viewport
 * Uses IntersectionObserver for efficient lazy loading
 */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23374151" width="40" height="40" rx="20"/%3E%3C/svg%3E',
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <img
      ref={imgRef}
      src={isInView && !error ? src : placeholder}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
      style={{
        opacity: isLoaded || !isInView ? 1 : 0.5,
        transition: 'opacity 0.2s ease-in-out',
      }}
    />
  );
});

export default LazyImage;
