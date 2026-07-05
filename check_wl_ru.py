import urllib.request
import ipaddress
import sys
import ipwhois

IP_WHITELIST_URL = "https://raw.githubusercontent.com/hxehex/russia-mobile-internet-whitelist/main/ipwhitelist.txt"
CIDR_WHITELIST_URL = "https://raw.githubusercontent.com/hxehex/russia-mobile-internet-whitelist/main/cidrwhitelist.txt"

def fetch_list(url):
    try:
        response = urllib.request.urlopen(url)
        data = response.read().decode('utf-8')
        return [line.strip() for line in data.split('\n') if line.strip()]
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

def load_whitelists():
    print("Fetching IP whitelist...")
    exact_ips = set(fetch_list(IP_WHITELIST_URL))
    
    print("Fetching CIDR whitelist...")
    cidr_strings = fetch_list(CIDR_WHITELIST_URL)
    
    cidrs = []
    for cidr in cidr_strings:
        try:
            cidrs.append(ipaddress.ip_network(cidr, strict=False))
        except ValueError:
            pass 
            
    return exact_ips, cidrs

def is_ip_whitelisted(ip_str, exact_ips, cidrs):
    # 1. Check IP match
    if ip_str in exact_ips:
        return True, "Exact IP match in ipwhitelist – точное соответствие IP в ipwhitelist"
    
    # 2. Check CIDR ranges
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return False, "Invalid IP address format. Неверный формат IP"

    for network in cidrs:
        if ip_obj in network:
            return True, f"Matched CIDR range – входит в диапазон CIDR: {network}"
            
    return False, "IP is not in the whitelist. Не найден в белом списке."

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_wl_ru.py <IP_ADDRESS>")
        print("Example: python check_wl_ru.py 8.8.8.8")
        sys.exit(1)

    if len(sys.argv) > 2 and sys.argv[2] == "--whois":
        ip = sys.argv[1]
        obj = ipwhois.IPWhois(ip)
        results = obj.lookup_rdap()
        
        asn = results.get('asn')
        asn_country_code = results.get('asn_country_code')
        network_name = results.get('network', {}).get('name')
        country = results.get('network', {}).get('country')

        print(f"IP: {ip}")
        print(f"ASN: {asn}")
        print(f"ASN Country Code: {asn_country_code}")
        print(f"Owner: {network_name}")
        print(f"Country by WHOIS: {country}")

    target_ip = sys.argv[1]
    exact_ips, cidrs = load_whitelists()
    
    if not exact_ips and not cidrs:
        print("Failed to fetch whitelists. Ошибка загрузки. Exiting.")
        sys.exit(1)
        
    print(f"\nChecking IP. Проверка IP: {target_ip}...")
    is_whitelisted, reason = is_ip_whitelisted(target_ip, exact_ips, cidrs)
    
    if is_whitelisted:
        print(f"✅ Whitelisted! Вероятно, IP в белом списке! ({reason})")
    else:
        print(f"❌ Not whitelisted. IP не в белом списке. ({reason})")

if __name__ == "__main__":
    main()
