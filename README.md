# GitHub Stars to Telegram Webhook

A standalone Node.js application that listens to **GitHub Webhook** `star` events and sends a notification to a Telegram chat whenever a repository receives or loses a star.

## Features

* ✅ Listens for GitHub **star** events (`created` and `deleted`).
* ✅ Sends a message to a Telegram group or channel.
* ✅ Supports multiple languages via **i18next**.
* ✅ Validates GitHub webhook payloads using HMAC signatures (`X-Hub-Signature-256`).
* ✅ No external framework — pure Node.js HTTP server.

## How it Works

1. GitHub sends a webhook payload when a user stars or unstars your repository.
2. The application validates the signature using the shared `WEBHOOK_SECRET`.
3. It formats a message with repository info, starrer username, and current star count.
4. The message is sent to your configured Telegram chat via the Bot API.

## Requirements

* A **Telegram Bot Token** from [@BotFather](https://t.me/BotFather)
* A **Telegram Chat ID** (group, channel, or direct chat)
* A **GitHub Webhook** configured to send **star** events

## Installation

Clone this repository:

```bash
git clone https://github.com/yourusername/github-stars-to-telegram.git
cd github-stars-to-telegram
```

Create a `.env` file in the project root:

```env
WEBHOOK_SECRET=your-github-webhook-secret
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=-1001234567890
LANGUAGE=pt
PORT=3000
```

Wake up the environment with `docker compose up`

## GitHub Webhook Setup

1. Go to your repository **Settings → Webhooks → Add webhook**.
2. Set:

   * **Payload URL:** `https://your-domain.com/webhook`
   * **Content type:** `application/json`
   * **Secret:** same as `WEBHOOK_SECRET` in your `.env`
3. Select **Let me select individual events** → check **Star**.
4. Save.

## Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/BotFather).
2. Copy the **Bot Token** to `TELEGRAM_BOT_TOKEN` in `.env`.
3. Add the bot to your group/channel and make sure it has permission to send messages.
4. Find your chat ID:

   * You can use [@RawDataBot](https://t.me/RawDataBot) or the Telegram Bot API (`getUpdates`).

## Testing

Set the environment `DEBUG` as `1`.

You can mock a webhook call using `curl`:

```bash
BODY='{"action":"created", ... }'

curl -X POST http://localhost:3000/webhook \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Event: star" \
    --data "$BODY"
```

## Internationalization (i18n)

This project uses **i18next** for translations. You can add more languages in the `src/locales` folder and send a new PR.
