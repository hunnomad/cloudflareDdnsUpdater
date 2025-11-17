# 🌐 Cloudflare DDNS Updater --- Multi‑Domain Edition (Node.js)

A modern, production‑ready Cloudflare DDNS updater with **multi‑domain
support**, allowing each domain to have its own authentication method,
API key, zone ID, record name, TTL, and proxy settings.

------------------------------------------------------------------------

## 🔧 Features

-   **Multi‑domain support** via `domains.json`
-   Each domain can define:
    -   `AUTH_EMAIL`
    -   `AUTH_METHOD` (`global` or `token`)
    -   `AUTH_KEY`
    -   `ZONE_IDENTIFIER`
    -   `RECORD_NAME`
    -   `TTL`
    -   `PROXY`
    -   `SITENAME`
-   Shared global configuration using `.env`
-   Minute‑based scheduled updates using `node-cron`
-   Winston logging: colored console + `./logs/ddns.log`
-   Optional notifications:
    -   ntfy
    -   Telegram
    -   Slack
    -   Discord
-   Built‑in `GET /heartbeat` endpoint
-   Lightweight, minimal dependencies

------------------------------------------------------------------------

## 📦 Installation

### 1. Clone the repository

``` bash
git clone https://github.com/youruser/cloudflare-ddns-multi.git
cd cloudflare-ddns-multi
```

### 2. Install dependencies

``` bash
npm install
```

------------------------------------------------------------------------

## ⚙️ Configuration

### `.env` -- Global service-level settings

``` env
SITENAME=CloudflareDDNS

NTFY_URI=
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
SLACK_URI=
SLACK_CHANNEL=
DISCORD_URI=

HEARTBEAT_PORT=8999
```

------------------------------------------------------------------------

### `domains.json` -- Domain‑specific Cloudflare settings

Create a file named `domains.json`:

``` json
[
  {
    "ENABLED": true,
    "AUTH_EMAIL": "your@mail.com",
    "AUTH_METHOD": "global",
    "AUTH_KEY": "YOUR_CF_GLOBAL_KEY",
    "ZONE_IDENTIFIER": "zone_id_here",
    "RECORD_NAME": "example.com",
    "TTL": 3600,
    "PROXY": true,
    "SITENAME": "example.com"
  },
  {
    "ENABLED": true,
    "AUTH_EMAIL": "info@another.com",
    "AUTH_METHOD": "token",
    "AUTH_KEY": "YOUR_CF_API_TOKEN",
    "ZONE_IDENTIFIER": "another_zone_id",
    "RECORD_NAME": "anotherdomain.com",
    "TTL": 300,
    "PROXY": false,
    "SITENAME": "anotherdomain.com"
  }
]
```

You may add **any number of domains**.\
Each domain is processed independently.

------------------------------------------------------------------------

## 🚀 Running the Updater

Start the updater using:

``` bash
node app.js
```

or:

``` bash
npm start
```

The script will:

1.  Detect the public IP
2.  Load all enabled domains from `domains.json`
3.  Compare existing Cloudflare records
4.  Update changed A records
5.  Log & optionally notify

------------------------------------------------------------------------

## 📡 Heartbeat API

A minimal health‑check endpoint:

``` http
GET /heartbeat
```

Example response:

``` json
{
  "status": "ok",
  "timestamp": "2025-05-29T07:55:34.156Z"
}
```

------------------------------------------------------------------------

## 📂 Logs

All logs are stored in:

    ./logs/ddns.log

Example log entries:

    [2025-05-29T07:55:00.000Z] INFO - foglaljon.online updated to IP 12.34.56.78
    [2025-05-29T07:55:01.432Z] INFO - ewa.agency updated to IP 12.34.56.78

------------------------------------------------------------------------

## 🧭 Roadmap

-   [ ] Docker support\
-   [ ] Email notification support\
-   [ ] Web dashboard for editing domains.json

------------------------------------------------------------------------

## ☕ Credits

Made with caffeine, curiosity, and questionable sleep patterns.\
Always run DDNS scripts before your morning coffee --- risky, but fun.

------------------------------------------------------------------------

## 📄 License

MIT © 2025 -- https://github.com/hunnomad
