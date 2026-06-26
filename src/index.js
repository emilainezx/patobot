require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cron = require("node-cron");
const { updateMemberRoles, ROLE_TABLE, ROLE_NAMES } = require("./roleScheduler");
const { Aniversario, conectarBanco } = require("./database");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const WELCOME_CHANNEL_ID = "892199674193248286";
const ANIVERSARIO_CHANNEL_ID = "893583566938726470";
const NETO_ID = "328677561301467136";

async function gerarMensagemAniversario(username, cargo) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Crie uma mensagem curta e criativa de feliz aniversário para ${username}, que é ${cargo} na Patolândia, um servidor Discord temático de patos. A mensagem deve ter no máximo 2 frases, ser divertida e mencionar algo sobre patos. Responda apenas com a mensagem, sem aspas.`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

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
        option.setName("membro").setDescription("O membro que você quer consultar").setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("comandos")
      .setDescription("Veja todos os comandos do PatoBot!")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("neto")
      .setDescription("👀")
      .toJSON(),
    new SlashCommandBuilder()
      .setName("meuaniversario")
      .setDescription("Cadastre seu aniversário para ser parabenizado!")
      .addStringOption(option =>
        option.setName("data").setDescription("Sua data de aniversário no formato DD/MM (ex: 25/12)").setRequired(true)
      )
      .toJSON(),
    new SlashCommandBuilder()
      .setName("aniversario")
      .setDescription("Cadastre o aniversário de um membro!")
      .addUserOption(option =>
        option.setName("membro").setDescription("O membro").setRequired(true)
      )
      .addStringOption(option =>
        option.setName("data").setDescription("Data no formato DD/MM (ex: 25/12)").setRequired(true)
      )
      .toJSON(),
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

  await conectarBanco();

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error("❌ Servidor não encontrado!");
    return;
  }

  await registerCommands();

  console.log("🔍 Verificando cargos ao iniciar...");
  await updateMemberRoles(guild);

  // Verificação diária de cargos e aniversários à meia-noite
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Verificação diária iniciada...");
    await updateMemberRoles(guild);

    // Verifica aniversários do dia
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;

    const aniversariantes = await Aniversario.findAll({ where: { dia, mes } });
    const channel = guild.channels.cache.get(ANIVERSARIO_CHANNEL_ID);

    if (channel && aniversariantes.length > 0) {
      for (const aniversariante of aniversariantes) {
        const member = await guild.members.fetch(aniversariante.userId).catch(() => null);
        if (!member) continue;

        const daysInServer = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
        const currentRole = ROLE_TABLE.find(r => daysInServer >= r.minDays);
        const cargo = currentRole ? ROLE_NAMES[currentRole.roleId] : "Filhote de Pato";

        const mensagem = await gerarMensagemAniversario(aniversariante.username, cargo);

        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle("🎂 Feliz Aniversário!")
          .setDescription(`${mensagem}\n\nParabéns ${member}! 🦆🎉`)
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    }
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
        .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
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
          .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
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
      .setDescription("Aqui estão todos os comandos disponíveis na Patolândia!\nTem alguma sugestão de comando? Manda no <#1406831841620791417>!")
      .addFields(
        { name: "/meucargo", value: "Veja há quantos dias você está na Patolândia e quando sobe de cargo!" },
        { name: "/cargo @membro", value: "Veja os dias e o cargo de outro membro!" },
        { name: "/meuaniversario DD/MM", value: "Cadastre seu aniversário!" },
        { name: "/aniversario @membro DD/MM", value: "Cadastre o aniversário de um membro!" },
        { name: "/comandos", value: "Mostra essa lista de comandos!" },
      )
      .setFooter({ text: "Patolândia • Melhor servidor de todos os tempos" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (interaction.commandName === "neto") {
    await interaction.reply({ content: `<@${NETO_ID}> corno manso!` });
    return;
  }

  if (interaction.commandName === "meuaniversario") {
    const data = interaction.options.getString("data");
    const partes = data.split("/");

    if (partes.length !== 2) {
      await interaction.reply({ content: "❌ Formato inválido! Use DD/MM. Ex: 25/12", ephemeral: true });
      return;
    }

    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]);

    if (isNaN(dia) || isNaN(mes) || dia < 1 || dia > 31 || mes < 1 || mes > 12) {
      await interaction.reply({ content: "❌ Data inválida! Use DD/MM. Ex: 25/12", ephemeral: true });
      return;
    }

    const existente = await Aniversario.findOne({ where: { userId: interaction.user.id } });

    if (existente) {
      await existente.update({ dia, mes, username: interaction.user.username });
      await interaction.reply({ content: `✅ Aniversário atualizado para **${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}**! 🎂`, ephemeral: true });
    } else {
      await Aniversario.create({ userId: interaction.user.id, username: interaction.user.username, dia, mes });
      await interaction.reply({ content: `✅ Aniversário **${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}** cadastrado! 🎂`, ephemeral: true });
    }
    return;
  }

  if (interaction.commandName === "aniversario") {
    const user = interaction.options.getUser("membro");
    const data = interaction.options.getString("data");
    const partes = data.split("/");

    if (partes.length !== 2) {
      await interaction.reply({ content: "❌ Formato inválido! Use DD/MM. Ex: 25/12", ephemeral: true });
      return;
    }

    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]);

    if (isNaN(dia) || isNaN(mes) || dia < 1 || dia > 31 || mes < 1 || mes > 12) {
      await interaction.reply({ content: "❌ Data inválida! Use DD/MM. Ex: 25/12", ephemeral: true });
      return;
    }

    const existente = await Aniversario.findOne({ where: { userId: user.id } });

    if (existente) {
      await existente.update({ dia, mes, username: user.username });
      await interaction.reply({ content: `✅ Aniversário de ${user} atualizado para **${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}**! 🎂`, ephemeral: true });
    } else {
      await Aniversario.create({ userId: user.id, username: user.username, dia, mes });
      await interaction.reply({ content: `✅ Aniversário de ${user} cadastrado: **${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}**! 🎂`, ephemeral: true });
    }
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