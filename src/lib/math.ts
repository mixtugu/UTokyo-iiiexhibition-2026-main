export const clamp = (value: number): number => Math.max(0, Math.min(1, value));
export const smoothstep = (value: number): number => {
  const bounded = clamp(value);
  return bounded * bounded * (3 - 2 * bounded);
};
