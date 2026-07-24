require('dotenv').config();

const path = require('path');
const express = require('express');
const {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
} = require('discord.js');

const requiredEnv = [
  'DISCORD_TOKEN',
  'WELCOME_CHANNEL_ID',
  'ROYAL_LAW_CHANNEL_ID',
  'CASTLE_UPDATES_CHANNEL_ID',
  'ROYAL_LOUNGE_CHANNEL_ID',
];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const port = Number(process.env.PORT || 3000);

app.get('/', (_req, res) => {
  res.status(200).send("Riana's Castle welcome bot is online.");
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Web server listening on port ${port}.`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const bannerPath = path.join(__dirname, 'assets', 'welcome-banner.png');

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Connected to ${readyClient.guilds.cache.size} server(s).`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const welcomeChannel = await member.guild.channels.fetch(
      process.env.WELCOME_CHANNEL_ID,
    );

    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      console.error('WELCOME_CHANNEL_ID is not a text channel the bot can access.');
      return;
    }

    const banner = new AttachmentBuilder(bannerPath, {
      name: 'welcome-banner.png',
    });

    const embed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#F4B8CC')
      .setAuthor({
        name: "Riana's Castle",
        iconURL: member.guild.iconURL({ size: 256 }) || undefined,
      })
      .setTitle(`Welcome to Riana's Castle, ${member.user.username}! ♡`)
      .setDescription(
        [
          `Welcome ${member} — you are **member #${member.guild.memberCount.toLocaleString()}**!`,
          '',
          'We are a friendly hangout server, so settle in, meet new people and enjoy the castle.',
          '',
          `> 📜 **Read first:** <#${process.env.ROYAL_LAW_CHANNEL_ID}>`,
          `> 📣 **Stay updated:** <#${process.env.CASTLE_UPDATES_CHANNEL_ID}>`,
          `> 💬 **Start chatting:** <#${process.env.ROYAL_LOUNGE_CHANNEL_ID}>`,
        ].join('\n'),
      )
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setImage('attachment://welcome-banner.png')
      .setFooter({
        text: `Riana's Castle • ${member.guild.memberCount.toLocaleString()} members`,
        iconURL: member.guild.iconURL({ size: 128 }) || undefined,
      })
      .setTimestamp();

    await welcomeChannel.send({
      content: `✨ Everyone welcome ${member} to **Riana's Castle**!`,
      embeds: [embed],
      files: [banner],
      allowedMentions: {
        users: [member.id],
        roles: [],
        repliedUser: false,
      },
    });
  } catch (error) {
    console.error('Failed to send welcome message:', error);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error('Bot login failed:', error);
  process.exit(1);
});
