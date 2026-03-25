# Russia Mobile Internet Whitelist Checker

**[RU]**  
Простой Python-скрипт, который проверяет, находится ли заданный IP-адрес в белых списках (точное соответствие IP или попадание в CIDR-диапазоны), которые остаются доступными при ограничении мобильного интернета в РФ.

### Использование
Требуется Python. Установка дополнительных библиотек не требуется.

```bash
python check_russia_whitelist.py <IP_ADDRESS>
# Пример:
# python check_russia_whitelist.py 8.8.8.8
```

**Благодарности**  
Спасибо [hxehex/russia-mobile-internet-whitelist](https://github.com/hxehex/russia-mobile-internet-whitelist) за списки!
# Russia Mobile Internet Whitelist Checker

---

**[EN]**  
A simple Python script that checks if a given IP address is present in the whitelists (exact IPs or CIDR ranges) that remain accessible when mobile internet is restricted in Russia.

### Usage
Requires Python. No external libraries needed.

```bash
python check_russia_whitelist.py <IP_ADDRESS>
# Example:
# python check_russia_whitelist.py 8.8.8.8
```

**Credits**  
Thanks to [hxehex/russia-mobile-internet-whitelist](https://github.com/hxehex/russia-mobile-internet-whitelist) for the lists!
