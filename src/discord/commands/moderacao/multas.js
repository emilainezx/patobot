const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Multa } = require("../../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("multas")
    .setDescription("Veja o histórico de multas de um membro!")
    .addUserOption(option =>
      option.setName("membro").setDescription("O membro").setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("membro");
    const multas = await Multa.findAll({
      where: { userId: user.id },
      order: [["createdAt", "DESC"]],
      limit: 5
    });

    if (multas.length === 0) {
      await interaction.reply({ content: `✅ ${user} não tem multas registradas!`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📋 Histórico de multas de ${user.username}`)
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    for (const multa of multas) {
      embed.addFields({
        name: multa.ativa ? "🔴 Ativa" : "⚫ Encerrada",
        value: `**Motivo:** ${multa.motivo}\n**Aplicado por:** ${multa.aplicadoPor}\n**Expirou/Expira:** ${new Date(multa.expiraEm).toLocaleString("pt-BR")}`,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};