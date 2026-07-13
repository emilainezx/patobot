const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ROLE_TABLE, ROLE_NAMES } = require("../../../roleScheduler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lagoa")
    .setDescription("Veja as estatísticas da Patolândia!"),

  async execute(interaction) {
    await interaction.deferReply();

    const guild = interaction.guild;
    const members = await guild.members.fetch();

    const contagem = {};
    for (const role of ROLE_TABLE) {
      contagem[role.roleId] = 0;
    }

    let semCargo = 0;

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const temCargo = ROLE_TABLE.some(r => member.roles.cache.has(r.roleId));
      if (!temCargo) {
        semCargo++;
        continue;
      }

      for (const role of ROLE_TABLE) {
        if (member.roles.cache.has(role.roleId)) {
          contagem[role.roleId]++;
          break;
        }
      }
    }

    const totalMembros = members.filter(m => !m.user.bot).size;

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle("🦆 Estatísticas da Patolândia")
      .addFields(
        { name: "👥 Total de membros", value: `${totalMembros}`, inline: true },
      )
      .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
      .setTimestamp();

    for (const role of ROLE_TABLE) {
      embed.addFields({
        name: ROLE_NAMES[role.roleId],
        value: `${contagem[role.roleId]} membro(s)`,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};