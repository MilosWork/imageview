import React, { useEffect, useRef, useState } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholderColor = '#e0e0e0' }) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [visibleSrc, setVisibleSrc] = useState<string | undefined>(undefined); // Set initial value to undefined instead of null
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSrc(src);
            observer.disconnect(); // Stop observing after the image is loaded
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleImageLoad = () => {
    setLoaded(true); // Set the state to true when the image has loaded
  };

  const handleImageError = () => {
    setLoaded(true); // Set to true even if the image fails to load (you could customize this to handle errors differently)
  };

  return (
    <img
      ref={imgRef}
      src={visibleSrc ?? undefined}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      style={{
        backgroundColor: !loaded ? placeholderColor : 'transparent', // Keep placeholder color visible until the image is loaded
        transition: 'background-color 0.3s ease', // Smooth transition when loading the image
      }}
    />
  );
};

export default LazyImage;
