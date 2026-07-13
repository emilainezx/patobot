const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("comandos")
    .setDescription("Veja todos os comandos do PatoBot!"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle("🦆 Comandos do PatoBot")
      .setDescription("Aqui estão todos os comandos disponíveis na Patolândia!\nTem alguma sugestão de comando? Manda no <#1406831841620791417>!")
      .addFields(
        { name: "/meucargo", value: "Veja há quantos dias você está na Patolândia e quando sobe de cargo!" },
        { name: "/cargo @membro", value: "Veja os dias e o cargo de outro membro!" },
        { name: "/lagoa", value: "Veja as estatísticas da Patolândia!" },
        { name: "/meuaniversario DD/MM", value: "Cadastre seu aniversário!" },
        { name: "/aniversario @membro DD/MM", value: "Cadastre o aniversário de um membro!" },
        { name: "/multar @membro tempo motivo", value: "Aplica uma multa a um membro! (só moderação)" },
        { name: "/descultar @membro", value: "Remove a multa de um membro! (só moderação)" },
        { name: "/multas @membro", value: "Veja o histórico de multas de um membro!" },
        { name: "/comandos", value: "Mostra essa lista de comandos!" },
      )
      .setFooter({ text: "Patolândia • Melhor servidor de todos os tempos" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};