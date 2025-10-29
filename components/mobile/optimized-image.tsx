"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  imageOptimizationService,
  lazyLoadService,
  performanceUtils,
  type ImageOptimizationOptions,
} from "@/lib/mobile/performance";

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  lazy?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * OptimizedImage Component
 * Provides automatic image optimization, lazy loading, and performance monitoring
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  priority = false,
  lazy = true,
  placeholder = "empty",
  blurDataURL,
  onLoad,
  onError,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    if (!src) return;

    const optimizationOptions: ImageOptimizationOptions = {
      quality,
      width,
      height,
      priority,
      blur: placeholder === "blur",
    };

    const optimizedSrc = imageOptimizationService.getOptimizedImageUrl(
      src,
      optimizationOptions,
    );

    if (priority || !lazy) {
      // Load immediately for priority images
      setCurrentSrc(optimizedSrc);
    } else {
      // Set up lazy loading
      if (imgRef.current) {
        imgRef.current.dataset.src = optimizedSrc;
        lazyLoadService.observe(imgRef.current, {
          enableOnSlowConnection: priority,
        });
      }
    }
  }, [src, quality, width, height, priority, lazy, placeholder]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);

    // Track loading performance
    if (loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      console.debug(`Image loaded in ${loadTime.toFixed(2)}ms:`, src);
    }

    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
    onError?.();
  };

  const handleLoadStart = () => {
    loadStartTime.current = performance.now();
  };

  // Generate placeholder styles
  const getPlaceholderStyles = () => {
    if (placeholder === "blur" && blurDataURL) {
      return {
        backgroundImage: `url(${blurDataURL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
    return {};
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        !isLoaded && placeholder === "blur" && "animate-pulse",
        className,
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        aspectRatio: width && height ? `${width}/${height}` : undefined,
      }}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder !== "empty" && (
        <div
          className="absolute inset-0 bg-gray-200 dark:bg-gray-800"
          style={getPlaceholderStyles()}
        />
      )}

      {/* Main image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={handleLoadStart}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          isError && "hidden",
        )}
        {...props}
      />

      {/* Error fallback */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!isLoaded && !isError && placeholder === "empty" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
}

/**
 * Progressive Image Component
 * Loads low-quality placeholder first, then high-quality version
 */
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string;
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  quality = 80,
  ...props
}: ProgressiveImageProps) {
  const [phase, setPhase] = useState<"loading" | "low" | "high">("loading");
  const [highQualitySrc, setHighQualitySrc] = useState<string>("");

  useEffect(() => {
    if (!src) return;

    // Generate low and high quality versions
    const lowQuality =
      lowQualitySrc ||
      imageOptimizationService.getOptimizedImageUrl(src, {
        quality: 20,
        width: props.width,
        height: props.height,
        blur: true,
      });

    const highQuality = imageOptimizationService.getOptimizedImageUrl(src, {
      quality,
      width: props.width,
      height: props.height,
    });

    // Load low quality first
    const lowImg = new Image();
    lowImg.onload = () => {
      setPhase("low");

      // Then load high quality
      const highImg = new Image();
      highImg.onload = () => {
        setHighQualitySrc(highQuality);
        setPhase("high");
      };
      highImg.src = highQuality;
    };
    lowImg.src = lowQuality;
  }, [src, lowQualitySrc, quality, props.width, props.height]);

  return (
    <div className="relative">
      {/* Low quality placeholder */}
      {phase === "low" && (
        <OptimizedImage
          {...props}
          src={lowQualitySrc || src}
          quality={20}
          className={cn("filter blur-sm", props.className)}
          lazy={false}
        />
      )}

      {/* High quality image */}
      {phase === "high" && (
        <OptimizedImage
          {...props}
          src={highQualitySrc}
          lazy={false}
          className={cn("absolute inset-0", props.className)}
        />
      )}

      {/* Loading state */}
      {phase === "loading" && (
        <div
          className={cn(
            "bg-gray-200 dark:bg-gray-800 animate-pulse",
            props.className,
          )}
          style={{
            width: props.width ? `${props.width}px` : "100%",
            height: props.height ? `${props.height}px` : "200px",
          }}
        />
      )}
    </div>
  );
}

/**
 * Image Gallery Component with Lazy Loading
 */
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  columns?: number;
  gap?: number;
  className?: string;
}

export function ImageGallery({
  images,
  columns = 2,
  gap = 4,
  className,
}: ImageGalleryProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  const loadMore = performanceUtils.debounce(() => {
    setVisibleCount((prev) => Math.min(prev + 6, images.length));
  }, 300);

  useEffect(() => {
    const handleScroll = performanceUtils.throttle(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 1000
      ) {
        loadMore();
      }
    }, 100);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  return (
    <div
      className={cn("grid gap-4", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {images.slice(0, visibleCount).map((image, index) => (
        <OptimizedImage
          key={`${image.src}-${index}`}
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority={index < 4} // Prioritize first 4 images
          className="w-full h-auto rounded-lg"
        />
      ))}

      {visibleCount < images.length && (
        <div className="col-span-full flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More ({images.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
