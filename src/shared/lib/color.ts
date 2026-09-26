// React Native styles can't parse oklch(), so category hues from the design
// (e.g. oklch(0.95 0.04 150)) are converted to hex at runtime.
function oklchToHex(lightness: number, chroma: number, hue: number) {
  const rad = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(rad);
  const b = chroma * Math.sin(rad);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return (
    '#' +
    rgb
      .map((channel) => {
        const gamma =
          channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
        return Math.round(Math.min(1, Math.max(0, gamma)) * 255)
          .toString(16)
          .padStart(2, '0');
      })
      .join('')
  );
}

export interface HuePalette {
  /** Soft circle / pill background */
  background: string;
  /** Icon colour on the soft background */
  foreground: string;
  /** Text colour inside pills */
  pillText: string;
  /** Segment colour in the spend bar */
  bar: string;
  /** Saturated swatch for colour pickers */
  swatch: string;
}

const cache = new Map<number, HuePalette>();

export function huePalette(hue: number): HuePalette {
  const cached = cache.get(hue);
  if (cached) return cached;

  const palette: HuePalette = {
    background: oklchToHex(0.95, 0.04, hue),
    foreground: oklchToHex(0.5, 0.13, hue),
    pillText: oklchToHex(0.47, 0.12, hue),
    bar: oklchToHex(0.8, 0.11, hue),
    swatch: oklchToHex(0.62, 0.15, hue),
  };
  cache.set(hue, palette);
  return palette;
}
