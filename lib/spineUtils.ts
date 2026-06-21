import { FALLBACK_SPINE_COLORS } from "@/lib/constants";

export type SpineWidthClass = "thin" | "medium" | "thick" | "extra-thick";

/**
 * Page-count breakpoints from the product spec:
 * 0-200 thin, 201-400 medium, 401-700 thick, 700+ extra thick.
 */
export function getSpineWidthClass(pageCount: number | null | undefined): SpineWidthClass {
  if (!pageCount || pageCount <= 200) return "thin";
  if (pageCount <= 400) return "medium";
  if (pageCount <= 700) return "thick";
  return "extra-thick";
}

export const SPINE_WIDTH_PX: Record<SpineWidthClass, number> = {
  thin: 28,
  medium: 36,
  thick: 46,
  "extra-thick": 58,
};

export function getSpineWidthPx(pageCount: number | null | undefined): number {
  return SPINE_WIDTH_PX[getSpineWidthClass(pageCount)];
}

/** Physical height of a spine button (matches the `h-56` Tailwind class on BookSpine). */
export const SPINE_HEIGHT_PX = 224;

/** Deterministic fallback color derived from a string (title+author), used when no cover image is available. */
export function fallbackSpineColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FALLBACK_SPINE_COLORS.length;
  return FALLBACK_SPINE_COLORS[index];
}

/**
 * Extracts a dominant color from a cover image by sampling pixels via canvas.
 * Client-side only (needs DOM Image + canvas). Falls back to a deterministic
 * color derived from `seed` if the image can't be loaded or read (e.g. CORS).
 */
export function getSpineColorFromCover(coverUrl: string | null | undefined, seed: string): Promise<string> {
  if (!coverUrl || typeof window === "undefined") {
    return Promise.resolve(fallbackSpineColor(seed));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 10;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(fallbackSpineColor(seed));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch {
        resolve(fallbackSpineColor(seed));
      }
    };
    img.onerror = () => resolve(fallbackSpineColor(seed));
    img.src = coverUrl;
  });
}
