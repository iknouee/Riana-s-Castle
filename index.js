require('dotenv').config();

const path = require('path');
const express = require('express');
const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  TextInputStyle,
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

const rolesPanelCommand = new SlashCommandBuilder()
  .setName('rolespanel')
  .setDescription('Send the Crown Selection colour-role panel in this channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const ticketPanelCommand = new SlashCommandBuilder()
  .setName('ticketpanel')
  .setDescription('Send the Riana\'s Castle ticket panel in this channel.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

const ticketAddCommand = new SlashCommandBuilder()
  .setName('ticketadd')
  .setDescription('Add a member to the current ticket.')
  .addUserOption((option) =>
    option.setName('member').setDescription('Member to add').setRequired(true),
  );

const ticketRemoveCommand = new SlashCommandBuilder()
  .setName('ticketremove')
  .setDescription('Remove a member from the current ticket.')
  .addUserOption((option) =>
    option.setName('member').setDescription('Member to remove').setRequired(true),
  );


const colorRoleDefinitions = [
  { key: 'red', label: 'Red', emoji: '🔴', env: 'COLOR_ROLE_RED_ID', description: 'A bold royal red crown.' },
  { key: 'orange', label: 'Orange', emoji: '🟠', env: 'COLOR_ROLE_ORANGE_ID', description: 'A warm orange crown.' },
  { key: 'yellow', label: 'Yellow', emoji: '🟡', env: 'COLOR_ROLE_YELLOW_ID', description: 'A bright golden-yellow crown.' },
  { key: 'green', label: 'Green', emoji: '🟢', env: 'COLOR_ROLE_GREEN_ID', description: 'A fresh emerald-green crown.' },
  { key: 'blue', label: 'Blue', emoji: '🔵', env: 'COLOR_ROLE_BLUE_ID', description: 'A calm sapphire-blue crown.' },
  { key: 'purple', label: 'Purple', emoji: '🟣', env: 'COLOR_ROLE_PURPLE_ID', description: 'A rich royal-purple crown.' },
  { key: 'pink', label: 'Pink', emoji: '🩷', env: 'COLOR_ROLE_PINK_ID', description: 'A classic princess-pink crown.' },
  { key: 'light_pink', label: 'Light Pink', emoji: '🌸', env: 'COLOR_ROLE_LIGHT_PINK_ID', description: 'A soft light-pink crown.' },
  { key: 'white', label: 'White', emoji: '⚪', env: 'COLOR_ROLE_WHITE_ID', description: 'A clean pearl-white crown.' },
];

function getConfiguredColorRoles() {
  return colorRoleDefinitions
    .map((role) => ({
      ...role,
      roleId: (process.env[role.env] || '').trim(),
    }))
    .filter((role) => /^\d{17,20}$/.test(role.roleId));
}

function getMissingColorRoleVariables() {
  return colorRoleDefinitions
    .filter((role) => !/^\d{17,20}$/.test((process.env[role.env] || '').trim()))
    .map((role) => role.env);
}

function buildRolesPanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#F4B8CC')
    .setAuthor({
      name: "Riana's Castle • Crown Selection",
      iconURL: guild.iconURL({ size: 256 }) || undefined,
    })
    .setTitle('♕ Choose Your Royal Crown')
    .setDescription([
      'Pick one colour from the menu below to decorate your name around the castle.',
      '',
      'Selecting a new colour automatically removes your previous colour.',
      'You can also choose **Remove My Colour** whenever you want.',
      '',
      '> Only one crown colour can be worn at a time.',
    ].join('\n'))
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .setFooter({
      text: "Riana's Castle • Your crown, your colour",
      iconURL: guild.iconURL({ size: 128 }) || undefined,
    });
}

function buildRolesPanelRow() {
  const configuredRoles = getConfiguredColorRoles();

  const menu = new StringSelectMenuBuilder()
    .setCustomId('crown_colour_select')
    .setPlaceholder('Choose your crown colour...')
    .setMinValues(1)
    .setMaxValues(1);

  for (const role of configuredRoles) {
    menu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(role.label)
        .setValue(role.key)
        .setDescription(role.description)
        .setEmoji(role.emoji),
    );
  }

  menu.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('Remove My Colour')
      .setValue('remove')
      .setDescription('Remove your current crown colour.')
      .setEmoji('🗑️'),
  );

  return new ActionRowBuilder().addComponents(menu);
}

const ticketTypes = {
  support: {
    label: 'General Support',
    emoji: '💗',
    description: 'Questions, help, or anything you need staff assistance with.',
  },
  report: {
    label: 'Report a Member',
    emoji: '🛡️',
    description: 'Privately report rule-breaking, harassment, or unsafe behaviour.',
  },
  staff: {
    label: 'Staff Support',
    emoji: '👑',
    description: 'Contact the Royal Staff about a private server matter.',
  },
};

function getSupportRoleIds() {
  const raw = process.env.TICKET_SUPPORT_ROLE_IDS || process.env.TICKET_SUPPORT_ROLE_ID || '';
  return [...new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^\d{17,20}$/.test(id)),
  )];
}

function getTicketConfig() {
  return {
    categoryId: process.env.TICKET_CATEGORY_ID,
    supportRoleIds: getSupportRoleIds(),
    logChannelId: process.env.TICKET_LOG_CHANNEL_ID,
  };
}

function missingTicketConfig() {
  const config = getTicketConfig();
  const missing = [];
  if (!config.categoryId) missing.push('TICKET_CATEGORY_ID');
  if (config.supportRoleIds.length === 0) missing.push('TICKET_SUPPORT_ROLE_IDS');
  if (!config.logChannelId) missing.push('TICKET_LOG_CHANNEL_ID');
  return missing;
}

function buildTicketPanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#F4B8CC')
    .setAuthor({
      name: "Riana's Castle • Royal Support",
      iconURL: guild.iconURL({ size: 256 }) || undefined,
    })
    .setTitle('୨୧ Need help inside the castle?')
    .setDescription([
      'Choose the option that best matches what you need and a private ticket will be created for you.',
      '',
      '💗 **General Support**',
      'Questions, help, or anything you need staff assistance with.',
      '',
      '🛡️ **Report a Member**',
      'Privately report rule-breaking, harassment, or unsafe behaviour.',
      '',
      '👑 **Staff Support**',
      'Contact the Royal Staff about a private server matter.',
      '',
      '> Please do not open joke tickets or repeatedly ping staff.',
    ].join('\n'))
    .setThumbnail(guild.iconURL({ size: 256 }) || null)
    .setFooter({
      text: "Riana's Castle • Royal Ticket Desk",
      iconURL: guild.iconURL({ size: 128 }) || undefined,
    });
}

function buildTicketPanelRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open_support')
        .setLabel('General Support')
        .setEmoji('💗')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('ticket_open_report')
        .setLabel('Report a Member')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ticket_open_staff')
        .setLabel('Staff Support')
        .setEmoji('👑')
        .setStyle(ButtonStyle.Success),
    ),
  ];
}

function parseTicketTopic(channel) {
  const topic = channel.topic || '';
  const owner = topic.match(/ticketOwner:(\d+)/)?.[1] || null;
  const type = topic.match(/type:([a-z]+)/)?.[1] || 'support';
  const claimedBy = topic.match(/claimedBy:(\d*)/)?.[1] || null;
  return { owner, type, claimedBy };
}

function isTicketChannel(channel) {
  return channel?.type === ChannelType.GuildText && Boolean(parseTicketTopic(channel).owner);
}

function memberIsTicketStaff(member) {
  const supportRoleIds = getSupportRoleIds();
  return member.permissions.has(PermissionFlagsBits.ManageChannels)
    || supportRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

function safeChannelName(username) {
  const clean = username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 18);
  return clean || 'member';
}

async function createTicket(interaction, typeKey, reason) {
  const config = getTicketConfig();
  const type = ticketTypes[typeKey] || ticketTypes.support;
  const existing = interaction.guild.channels.cache.find((channel) => {
    if (!isTicketChannel(channel)) return false;
    return parseTicketTopic(channel).owner === interaction.user.id;
  });

  if (existing) {
    await interaction.reply({
      content: `You already have an open ticket: ${existing}`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${safeChannelName(interaction.user.username)}`,
    type: ChannelType.GuildText,
    parent: config.categoryId,
    topic: `ticketOwner:${interaction.user.id}|type:${typeKey}|claimedBy:`,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      ...config.supportRoleIds.map((roleId) => ({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ManageMessages,
        ],
      })),
      {
        id: interaction.guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ],
    reason: `Ticket opened by ${interaction.user.tag}`,
  });

  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('Claim Ticket')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );

  const supportMentions = config.supportRoleIds.map((roleId) => `<@&${roleId}>`).join(' ');

  const embed = new EmbedBuilder()
    .setColor(process.env.EMBED_COLOR || '#F4B8CC')
    .setAuthor({
      name: "Riana's Castle • Royal Ticket",
      iconURL: interaction.guild.iconURL({ size: 256 }) || undefined,
    })
    .setTitle(`${type.emoji} ${type.label}`)
    .setDescription([
      `Welcome ${interaction.user}. Your private ticket has been created.`,
      '',
      `**Reason**`,
      reason,
      '',
      `A member of ${supportMentions} will assist you soon.`,
      '> Please explain everything clearly and avoid repeatedly pinging staff.',
    ].join('\n'))
    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: `Opened by ${interaction.user.tag}` })
    .setTimestamp();

  await channel.send({
    content: `${interaction.user} ${supportMentions}`,
    embeds: [embed],
    components: [controls],
    allowedMentions: { users: [interaction.user.id], roles: config.supportRoleIds },
  });

  await interaction.editReply(`Your ticket has been created: ${channel}`);
}

async function buildTranscript(channel) {
  const fetched = await channel.messages.fetch({ limit: 100 });
  const messages = [...fetched.values()].reverse();
  const lines = messages.map((message) => {
    const time = new Date(message.createdTimestamp).toISOString();
    const attachments = [...message.attachments.values()].map((item) => item.url).join(' ');
    return `[${time}] ${message.author.tag}: ${message.cleanContent}${attachments ? ` ${attachments}` : ''}`;
  });
  return Buffer.from(lines.join('\n') || 'No messages were found in this ticket.', 'utf8');
}

async function closeTicket(channel, closedBy) {
  const config = getTicketConfig();
  const details = parseTicketTopic(channel);
  const transcript = await buildTranscript(channel).catch(() => Buffer.from('Transcript unavailable.', 'utf8'));
  const logChannel = await channel.guild.channels.fetch(config.logChannelId).catch(() => null);

  if (logChannel?.isTextBased()) {
    const logEmbed = new EmbedBuilder()
      .setColor(process.env.EMBED_COLOR || '#F4B8CC')
      .setTitle('🔒 Royal Ticket Closed')
      .addFields(
        { name: 'Ticket', value: channel.name, inline: true },
        { name: 'Opened by', value: details.owner ? `<@${details.owner}>` : 'Unknown', inline: true },
        { name: 'Closed by', value: `${closedBy}`, inline: true },
        { name: 'Type', value: ticketTypes[details.type]?.label || details.type, inline: true },
      )
      .setTimestamp();

    await logChannel.send({
      embeds: [logEmbed],
      files: [new AttachmentBuilder(transcript, { name: `${channel.name}-transcript.txt` })],
      allowedMentions: { parse: [] },
    }).catch((error) => console.error('Failed to send ticket log:', error));
  }

  await channel.delete(`Ticket closed by ${closedBy.tag || closedBy.username || closedBy.id}`);
}

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
        rolesPanelCommand.toJSON(),
        ticketPanelCommand.toJSON(),
        ticketAddCommand.toJSON(),
        ticketRemoveCommand.toJSON(),
      ]);
      console.log(`Registered welcome, rules, boost perks, colour roles and ticket commands in ${guild.name}.`);
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
  if (!interaction.inGuild()) {
    await interaction.reply({
      content: 'This command can only be used inside the server.',
      ephemeral: true,
    });
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith('ticket_open_')) {
    const missing = missingTicketConfig();
    if (missing.length) {
      await interaction.reply({
        content: `Ticket setup is incomplete. Missing Render variables: ${missing.join(', ')}`,
        ephemeral: true,
      });
      return;
    }

    const typeKey = interaction.customId.replace('ticket_open_', '');
    const type = ticketTypes[typeKey] || ticketTypes.support;
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${typeKey}`)
      .setTitle(type.label);

    const reasonInput = new TextInputBuilder()
      .setCustomId('ticket_reason')
      .setLabel('How can the Royal Staff help?')
      .setPlaceholder('Please explain the situation clearly...')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
    await interaction.showModal(modal);
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
    const typeKey = interaction.customId.replace('ticket_modal_', '');
    const reason = interaction.fields.getTextInputValue('ticket_reason');
    try {
      await createTicket(interaction, typeKey, reason);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      const message = 'I could not create your ticket. Check my permissions and the ticket category/role IDs.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  if (interaction.isButton() && interaction.customId === 'ticket_claim') {
    if (!isTicketChannel(interaction.channel) || !memberIsTicketStaff(interaction.member)) {
      await interaction.reply({ content: 'Only Royal Staff can claim tickets.', ephemeral: true });
      return;
    }

    const details = parseTicketTopic(interaction.channel);
    if (details.claimedBy) {
      await interaction.reply({ content: `This ticket is already claimed by <@${details.claimedBy}>.`, ephemeral: true });
      return;
    }

    await interaction.channel.setTopic(`ticketOwner:${details.owner}|type:${details.type}|claimedBy:${interaction.user.id}`);
    const claimedRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel(`Claimed by ${interaction.user.username}`.slice(0, 80))
        .setEmoji('👑')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
    );
    await interaction.update({ components: [claimedRow] });
    await interaction.followUp({ content: `👑 ${interaction.user} has claimed this ticket.`, allowedMentions: { users: [interaction.user.id] } });
    return;
  }

  if (interaction.isButton() && interaction.customId === 'ticket_close') {
    if (!isTicketChannel(interaction.channel)) return;
    const details = parseTicketTopic(interaction.channel);
    const canClose = interaction.user.id === details.owner || memberIsTicketStaff(interaction.member);
    if (!canClose) {
      await interaction.reply({ content: 'Only the ticket owner or Royal Staff can close this ticket.', ephemeral: true });
      return;
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Yes, close it').setEmoji('🔒').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('Keep Open').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [confirmRow], ephemeral: true });
    return;
  }

  if (interaction.isButton() && interaction.customId === 'ticket_close_cancel') {
    await interaction.update({ content: 'The ticket will stay open. ♡', components: [] });
    return;
  }

  if (interaction.isButton() && interaction.customId === 'ticket_close_confirm') {
    if (!isTicketChannel(interaction.channel)) return;
    await interaction.update({ content: 'Closing this ticket and saving the transcript…', components: [] });
    await interaction.channel.send('🔒 This ticket is now closing. A transcript will be saved for staff.');
    setTimeout(() => closeTicket(interaction.channel, interaction.user).catch(console.error), 2500);
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'crown_colour_select') {
    const configuredRoles = getConfiguredColorRoles();
    const selected = interaction.values[0];
    const member = await interaction.guild.members.fetch(interaction.user.id);

    const configuredRoleIds = configuredRoles.map((role) => role.roleId);
    const removableRoleIds = configuredRoleIds.filter((roleId) => member.roles.cache.has(roleId));

    try {
      await interaction.deferReply({ ephemeral: true });

      if (removableRoleIds.length > 0) {
        await member.roles.remove(removableRoleIds, 'Member changed their Crown Selection colour');
      }

      if (selected === 'remove') {
        await interaction.editReply('Your crown colour has been removed. ♡');
        return;
      }

      const selectedRole = configuredRoles.find((role) => role.key === selected);
      if (!selectedRole) {
        await interaction.editReply('That crown colour is not configured correctly. Please tell a staff member.');
        return;
      }

      const guildRole = interaction.guild.roles.cache.get(selectedRole.roleId);
      if (!guildRole) {
        await interaction.editReply('That role could not be found. Please check its Render role ID.');
        return;
      }

      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.editReply('I need the **Manage Roles** permission before I can give colour roles.');
        return;
      }

      if (guildRole.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.editReply('My bot role must be placed above the colour roles in the server role list.');
        return;
      }

      await member.roles.add(guildRole, `Selected ${selectedRole.label} from Crown Selection`);
      await interaction.editReply(`${selectedRole.emoji} Your crown colour is now **${selectedRole.label}**.`);
    } catch (error) {
      console.error('Failed to update crown colour role:', error);
      const message = 'I could not update your colour role. Check that I have **Manage Roles** and that my bot role is above every colour role.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message).catch(() => {});
      } else {
        await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'rolespanel') {
    const configuredRoles = getConfiguredColorRoles();
    const missingRoles = getMissingColorRoleVariables();

    if (configuredRoles.length === 0) {
      await interaction.reply({
        content: `No colour roles are configured. Add the Render variables listed in the included README.`,
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.channel.send({
        embeds: [buildRolesPanelEmbed(interaction.guild)],
        components: [buildRolesPanelRow()],
        allowedMentions: { parse: [] },
      });

      await interaction.reply({
        content: missingRoles.length
          ? `The Crown Selection panel was sent. Some optional colours are hidden because these variables are missing: ${missingRoles.join(', ')}`
          : 'The Crown Selection panel was sent successfully. ♕',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Failed to run /rolespanel:', error);
      await interaction.reply({
        content: 'I could not send the role panel. Make sure I can send messages and embeds in this channel.',
        ephemeral: true,
      }).catch(() => {});
    }
    return;
  }

  if (interaction.commandName === 'ticketpanel') {
    const missing = missingTicketConfig();
    if (missing.length) {
      await interaction.reply({
        content: `Add these Render environment variables first: ${missing.join(', ')}`,
        ephemeral: true,
      });
      return;
    }
    await interaction.channel.send({
      embeds: [buildTicketPanelEmbed(interaction.guild)],
      components: buildTicketPanelRows(),
      allowedMentions: { parse: [] },
    });
    await interaction.reply({ content: 'The Royal Ticket panel was sent successfully. 👑', ephemeral: true });
    return;
  }

  if (interaction.commandName === 'ticketadd' || interaction.commandName === 'ticketremove') {
    if (!isTicketChannel(interaction.channel)) {
      await interaction.reply({ content: 'This command can only be used inside a ticket.', ephemeral: true });
      return;
    }
    if (!memberIsTicketStaff(interaction.member)) {
      await interaction.reply({ content: 'Only Royal Staff can manage ticket members.', ephemeral: true });
      return;
    }
    const target = interaction.options.getUser('member', true);
    if (interaction.commandName === 'ticketadd') {
      await interaction.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });
      await interaction.reply({ content: `💗 ${target} was added to the ticket.`, allowedMentions: { users: [target.id] } });
    } else {
      const details = parseTicketTopic(interaction.channel);
      if (target.id === details.owner) {
        await interaction.reply({ content: 'You cannot remove the ticket owner.', ephemeral: true });
        return;
      }
      await interaction.channel.permissionOverwrites.delete(target.id).catch(() => {});
      await interaction.reply({ content: `🩷 ${target.username} was removed from the ticket.` });
    }
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
