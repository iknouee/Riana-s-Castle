require('dotenv').config();

const path = require('path');
const express = require('express');
const {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
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
  res.status(200).send("Riana's Castle bot is online.");
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

const testWelcomeCommand = new SlashCommandBuilder()
  .setName('testwelcome')
  .setDescription("Preview the Riana's Castle welcome message.");

const rulesCommand = new SlashCommandBuilder()
  .setName('rulesembed')
  .setDescription('Send the Royal Protocol rules embed in this channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const boostPerksCommand = new SlashCommandBuilder()
  .setName('boostperks')
  .setDescription('Send the Princess Perks image embed in this channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const boostPerksImageUrl =
  'https://cdn.discordapp.com/attachments/1317849175760834613/1530252343629709343/ChatGPT_Image_Jul_24_2026_05_35_27_PM.png?ex=6a64e60d&is=6a63948d&hm=060bca28890422e0ea59407dab7d35c0a17f044387dd721935357fb72aab2942';

function buildBoostPerksEmbed() {
  return new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#F4B8CC')
    .setImage(boostPerksImageUrl);
}

function buildRulesEmbed(guild) {
  const sparkle = '<a:riascastle:1527767518973001941>';
  const titleEmoji = '<a:riascastle:1527747236988063918>';

  return new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#F4B8CC')
    .setAuthor({
      name: "Riana's Castle",
      iconURL: guild.iconURL({ size: 256 }) || undefined,
    })
    .setTitle(`𝐓𝐇𝐄 𝐑𝐎𝐘𝐀𝐋 𝐏𝐑𝐎𝐓𝐎𝐂𝐎𝐋 ${titleEmoji}`)
    .setDescription(
      [
        `***𝟏. 𝐑𝐞𝐬𝐩𝐞𝐜𝐭 𝐭𝐡𝐞 𝐂𝐚𝐬𝐭𝐥𝐞*** ${sparkle}`,
        '𝘛𝘳𝘦𝘢𝘵 𝘢𝘭𝘭 𝘮𝘦𝘮𝘣𝘦𝘳𝘴 𝘸𝘪𝘵𝘩 𝘬𝘪𝘯𝘥𝘯𝘦𝘴𝘴 𝘢𝘯𝘥 𝘳𝘦𝘴𝘱𝘦𝘤𝘵. 𝘕𝘰 𝘣𝘶𝘭𝘭𝘺𝘪𝘯𝘨, 𝘩𝘢𝘳𝘢𝘴𝘴𝘮𝘦𝘯𝘵, 𝘥𝘪𝘴𝘤𝘳𝘪𝘮𝘪𝘯𝘢𝘵𝘪𝘰𝘯, 𝘰𝘳 𝘶𝘯𝘯𝘦𝘤𝘦𝘴𝘴𝘢𝘳𝘺 𝘥𝘳𝘢𝘮𝘢 𝘸𝘪𝘭𝘭 𝘣𝘦 𝘵𝘰𝘭𝘦𝘳𝘢𝘵𝘦𝘥.',
        '',
        `***𝟐. 𝐊𝐞𝐞𝐩 𝐭𝐡𝐞 𝐂𝐚𝐬𝐭𝐥𝐞 𝐒𝐚𝐟𝐞*** ${sparkle}`,
        '𝘕𝘰 𝘕𝘚𝘍𝘞 𝘤𝘰𝘯𝘵𝘦𝘯𝘵, 𝘪𝘯𝘢𝘱𝘱𝘳𝘰𝘱𝘳𝘪𝘢𝘵𝘦 𝘫𝘰𝘬𝘦𝘴, 𝘰𝘳 𝘢𝘯𝘺𝘵𝘩𝘪𝘯𝘨 𝘵𝘩𝘢𝘵 𝘮𝘢𝘬𝘦𝘴 𝘵𝘩𝘦 𝘬𝘪𝘯𝘨𝘥𝘰𝘮 𝘶𝘯𝘤𝘰𝘮𝘧𝘰𝘳𝘵𝘢𝘣𝘭𝘦.',
        '',
        `***𝟑. 𝐅𝐨𝐥𝐥𝐨𝐰 𝐭𝐡𝐞 𝐑𝐨𝐲𝐚𝐥 𝐂𝐨𝐮𝐫𝐭 𝐑𝐮𝐥𝐞𝐬*** ${sparkle}`,
        '𝘓𝘪𝘴𝘵𝘦𝘯 𝘵𝘰 𝘴𝘵𝘢𝘧𝘧 𝘮𝘦𝘮𝘣𝘦𝘳𝘴 𝘢𝘯𝘥 𝘧𝘰𝘭𝘭𝘰𝘸 𝘵𝘩𝘦𝘪𝘳 𝘥𝘦𝘤𝘪𝘴𝘪𝘰𝘯𝘴. 𝘐𝘧 𝘺𝘰𝘶 𝘩𝘢𝘷𝘦 𝘢𝘯 𝘪𝘴𝘴𝘶𝘦, 𝘰𝘱𝘦𝘯 𝘢 𝘵𝘪𝘤𝘬𝘦𝘵 𝘪𝘯𝘴𝘵𝘦𝘢𝘥 𝘰𝘧 𝘤𝘢𝘶𝘴𝘪𝘯𝘨 𝘤𝘩𝘢𝘰𝘴 𝘪𝘯 𝘵𝘩𝘦 𝘤𝘢𝘴𝘵𝘭𝘦.',
        '',
        `***𝟒. 𝐍𝐨 𝐑𝐨𝐲𝐚𝐥 𝐑𝐢𝐯𝐚𝐥𝐫𝐢𝐞𝐬*** ${sparkle}`,
        '𝘋𝘰 𝘯𝘰𝘵 𝘴𝘵𝘢𝘳𝘵 𝘶𝘯𝘯𝘦𝘤𝘦𝘴𝘴𝘢𝘳𝘺 𝘧𝘪𝘨𝘩𝘵𝘴, 𝘢𝘳𝘨𝘶𝘮𝘦𝘯𝘵𝘴, 𝘰𝘳 𝘴𝘱𝘳𝘦𝘢𝘥 𝘯𝘦𝘨𝘢𝘵𝘪𝘷𝘪𝘵𝘺. 𝘒𝘦𝘦𝘱 𝘵𝘩𝘦 𝘬𝘪𝘯𝘨𝘥𝘰𝘮 𝘱𝘦𝘢𝘤𝘦𝘧𝘶𝘭.',
        '',
        `***𝟓. 𝐏𝐫𝐨𝐭𝐞𝐜𝐭 𝐭𝐡𝐞 𝐂𝐚𝐬𝐭𝐥𝐞 𝐖𝐚𝐥𝐥𝐬*** ${sparkle}`,
        '𝘕𝘰 𝘢𝘥𝘷𝘦𝘳𝘵𝘪𝘴𝘪𝘯𝘨, 𝘴𝘦𝘭𝘧-𝘱𝘳𝘰𝘮𝘰𝘵𝘪𝘰𝘯, 𝘰𝘳 𝘴𝘩𝘢𝘳𝘪𝘯𝘨 𝘪𝘯𝘷𝘪𝘵𝘦𝘴 𝘵𝘰 𝘰𝘵𝘩𝘦𝘳 𝘴𝘦𝘳𝘷𝘦𝘳𝘴 𝘸𝘪𝘵𝘩𝘰𝘶𝘵 𝘴𝘵𝘢𝘧𝘧 𝘱𝘦𝘳𝘮𝘪𝘴𝘴𝘪𝘰𝘯.',
        '',
        `***𝟔. 𝐔𝐬𝐞 𝐭𝐡𝐞 𝐏𝐫𝐨𝐩𝐞𝐫 𝐂𝐡𝐚𝐦𝐛𝐞𝐫𝐬*** ${sparkle}`,
        '𝘒𝘦𝘦𝘱 𝘤𝘰𝘯𝘷𝘦𝘳𝘴𝘢𝘵𝘪𝘰𝘯𝘴 𝘪𝘯 𝘵𝘩𝘦 𝘤𝘰𝘳𝘳𝘦𝘤𝘵 𝘤𝘩𝘢𝘯𝘯𝘦𝘭𝘴. 𝘌𝘷𝘦𝘳𝘺 𝘳𝘰𝘰𝘮 𝘪𝘯 𝘵𝘩𝘦 𝘤𝘢𝘴𝘵𝘭𝘦 𝘩𝘢𝘴 𝘪𝘵𝘴 𝘱𝘶𝘳𝘱𝘰𝘴𝘦.',
        '',
        `***𝟕. 𝐍𝐨 𝐈𝐦𝐩𝐞𝐫𝐬𝐨𝐧𝐚𝐭𝐢𝐧𝐠 𝐑𝐨𝐲𝐚𝐥𝐬*** ${sparkle}`,
        '𝘋𝘰 𝘯𝘰𝘵 𝘱𝘳𝘦𝘵𝘦𝘯𝘥 𝘵𝘰 𝘣𝘦 𝘴𝘵𝘢𝘧𝘧, 𝘰𝘸𝘯𝘦𝘳𝘴, 𝘰𝘳 𝘰𝘵𝘩𝘦𝘳 𝘮𝘦𝘮𝘣𝘦𝘳𝘴.',
        '',
        `***𝟖. 𝐊𝐞𝐞𝐩 𝐘𝐨𝐮𝐫 𝐂𝐫𝐨𝐰𝐧 𝐑𝐞𝐬𝐩𝐞𝐜𝐭𝐟𝐮𝐥*** ${sparkle}`,
        '𝘕𝘰 𝘦𝘹𝘤𝘦𝘴𝘴𝘪𝘷𝘦 𝘴𝘸𝘦𝘢𝘳𝘪𝘯𝘨, 𝘴𝘭𝘶𝘳𝘴, 𝘰𝘳 𝘩𝘢𝘵𝘦𝘧𝘶𝘭 𝘭𝘢𝘯𝘨𝘶𝘢𝘨𝘦 𝘵𝘰𝘸𝘢𝘳𝘥𝘴 𝘰𝘵𝘩𝘦𝘳𝘴.',
        '',
        `***𝟗. 𝐋𝐢𝐬𝐭𝐞𝐧 𝐭𝐨 𝐭𝐡𝐞 𝐑𝐨𝐲𝐚𝐥 𝐒𝐭𝐚𝐟𝐟*** ${sparkle}`,
        '𝘚𝘵𝘢𝘧𝘧 𝘩𝘢𝘷𝘦 𝘵𝘩𝘦 𝘧𝘪𝘯𝘢𝘭 𝘴𝘢𝘺 𝘸𝘩𝘦𝘯 𝘩𝘢𝘯𝘥𝘭𝘪𝘯𝘨 𝘴𝘪𝘵𝘶𝘢𝘵𝘪𝘰𝘯𝘴. 𝘙𝘦𝘴𝘱𝘦𝘤𝘵 𝘵𝘩𝘦𝘪𝘳 𝘤𝘩𝘰𝘪𝘤𝘦𝘴.',
        '',
        `***𝟏𝟎. 𝐄𝐧𝐣𝐨𝐲 𝐘𝐨𝐮𝐫 𝐒𝐭𝐚𝐲 𝐈𝐧 𝐑𝐢𝐚𝐧𝐚’𝐬 𝐂𝐚𝐬𝐭𝐥𝐞*** ${sparkle}`,
        '𝘔𝘢𝘬𝘦 𝘯𝘦𝘸 𝘧𝘳𝘪𝘦𝘯𝘥𝘴, 𝘫𝘰𝘪𝘯 𝘪𝘯, 𝘢𝘯𝘥 𝘩𝘦𝘭𝘱 𝘬𝘦𝘦𝘱 𝘰𝘶𝘳 𝘭𝘪𝘵𝘵𝘭𝘦 𝘬𝘪𝘯𝘨𝘥𝘰𝘮 𝘧𝘶𝘯, 𝘸𝘦𝘭𝘤𝘰𝘮𝘪𝘯𝘨, 𝘢𝘯𝘥 𝘱𝘦𝘢𝘤𝘦𝘧𝘶𝘭.',
      ].join('\n'),
    )
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .setFooter({
      text: "By staying in Riana's Castle, you agree to follow the Royal Protocol.",
      iconURL: guild.iconURL({ size: 128 }) || undefined,
    })
    .setTimestamp();
}

async function sendWelcomeMessage(member) {
  const welcomeChannel = await member.guild.channels.fetch(
    process.env.WELCOME_CHANNEL_ID,
  );

  if (!welcomeChannel || !welcomeChannel.isTextBased()) {
    throw new Error('WELCOME_CHANNEL_ID is not a text channel the bot can access.');
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
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Connected to ${readyClient.guilds.cache.size} server(s).`);

  for (const guild of readyClient.guilds.cache.values()) {
    try {
      await guild.commands.set([
        testWelcomeCommand.toJSON(),
        rulesCommand.toJSON(),
        boostPerksCommand.toJSON(),
      ]);
      console.log(`Registered /testwelcome, /rulesembed and /boostperks in ${guild.name}.`);
    } catch (error) {
      console.error(`Failed to register commands in ${guild.name}:`, error);
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    await sendWelcomeMessage(member);
  } catch (error) {
    console.error('Failed to send welcome message:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.inGuild()) {
    await interaction.reply({
      content: 'This command can only be used inside the server.',
      ephemeral: true,
    });
    return;
  }

  if (interaction.commandName === 'testwelcome') {
    try {
      await interaction.deferReply({ ephemeral: true });
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await sendWelcomeMessage(member);
      await interaction.editReply('The test welcome message was sent successfully. ♡');
    } catch (error) {
      console.error('Failed to run /testwelcome:', error);
      const message = 'I could not send the test welcome. Check the welcome channel ID and my channel permissions.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  if (interaction.commandName === 'rulesembed') {
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.channel.send({
        embeds: [buildRulesEmbed(interaction.guild)],
        allowedMentions: { parse: [] },
      });
      await interaction.editReply('The Royal Protocol embed was sent successfully. 👑');
    } catch (error) {
      console.error('Failed to run /rulesembed:', error);
      const message = 'I could not send the rules embed. Make sure I can send messages and embeds in this channel.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
  }


  if (interaction.commandName === 'boostperks') {
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.channel.send({
        embeds: [buildBoostPerksEmbed()],
        allowedMentions: { parse: [] },
      });
      await interaction.editReply('The Princess Perks image embed was sent successfully. ♡');
    } catch (error) {
      console.error('Failed to run /boostperks:', error);
      const message = 'I could not send the boost perks embed. Make sure I can send messages and embeds in this channel.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
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
