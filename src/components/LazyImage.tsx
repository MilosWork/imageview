import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholderColor = '#e0e0e0' }) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [visibleSrc, setVisibleSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && mounted) {
            setVisibleSrc(src);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={visibleSrc ?? undefined}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      style={{ backgroundColor: !loaded ? placeholderColor : 'transparent' }}
    />
  );
};

export default LazyImage;
