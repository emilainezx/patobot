const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ROLE_TABLE, ROLE_NAMES } = require("../../../roleScheduler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meucargo")
    .setDescription("Veja há quantos dias você está na Patolândia e quando sobe de cargo!"),

  async execute(interaction) {
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
};