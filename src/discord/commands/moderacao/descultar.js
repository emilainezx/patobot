const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { Multa } = require("../../../database");
const { MUTED_ROLE_ID, COMANDOS_CHANNEL_ID, PRESIDENTE_ID, MINISTRO_ID, SENADOR_ID } = require("../../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("descultar")
    .setDescription("Remove a multa de um membro antes do prazo!")
    .addUserOption(option =>
      option.setName("membro").setDescription("O membro a ser descultado").setRequired(true)
    ),

  async execute(interaction) {
    const { roles } = interaction.member;

    if (!roles.cache.has(PRESIDENTE_ID) && !roles.cache.has(MINISTRO_ID) && !roles.cache.has(SENADOR_ID)) {
      await interaction.reply({ content: "❌ Você não tem permissão para descultar membros!", ephemeral: true });
      return;
    }

    const user = interaction.options.getUser("membro");
    const member = await interaction.guild.members.fetch(user.id);

    if (!member.roles.cache.has(MUTED_ROLE_ID)) {
      await interaction.reply({ content: `❌ ${user} não está multado!`, ephemeral: true });
      return;
    }

    await member.roles.remove(MUTED_ROLE_ID);
    await Multa.update({ ativa: false }, { where: { userId: user.id, ativa: true } });

    const channel = interaction.guild.channels.cache.get(COMANDOS_CHANNEL_ID);
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle("🔓 Multa removida!")
      .addFields(
        { name: "Membro", value: `${user}`, inline: true },
        { name: "Removido por", value: interaction.member.toString(), inline: true },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    if (channel) await channel.send({ embeds: [embed] });
    await interaction.reply({ content: `✅ Multa de ${user} removida!`, ephemeral: true });
  }
};