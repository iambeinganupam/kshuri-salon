import * as React from "react";

import { cn } from "../../lib/utils";
import { resolveAdapter } from "./adapters";

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "loading" | "src" | "srcSet">;

const DEFAULT_SRCSET_WIDTHS = [320, 640, 960, 1280, 1920] as const;

export interface KshuriImageProps extends ImgProps {
  src: string;
  alt: string;
  /** Intrinsic width hint; used for srcset selection and CLS prevention. */
  width?: number;
  /** Intrinsic height hint; used for CLS prevention. */
  height?: number;
  /** Above-the-fold images skip lazy loading. Default: false. */
  priority?: boolean;
  /** Aspect ratio (W/H). When set, renders the image inside a ratio box. */
  aspectRatio?: number;
  /** Image to swap to when the primary src errors. */
  fallback?: string;
  /** Custom srcset widths. Adapters that cannot resize ignore this. */
  srcsetWidths?: readonly number[];
  /** Wrapper className (applied when aspectRatio is set). */
  wrapperClassName?: string;
}

/**
 * KshuriImage — drop-in `<img>` with provider-agnostic URL transformation,
 * srcset, lazy loading, async decoding, and graceful error fallback.
 *
 * URL handling is delegated to the matching adapter from the registry in
 * `./adapters`. Cloudinary URLs get auto-format / auto-quality / srcset;
 * S3 and unknown URLs pass through unchanged. Swapping or adding a CDN
 * provider does not require touching this component.
 */
export const KshuriImage = React.forwardRef<HTMLImageElement, KshuriImageProps>(
  function KshuriImage(
    {
      src,
      alt,
      width,
      height,
      priority = false,
      aspectRatio,
      fallback,
      srcsetWidths = DEFAULT_SRCSET_WIDTHS,
      wrapperClassName,
      className,
      onError,
      ...rest
    },
    ref,
  ) {
    const [currentSrc, setCurrentSrc] = React.useState(src);
    React.useEffect(() => {
      setCurrentSrc(src);
    }, [src]);

    const adapter = resolveAdapter(currentSrc);
    const resolvedSrc = adapter.transformUrl(currentSrc, width ? { width } : undefined);
    const resolvedSrcset = adapter.srcset(currentSrc, srcsetWidths);
    // Noop adapter always emits "<url> 1x"; that's harmless but adds bytes.
    // Skip srcset emission when the adapter can't actually resize.
    const srcsetAttr = adapter.name === "noop" || adapter.name === "s3" ? undefined : resolvedSrcset;

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (fallback && currentSrc !== fallback) {
        setCurrentSrc(fallback);
      }
      onError?.(e);
    };

    const img = (
      <img
        ref={ref}
        src={resolvedSrc}
        srcSet={srcsetAttr}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={handleError}
        className={cn(
          aspectRatio ? "h-full w-full object-cover" : undefined,
          className,
        )}
        {...rest}
      />
    );

    if (aspectRatio) {
      return (
        <div
          className={cn("relative overflow-hidden", wrapperClassName)}
          style={{ aspectRatio: String(aspectRatio) }}
        >
          {img}
        </div>
      );
    }

    return img;
  },
);
