const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Multa } = require("../../../database");
const { getTemposPermitidos } = require("../../../functions/getTemposPermitidos");
const { MUTED_ROLE_ID, COMANDOS_CHANNEL_ID } = require("../../../constants");

const TEMPOS = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("multar")
    .setDescription("Aplica uma multa a um membro!")
    .addUserOption(option =>
      option.setName("membro").setDescription("O membro a ser multado").setRequired(true)
    )
    .addStringOption(option =>
      option.setName("tempo").setDescription("Duração da multa").setRequired(true)
        .addChoices(
          { name: "1 hora", value: "1h" },
          { name: "1 dia", value: "1d" },
          { name: "7 dias", value: "7d" },
          { name: "30 dias", value: "30d" },
        )
    )
    .addStringOption(option =>
      option.setName("motivo").setDescription("Motivo da multa").setRequired(true)
    ),

  async execute(interaction) {
    const temposPermitidos = getTemposPermitidos(interaction.member);

    if (temposPermitidos.length === 0) {
      await interaction.reply({ content: "❌ Você não tem permissão para multar membros!", ephemeral: true });
      return;
    }

    const tempo = interaction.options.getString("tempo");

    if (!temposPermitidos.includes(tempo)) {
      await interaction.reply({ content: `❌ Seu cargo só permite multas de: **${temposPermitidos.join(", ")}**`, ephemeral: true });
      return;
    }

    const user = interaction.options.getUser("membro");
    const motivo = interaction.options.getString("motivo");
    const member = await interaction.guild.members.fetch(user.id);

    if (member.roles.cache.has(MUTED_ROLE_ID)) {
      await interaction.reply({ content: `❌ ${user} já está multado!`, ephemeral: true });
      return;
    }

    const expiraEm = new Date(Date.now() + TEMPOS[tempo]);
    await member.roles.add(MUTED_ROLE_ID);
    await Multa.create({
      userId: user.id,
      username: user.username,
      motivo,
      aplicadoPor: interaction.user.username,
      expiraEm,
      ativa: true,
    });

    const channel = interaction.guild.channels.cache.get(COMANDOS_CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("🔇 Multa aplicada!")
      .addFields(
        { name: "Membro", value: `${user}`, inline: true },
        { name: "Duração", value: tempo, inline: true },
        { name: "Aplicado por", value: interaction.member.toString(), inline: true },
        { name: "Motivo", value: motivo },
        { name: "Expira em", value: expiraEm.toLocaleString("pt-BR") },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    if (channel) await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ ${user} foi multado por **${tempo}**!`, ephemeral: true });
  }
};