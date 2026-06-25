require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const { updateMemberRoles, ROLE_TABLE, ROLE_NAMES } = require("./roleScheduler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const WELCOME_CHANNEL_ID = "892199674193248286";
const NETO_ID = "328677561301467136";

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("meucargo")
      .setDescription("Veja há quantos dias você está na Patolândia e quando sobe de cargo!")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("testwelcome")
      .setDescription("Testa a mensagem de boas-vindas!")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("cargo")
      .setDescription("Veja os dias e o cargo de outro membro!")
      .addUserOption(option =>
        option
          .setName("membro")
          .setDescription("O membro que você quer consultar")
          .setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("comandos")
      .setDescription("Veja todos os comandos do PatoBot!")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("neto")
      .setDescription("👀")
      .toJSON()
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Comandos registrados!");
}

client.once("clientReady", async () => {
  console.log(`🦆 PatoBot online como ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error("❌ Servidor não encontrado!");
    return;
  }

  await registerCommands();

  console.log("🔍 Verificando cargos ao iniciar...");
  await updateMemberRoles(guild);

  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Verificação diária iniciada...");
    await updateMemberRoles(guild);
  });
});

// Mensagem de boas-vindas
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  await channel.send({
    content: `${member}`,
    embeds: [
      new EmbedBuilder()
        .setColor(0xFFD700)
        .setAuthor({
          name: member.user.username,
          iconURL: member.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**Bem-vindo(a)!**\nOlá ${member}, espero que você se divirta na Patolândia!\n\`ID do usuário: ${member.user.id}\``)
        .setTimestamp()
    ]
  });

  try {
    await member.roles.add("892202757270929441");
  } catch (err) {
    console.error("Erro ao atribuir cargo de boas-vindas:", err);
  }
});

// Comandos
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "testwelcome") {
    const member = interaction.member;
    const channel = interaction.channel;

    await channel.send({
      content: `${member}`,
      embeds: [
        new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({
            name: member.user.username,
            iconURL: member.user.displayAvatarURL(),
          })
          .setThumbnail(member.user.displayAvatarURL())
          .setDescription(`**Bem-vindo(a)!**\nOlá ${member}, espero que você se divirta na Patolândia!\n\`ID do usuário: ${member.user.id}\``)
          .setTimestamp()
      ]
    });

    await interaction.reply({ content: "✅ Mensagem de teste enviada!", ephemeral: true });
    return;
  }

  if (interaction.commandName === "comandos") {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle("🦆 Comandos do PatoBot")
      .setDescription("Aqui estão todos os comandos disponíveis na Patolândia!")
      .addFields(
        { name: "/meucargo", value: "Veja há quantos dias você está na Patolândia e quando sobe de cargo!" },
        { name: "/cargo @membro", value: "Veja os dias e o cargo de outro membro!" },
        { name: "/comandos", value: "Mostra essa lista de comandos!" },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (interaction.commandName === "neto") {
    await interaction.reply({ content: `<@${NETO_ID}> corno manso!` });
    return;
  }

  if (interaction.commandName === "meucargo") {
    const member = interaction.member;
    const now = Date.now();
    const daysInServer = Math.floor((now - member.joinedTimestamp) / (1000 * 60 * 60 * 24));

    const currentRole = ROLE_TABLE.find(r => daysInServer >= r.minDays);
    const nextRole = ROLE_TABLE.slice().reverse().find(r => r.minDays > daysInServer);

    const currentName = currentRole ? ROLE_NAMES[currentRole.roleId] : "Nenhum";
    const daysLeft = nextRole ? nextRole.minDays - daysInServer : null;
    const nextName = nextRole ? ROLE_NAMES[nextRole.roleId] : null;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`🦆 Evolução Patônica de ${member.user.username}`)
      .addFields(
        { name: "📅 Dias na Patolândia", value: `${daysInServer} dias`, inline: true },
        { name: "🏅 Cargo atual", value: currentName, inline: true },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    if (daysLeft && nextName) {
      embed.addFields({ name: "⏳ Próximo cargo", value: `**${nextName}** em ${daysLeft} dia(s)!` });
    } else {
      embed.addFields({ name: "👑 Status", value: "Você atingiu o topo da hierarquia patônica!" });
    }

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "cargo") {
    const user = interaction.options.getUser("membro");
    const member = await interaction.guild.members.fetch(user.id);
    const now = Date.now();
    const daysInServer = Math.floor((now - member.joinedTimestamp) / (1000 * 60 * 60 * 24));

    const currentRole = ROLE_TABLE.find(r => daysInServer >= r.minDays);
    const nextRole = ROLE_TABLE.slice().reverse().find(r => r.minDays > daysInServer);

    const currentName = currentRole ? ROLE_NAMES[currentRole.roleId] : "Nenhum";
    const daysLeft = nextRole ? nextRole.minDays - daysInServer : null;
    const nextName = nextRole ? ROLE_NAMES[nextRole.roleId] : null;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`🦆 Evolução Patônica de ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "📅 Dias na Patolândia", value: `${daysInServer} dias`, inline: true },
        { name: "🏅 Cargo atual", value: currentName, inline: true },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    if (daysLeft && nextName) {
      embed.addFields({ name: "⏳ Próximo cargo", value: `**${nextName}** em ${daysLeft} dia(s)!` });
    } else {
      embed.addFields({ name: "👑 Status", value: "Você atingiu o topo da hierarquia patônica!" });
    }

    await interaction.reply({ embeds: [embed] });
  }
});

process.on("unhandledRejection", (error) => {
  console.error("Erro não tratado:", error);
});

client.login(process.env.BOT_TOKEN);