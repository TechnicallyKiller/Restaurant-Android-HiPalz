/**
 * Split a string into segments of non-digits and digits for natural sort.
 * e.g. "B10" -> ["B", 10], "Table 2A" -> ["Table ", 2, "A"]
 */
function getSegments(s: string): (string | number)[] {
  const segments: (string | number)[] = [];
  let i = 0;
  while (i < s.length) {
    const start = i;
    if (/\d/.test(s[i])) {
      while (i < s.length && /\d/.test(s[i])) i++;
      segments.push(parseInt(s.slice(start, i), 10));
    } else {
      while (i < s.length && !/\d/.test(s[i])) i++;
      segments.push(s.slice(start, i));
    }
  }
  return segments;
}

/**
 * Compare two strings in natural (human) order.
 * e.g. "B2" < "B10" < "B11", "A1" < "B1"
 */
export function naturalCompare(a: string, b: string): number {
  const segA = getSegments(a);
  const segB = getSegments(b);
  const len = Math.min(segA.length, segB.length);
  for (let i = 0; i < len; i++) {
    const x = segA[i];
    const y = segB[i];
    if (typeof x === 'number' && typeof y === 'number') {
      if (x !== y) return x - y;
    } else {
      const strX = String(x);
      const strY = String(y);
      const cmp = strX.localeCompare(strY);
      if (cmp !== 0) return cmp;
    }
  }
  return segA.length - segB.length;
}
