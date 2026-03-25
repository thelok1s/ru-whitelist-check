export interface CidrRange {
  start: number;
  end: number;
  original: string;
}

/**
 * Converts an IPv4 string to a 32-bit unsigned integer.
 * Returns -1 if invalid format.
 */
export function ipToLong(ip: string): number {
  const parts = ip.split(".");
  if (parts.length !== 4) return -1;

  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return -1;
    const num = parseInt(part, 10);
    if (num < 0 || num > 255) return -1;
    result = result * 256 + num;
  }
  return result;
}

/**
 * Parses a CIDR string (e.g., "192.168.1.0/24") into a numeric range.
 */
export function parseCidr(cidr: string): CidrRange | null {
  const [ipPart, bitsStr] = cidr.split("/");
  const ip = ipToLong(ipPart);
  if (ip === -1) return null;

  const bits = bitsStr ? parseInt(bitsStr, 10) : 32;
  if (isNaN(bits) || bits < 0 || bits > 32) return null;

  if (bits === 0) {
    return { start: 0, end: 4294967295, original: cidr }; // 0.0.0.0/0
  }

  const hostBits = 32 - bits;
  const mask = (-1 << hostBits) >>> 0;

  const start = (ip & mask) >>> 0;
  const count = Math.pow(2, hostBits);
  const end = (start + count - 1) >>> 0;

  return { start, end, original: cidr };
}
