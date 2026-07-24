# Riana's Castle Welcome Bot

A Discord.js welcome bot that sends a polished welcome embed when somebody joins the server.

## Render setup

1. Upload this project to GitHub.
2. Create a new **Web Service** on Render and connect the repository.
3. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
4. Add the environment variables shown below.

## Environment variables

- `DISCORD_TOKEN` — your Discord bot token
- `WELCOME_CHANNEL_ID` — the channel where welcome messages should be sent
- `ROYAL_LAW_CHANNEL_ID` — already included in `.env.example`
- `CASTLE_UPDATES_CHANNEL_ID` — already included in `.env.example`
- `ROYAL_LOUNGE_CHANNEL_ID` — already included in `.env.example`
- `EMBED_COLOR` — optional hex colour, defaults to `#F4B8CC`

Render automatically supplies the `PORT` variable.

## Discord Developer Portal

Open your application in the Discord Developer Portal:

1. Go to **Bot**.
2. Enable **Server Members Intent** under Privileged Gateway Intents.
3. Invite the bot with these permissions:
   - View Channels
   - Send Messages
   - Embed Links
   - Attach Files

The bot does not need Administrator permission.

## Finding the welcome channel ID

Enable Discord Developer Mode, right-click the welcome channel, then choose **Copy Channel ID**.
