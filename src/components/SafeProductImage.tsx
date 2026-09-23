import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeProductImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Image component that handles broken image URLs gracefully
 * showing "Image unavailable" instead of breaking UI or crashing.
 */
export const SafeProductImage: React.FC<SafeProductImageProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-3 select-none ${className}`}>
        <ImageOff className="w-6 h-6 mb-1 text-stone-400 stroke-1" />
        <span className="text-[11px] font-medium text-stone-500">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  );
};
