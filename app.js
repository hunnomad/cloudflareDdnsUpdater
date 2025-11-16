require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const winston = require('winston');
const express = require('express');
const fs = require('fs');

// -----------------------------------------------------------------------------
//  LOG FOLDER
// -----------------------------------------------------------------------------
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

// -----------------------------------------------------------------------------
//  LOGGER
// -----------------------------------------------------------------------------
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()} - ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.colorize({ all: true })
    }),
    new winston.transports.File({ filename: './logs/ddns.log' })
  ]
});

// -----------------------------------------------------------------------------
//  ENV VARS (közös, nem domain-specifikus cuccok)
// -----------------------------------------------------------------------------
const {
  SITENAME,
  SLACK_URI,
  SLACK_CHANNEL,
  DISCORD_URI,
  NTFY_URI,
  TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID,
  HEARTBEAT_PORT
} = process.env;

// -----------------------------------------------------------------------------
//  DOMAINS CONFIG BETÖLTÉSE
// -----------------------------------------------------------------------------
let DOMAINS_CONFIG = [];

try {
  const raw = fs.readFileSync('./domains.json', 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    DOMAINS_CONFIG = parsed.filter(d => d.ENABLED !== false);
  } else {
    logger.error('domains.json is not an array');
  }
} catch (err) {
  logger.error(`Failed to load domains.json: ${err.message}`);
}

if (DOMAINS_CONFIG.length === 0) {
  logger.warn('No enabled domains configured in domains.json');
}

// -----------------------------------------------------------------------------
//  NOTIFICATION HELPERS
// -----------------------------------------------------------------------------
async function sendNtfy(message) {
  if (!NTFY_URI) return;
  try {
    await axios.post(NTFY_URI, message, {
      headers: { 'Content-Type': 'text/plain' }
    });
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

// -----------------------------------------------------------------------------
//  IP LOOKUP
// -----------------------------------------------------------------------------
async function getPublicIP() {
  // 1) Cloudflare trace
  try {
    const res = await axios.get('https://cloudflare.com/cdn-cgi/trace');
    const ipLine = res.data.split('\n').find(line => line.startsWith('ip='));
    if (ipLine) return ipLine.replace('ip=', '').trim();
  } catch (_) { /* ignore */ }

  // 2) Fallback: ipify
  try {
    const ipRes = await axios.get('https://api.ipify.org');
    return ipRes.data.trim();
  } catch (err) {
    logger.error('Failed to retrieve public IP.');
    return null;
  }
}

// -----------------------------------------------------------------------------
//  CLOUDFLARE HELPERS
// -----------------------------------------------------------------------------

// Egységes auth header domain config alapján
function getAuthHeader(domainCfg) {
  const method = (domainCfg.AUTH_METHOD || 'global').toLowerCase();

  if (method === 'global') {
    return {
      'X-Auth-Email': domainCfg.AUTH_EMAIL,
      'X-Auth-Key': domainCfg.AUTH_KEY
    };
  }

  // Token alapú auth
  return {
    Authorization: `Bearer ${domainCfg.AUTH_KEY}`
  };
}

/**
 * Egy konkrét A rekord frissítése adott IP-re, domain config szerint
 */
async function updateDNSForDomain(domainCfg, ip) {
  const {
    ZONE_IDENTIFIER,
    RECORD_NAME,
    TTL,
    PROXY,
    SITENAME: DOMAIN_SITENAME
  } = domainCfg;

  if (!ZONE_IDENTIFIER || !RECORD_NAME) {
    logger.error(`Missing ZONE_IDENTIFIER or RECORD_NAME for domain config: ${JSON.stringify(domainCfg)}`);
    return;
  }

  const ttlValue = parseInt(TTL, 10) || 3600;
  const proxied = PROXY === true || PROXY === 'true';

  const authHeader = getAuthHeader(domainCfg);
  const label = DOMAIN_SITENAME || RECORD_NAME || SITENAME || 'DDNS';

  try {
    const recordRes = await axios.get(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_IDENTIFIER}/dns_records?type=A&name=${RECORD_NAME}`,
      { headers: { ...authHeader, 'Content-Type': 'application/json' } }
    );

    if (!recordRes.data.success) {
      throw new Error(`DNS record query failed for ${RECORD_NAME}`);
    }

    if (recordRes.data.result.length === 0) {
      const msg = `Record does not exist for ${RECORD_NAME}`;
      logger.error(msg);
      await sendNtfy(`[❌] ${label} - ${msg}`);
      //await sendTelegram(`[❌] ${label} - ${msg}`);
      return;
    }

    const record = recordRes.data.result[0];

    if (record.content === ip) {
      // Ha logolni akarod minden percben:
      // logger.info(`[=] ${label} - IP unchanged (${ip}) for ${RECORD_NAME}`);
      return;
    }

    const updateRes = await axios.patch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_IDENTIFIER}/dns_records/${record.id}`,
      {
        type: 'A',
        name: RECORD_NAME,
        content: ip,
        ttl: ttlValue,
        proxied
      },
      { headers: { ...authHeader, 'Content-Type': 'application/json' } }
    );

    if (!updateRes.data.success) {
      throw new Error(`Update failed for ${RECORD_NAME}`);
    }

    const msg = `[✅] ${label} - ${RECORD_NAME} IP updated to ${ip}`;
    logger.info(msg);
    await sendNtfy(msg);
    //await sendTelegram(msg);

  } catch (err) {
    const errMsg = `[❌] ${label} - ${RECORD_NAME} update failed: ${err.message}`;
    logger.error(errMsg);
    await sendNtfy(errMsg);
    //await sendTelegram(errMsg);
  }
}

// -----------------------------------------------------------------------------
//  MAIN UPDATE (ALL DOMAINS)
// -----------------------------------------------------------------------------
async function updateAllDomains() {
  if (DOMAINS_CONFIG.length === 0) {
    return;
  }

  const ip = await getPublicIP();
  if (!ip || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    const msg = 'Invalid IP format or IP retrieval failed.';
    const label = SITENAME || 'DDNS';
    logger.error(msg);
    await sendNtfy(`[❌] ${label} - ${msg}`);
    //await sendTelegram(`[❌] ${label} - ${msg}`);
    return;
  }

  for (const domainCfg of DOMAINS_CONFIG) {
    await updateDNSForDomain(domainCfg, ip);
  }
}

// -----------------------------------------------------------------------------
//  CRON – minden percben
// -----------------------------------------------------------------------------
cron.schedule('* * * * *', () => {
  // logger.info('Running scheduled DDNS check for all domains...');
  updateAllDomains();
});

// -----------------------------------------------------------------------------
//  HEARTBEAT
// -----------------------------------------------------------------------------
const app = express();

app.get('/heartbeat', (_, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const hbPort = HEARTBEAT_PORT || 8099;

app.listen(hbPort, () => {
  logger.info(`CloudflareDdns heartbeat running on http://localhost:${hbPort}`);
});
