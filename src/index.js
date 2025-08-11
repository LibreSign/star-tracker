import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import dotenv from 'dotenv';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const {
    WEBHOOK_SECRET,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    LANGUAGE = 'pt',
    DEBUG = 0,
    PORT = '3000',
} = process.env;

if (!WEBHOOK_SECRET || !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('❌ Missing env vars. Set WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID');
    process.exit(1);
}

await i18next
    .use(Backend)
    .init({
        lng: LANGUAGE || 'pt',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        backend: {
            loadPath: path.join(__dirname, 'locales/{{lng}}.json'),
            addPath: path.join(__dirname, '/locales/{{lng}}_{{ns}}.missing.json'),
        }
    });

function isValidSignature(rawBody, signature) {
    if (!signature) return false;
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    const digest = Buffer.from(
        'sha256=' + hmac.update(rawBody).digest('hex'),
        'utf8'
    );
    const sigBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== sigBuffer.length) return false;
    return timingSafeEqual(digest, sigBuffer);
}

async function sendToTelegram(text) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: 'markdown',
            disable_web_page_preview: true,
        }),
    });

    if (!res.ok) {
        console.error('❌ Telegram error:', res.status, await res.text());
    } else {
        console.log('✅ Telegram message sent:', text);
    }
}

createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/webhook') {
        res.statusCode = 404;
        res.end('Not found');
        return;
    }

    try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const rawBody = Buffer.concat(chunks).toString('utf8');

        if (!DEBUG) {
            const signature = req.headers['x-hub-signature-256'];
            if (!isValidSignature(rawBody, signature)) {
                res.statusCode = 401;
                res.end('Invalid signature');
                return;
            }
        }

        const event = req.headers['x-github-event'];
        const payload = JSON.parse(rawBody);

        console.error('Event', [event, payload.action])
        if (event === 'star') {
            const action = payload.action;
            if (action !== 'created' && action !== 'deleted') return;

            const repo = `${payload.repository.owner.login}/${payload.repository.name}`;
            const starrer = payload.sender.login;
            const count = payload.repository.stargazers_count;

            const emoji = i18next.t(`star.emoji.${action}`);
            const prefix = i18next.t(`star.prefix.${action}`);

            const text = i18next.t('star.message', {
                emoji,
                prefix,
                repo,
                starrer,
                count,
            });

            await sendToTelegram(text);
        }

        res.statusCode = 200;
        res.end('ok');
    } catch (err) {
        console.error('❌ Error:', err);
        res.statusCode = 500;
        res.end('Server error');
    }
}).listen(Number(PORT), () => {
    console.log(`🚀 Webhook server on http://0.0.0.0:${PORT}/webhook`);
});
