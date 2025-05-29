
# 🌐 Cloudflare DDNS Updater (Node.js Edition)

A fully automated, secure, modern Cloudflare DDNS client that checks your public IP address every minute and updates the appropriate A record in Cloudflare.

---

## 🔧 Features

- ✅ `.env` file support
- ✅ Minute-based check with `node-cron`
- ✅ Logging with `winston`: colored console + file (`./logs/ddns.log`)
- ✅ Notifications via `ntfy`, `Telegram`, `Slack`, `Discord` (optional)
- ✅ Built-in `heartbeat` API for monitoring (`GET /heartbeat`)
- ✅ No unnecessary dependencies: secure and lightweight

---

## 🚀 Installation

1. Clone or download the project:
   ```bash
   git clone https://github.com/youruser/cloudflareDdns.git
   cd cloudflareDdns
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following content:

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

| Variable           | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `AUTH_EMAIL`       | The email used to login to Cloudflare Dashboard                            |
| `AUTH_METHOD`      | Set to `"global"` for Global API Key or `"token"` for Scoped API Token     |
| `AUTH_KEY`         | Your API Token or Global API Key                                            |
| `ZONE_IDENTIFIER`  | Found in the "Overview" tab of your domain in Cloudflare                   |
| `RECORD_NAME`      | The DNS record you want to keep updated (e.g. `example.com`)               |
| `TTL`              | Time to live for DNS record, in seconds (default: 3600)                    |
| `PROXY`            | Use `"true"` or `"false"` to enable/disable Cloudflare proxy               |
| `SITENAME`         | Just a display name for your site, used in notifications                   |
| `SLACK_CHANNEL`    | Slack channel name (e.g. `#updates`)                                       |
| `SLACK_URI`        | Slack Webhook URL                                                           |
| `DISCORD_URI`      | Discord Webhook URL                                                         |
| `NTFY_URI`         | ntfy.sh URL for push notification                                           |
| `TELEGRAM_TOKEN`   | Telegram bot token for push messages                                        |
| `TELEGRAM_CHAT_ID` | Chat ID to send Telegram notifications                                      |
| `HEARTBEAT_PORT`   | Port for the heartbeat monitoring endpoint (default: `8099`)                |

4. Start the updater:

```bash
node app.js
```
or

```bash
npm start
```

---

## 📋 Heartbeat API

A minimal built-in API endpoint to verify the service is alive:

```http
GET /heartbeat
```

Example response:

```json
{
  "status": "ok",
  "timestamp": "2025-05-29T07:55:34.156Z"
}
```

---

## 📂 Logs

Log output is stored in `logs/ddns.log`, for example:

```
[2025-05-29T07:55:00.000Z] INFO - Running scheduled DDNS check...
[2025-05-29T07:55:01.432Z] INFO - example.com updated to IP 12.34.56.78
```

---

## ✨ To-Do

- [ ] Docker support
- [ ] Email notification option
- [ ] Web UI for configuration

---

## ☕ Credits

This project was born one morning with low blood pressure and high caffeine needs.  
Tip: always brew a coffee before starting your DDNS adventures!

---

## 📖 Reference

This script was made with reference from K0p1-Git.  
👉 [https://github.com/K0p1-Git/cloudflare-ddns-updater](https://github.com/K0p1-Git/cloudflare-ddns-updater)

---

## 📄 License

MIT © 2025 – [@hunnomad](https://github.com/hunnomad)
