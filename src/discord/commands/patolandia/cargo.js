const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ROLE_TABLE, ROLE_NAMES } = require("../../../roleScheduler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cargo")
    .setDescription("Veja os dias e o cargo de outro membro!")
    .addUserOption(option =>
      option.setName("membro").setDescription("O membro que você quer consultar").setRequired(true)
    ),

  async execute(interaction) {
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
};