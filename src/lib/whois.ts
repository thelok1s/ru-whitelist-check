export interface WhoisData {
  ipAddress: string;
  cityName: string;
  regionName: string;
  asn: string;
  asnOrganization: string;
  latitude?: number;
  longitude?: number;
  capital: string;
  ipVersion: number;
  countryName: string;
  countryCode: string;
  phoneCodes: number[];
  timeZones: string[];
  zipCode: string;
  continent: string;
  continentCode: string;
  currencies: string[];
  languages: string[];
  isProxy: boolean;
}

export async function fetchWhois(ipAddress: string): Promise<WhoisData | null> {
  try {
    const response = await fetch(
      `https://free.freeipapi.com/api/json/${ipAddress}`,
    );
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as WhoisData;
  } catch (e) {
    console.error("Error fetching whois data:", e);
    return null;
  }
}
