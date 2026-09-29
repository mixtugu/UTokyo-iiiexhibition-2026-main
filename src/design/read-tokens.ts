/** Read CSS-owned numeric tokens for Canvas layout. Cache outside draw loops. */
export function designNumber(
  styles: CSSStyleDeclaration,
  name: string,
): number {
  const value = Number.parseFloat(styles.getPropertyValue(name));
  if (!Number.isFinite(value))
    throw new Error(`Missing numeric design token: ${name}`);
  return value;
}
