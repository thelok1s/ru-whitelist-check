import { parseCidr, ipToLong, CidrRange } from "../utils/utils";

const IP_WHITELIST_URL =
  "https://raw.githubusercontent.com/hxehex/russia-mobile-internet-whitelist/main/ipwhitelist.txt";
const CIDR_WHITELIST_URL =
  "https://raw.githubusercontent.com/hxehex/russia-mobile-internet-whitelist/main/cidrwhitelist.txt";

interface WhitelistData {
  exactIps: Set<string>;
  cidrRanges: CidrRange[];
}

export type CheckResultReason = "invalid" | "ip" | "cidr" | "notfound";

export interface CheckResult {
  whitelisted: boolean;
  reason: CheckResultReason;
  context?: string;
}

let cachedData: WhitelistData | null = null;
let fetchPromise: Promise<WhitelistData> | null = null;

async function fetchList(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await response.text();
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
  } catch (e) {
    console.error(`Error fetching ${url}:`, e);
    return [];
  }
}

async function loadWhitelists(): Promise<WhitelistData> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      console.log("Fetching whitelists...");
      const [exactIpsList, cidrStrings] = await Promise.all([
        fetchList(IP_WHITELIST_URL),
        fetchList(CIDR_WHITELIST_URL),
      ]);

      const cidrRanges: CidrRange[] = [];
      for (const str of cidrStrings) {
        const range = parseCidr(str);
        if (range) {
          cidrRanges.push(range);
        }
      }

      cachedData = {
        exactIps: new Set(exactIpsList),
        cidrRanges,
      };
      return cachedData;
    } catch (e) {
      console.error("Error loading whitelists", e);
      return { exactIps: new Set(), cidrRanges: [] };
    }
  })();

  return fetchPromise;
}

export async function checkIpInWhitelist(ip: string): Promise<CheckResult> {
  const ipNum = ipToLong(ip);
  if (ipNum === -1) {
    return {
      whitelisted: false,
      reason: "invalid",
    };
  }

  const { exactIps, cidrRanges } = await loadWhitelists();

  // 1. Check Exact IP match
  if (exactIps.has(ip)) {
    return {
      whitelisted: true,
      reason: "ip",
      context: ip,
    };
  }

  // 2. Check CIDR ranges
  for (const range of cidrRanges) {
    if (ipNum >= range.start && ipNum <= range.end) {
      return {
        whitelisted: true,
        reason: "cidr",
        context: range.original,
      };
    }
  }

  return {
    whitelisted: false,
    reason: "notfound",
  };
}
