const { SlashCommandBuilder } = require("discord.js");
const { Aniversario } = require("../../../database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meuaniversario")
    .setDescription("Cadastre seu aniversário para ser parabenizado!")
    .addStringOption(option =>
      option.setName("data").setDescription("Sua data de aniversário no formato DD/MM (ex: 25/12)").setRequired(true)
    ),

  async execute(interaction) {
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
  }
};