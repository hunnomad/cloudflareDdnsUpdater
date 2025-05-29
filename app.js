require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const winston = require('winston');
const express = require('express');

const fs = require('fs');
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()} - ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.colorize({ all: true }) }),
    new winston.transports.File({ filename: './logs/ddns.log' })
  ]
});

// Extract env vars
const {
  AUTH_EMAIL,
  AUTH_METHOD,
  AUTH_KEY,
  ZONE_IDENTIFIER,
  RECORD_NAME,
  TTL,
  PROXY,
  SITENAME,
  SLACK_URI,
  SLACK_CHANNEL,
  DISCORD_URI,
  NTFY_URI,
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  HEARTBEAT_PORT
} = process.env;

// Notification helpers
async function sendNtfy(message) {
  if (!NTFY_URI) return;
  try {
    await axios.post(NTFY_URI, message, { headers: { 'Content-Type': 'text/plain' } });
  } catch (err) {
    logger.warn(`NTFY error: ${err.message}`);
  }
}

async function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });
  } catch (err) {
    logger.warn(`Telegram error: ${err.message}`);
  }
}

async function getPublicIP() {
  try {
    const res = await axios.get('https://cloudflare.com/cdn-cgi/trace');
    const ipLine = res.data.split('\n').find(line => line.startsWith('ip='));
    if (ipLine) return ipLine.replace('ip=', '');
  } catch (_) {}
  try {
    const ipRes = await axios.get('https://api.ipify.org');
    return ipRes.data.trim();
  } catch (err) {
    logger.error('Failed to retrieve public IP.');
    return null;
  }
}

async function updateDNS() {
  const ip = await getPublicIP();
  if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    logger.error('Invalid IP format or IP retrieval failed.');
    await sendNtfy(`[❌] ${SITENAME} - IP retrieval failed`);
    await sendTelegram(`[❌] ${SITENAME} - IP retrieval failed`);
    return;
  }

  const authHeader =
    AUTH_METHOD === 'global'
      ? { 'X-Auth-Email': AUTH_EMAIL, 'X-Auth-Key': AUTH_KEY }
      : { Authorization: `Bearer ${AUTH_KEY}` };

  try {
    const recordRes = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_IDENTIFIER}/dns_records?type=A&name=${RECORD_NAME}`,
      { headers: { ...authHeader, 'Content-Type': 'application/json' } }
    );

    if (recordRes.data.result.length === 0) {
      logger.error(`Record does not exist for ${RECORD_NAME}`);
      await sendNtfy(`[❌] ${SITENAME} - Record does not exist`);
      await sendTelegram(`[❌] ${SITENAME} - Record does not exist`);
      return;
    }

    const record = recordRes.data.result[0];
    if (record.content === ip) {
      // logger.info(`IP (${ip}) for ${RECORD_NAME} has not changed.`);  # If you need up-to-the-minute info, enable this line
      return;
    }

    const updateRes = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_IDENTIFIER}/dns_records/${record.id}`,
      {
        type: 'A',
        name: RECORD_NAME,
        content: ip,
        ttl: parseInt(TTL),
        proxied: PROXY === 'true'
      },
      { headers: { ...authHeader, 'Content-Type': 'application/json' } }
    );

    if (updateRes.data.success) {
      const msg = `[✅] ${SITENAME} - IP updated to ${ip}`;
      logger.info(msg);
      await sendNtfy(msg);
      await sendTelegram(msg);
    } else {
      throw new Error('Update failed');
    }
  } catch (err) {
    const errMsg = `[❌] ${SITENAME} - Update failed: ${err.message}`;
    logger.error(errMsg);
    await sendNtfy(errMsg);
    await sendTelegram(errMsg);
  }
}

// 🕒 Schedule every minute
cron.schedule('* * * * *', () => {
  logger.info('Running scheduled DDNS check...');
  updateDNS();
});

// ❤️ Heartbeat endpoint
const app = express();
app.get('/heartbeat', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(HEARTBEAT_PORT || 8099, () => {
  logger.info(`CloudflareDdns API running on port ${HEARTBEAT_PORT || 8999}`);
});
