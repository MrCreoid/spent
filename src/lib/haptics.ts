/** Light haptic tick where the platform supports it. Silently no-ops elsewhere. */
export function haptic(pattern: number | number[] = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // unsupported — ignore
  }
}
