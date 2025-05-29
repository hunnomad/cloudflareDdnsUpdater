
# 🌐 Cloudflare DDNS Updater (Node.js Edition)

Egy teljesen automatizált, biztonságos, modern Cloudflare DDNS kliens, amely percenként ellenőrzi a publikus IP-címedet, és frissíti a megfelelő A rekordot Cloudflare-ben.

---

## 🔧 Fő jellemzők

- ✅ `.env` fájl támogatás
- ✅ Percenkénti ellenőrzés `node-cron` segítségével
- ✅ `winston` logolás: színes konzol + fájlba mentés (`./logs/ddns.log`)
- ✅ Értesítés: `ntfy`, `Telegram`, `Slack`, `Discord` (opcionálisan)
- ✅ Beépített `heartbeat` API: működés figyeléshez (GET `/heartbeat`)
- ✅ Nincsenek szükségtelen csomagok: biztonságos és tiszta

---

## 🚀 Telepítés

1. Klónozd vagy töltsd le a projektet:
   ```bash
   git clone https://github.com/youruser/cloudflareDdns.git
   cd cloudflareDdns
   ```

2. Telepítsd a függőségeket:
   ```bash
   npm install
   ```

3. Készítsd el a `.env` fájlt a következővel:

```env
AUTH_EMAIL=your@email.com
AUTH_METHOD=global
AUTH_KEY=your_cloudflare_api_key
ZONE_IDENTIFIER=zone_id_here
RECORD_NAME=example.com
TTL=3600
PROXY=true
SITENAME=example.com

NTFY_URI=https://ntfy.sh/your-topic
TELEGRAM_TOKEN=123456:ABCdef...
TELEGRAM_CHAT_ID=123456789
SLACK_URI=
SLACK_CHANNEL=
DISCORD_URI=

HEARTBEAT_PORT=8099
```

4. Indítsd el:

```bash
node cloudflare-ddns.js
```

---

## 📋 Heartbeat API

```http
GET /heartbeat
```

Válasz:

```json
{
  "status": "ok",
  "timestamp": "2025-05-29T07:55:34.156Z"
}
```

---

## 📂 Logok

A logfájl a `logs/ddns.log` fájlba kerül, például:

```
[2025-05-29T07:55:00.000Z] INFO - Running scheduled DDNS check...
[2025-05-29T07:55:01.432Z] INFO - foglaljon.online updated to IP 12.34.56.78
```

---

## ☕ Köszönet

Ez a projekt egy kávéval indult reggelen született.  
Tipp: ha te is beüzemelnéd → **ne felejts el kávézni közben!**

---

## 📄 Licenc

MIT © 2025 – [@hunnomad](https://github.com/hunnomad)
