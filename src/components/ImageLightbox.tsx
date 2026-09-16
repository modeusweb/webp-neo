"use client";

import { useMemo } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Download from "yet-another-react-lightbox/plugins/download";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/captions.css";

export interface LightboxImage {
  /** Full-size image URL (blob or data URL). */
  src: string;
  /** File name without extension — used for captions and downloads. */
  stem: string;
}

interface ImageLightboxProps {
  open: boolean;
  index: number;
  images: LightboxImage[];
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-screen image viewer with zoom (wheel / pinch / double-click),
 * panning, keyboard & swipe navigation and a download button.
 * Rendered as a portal, so it can live anywhere in the tree.
 */
export function ImageLightbox({
  open,
  index,
  images,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const slides = useMemo(
    () =>
      images.map((image) => ({
        src: image.src,
        alt: image.stem,
        description: image.stem,
        download: { url: image.src, filename: `${image.stem}.webp` },
      })),
    [images],
  );

  // With a single image there is nothing to flip through — hide the
  // prev/next arrows and the "1 / 1" counter entirely.
  const multiple = images.length > 1;

  if (!open || slides.length === 0) return null;

  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      on={{ view: ({ index: next }) => onIndexChange(next) }}
      plugins={[Zoom, Download, ...(multiple ? [Counter] : []), Captions]}
      render={
        multiple ? {} : { buttonPrev: () => null, buttonNext: () => null }
      }
      carousel={{ finite: !multiple }}
      className="webp-lightbox"
      animation={{ swipe: 400, zoom: 350, fade: 250 }}
      zoom={{
        scrollToZoom: true,
        maxZoomPixelRatio: 5,
        zoomInMultiplier: 1.4,
        doubleClickMaxStops: 3,
        keyboardMoveDistance: 60,
        wheelZoomDistanceFactor: 120,
      }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      styles={{
        container: {
          backgroundColor: "rgba(2, 6, 23, 0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        },
      }}
    />
  );
}