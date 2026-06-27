const { SlashCommandBuilder } = require("discord.js");
const { NETO_ID } = require("../../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("neto")
    .setDescription("👀"),

  async execute(interaction) {
    await interaction.reply({ content: `<@${NETO_ID}> corno manso!` });
  }
};