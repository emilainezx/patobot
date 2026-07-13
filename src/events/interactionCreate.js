async function interactionCreate(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Erro no comando ${interaction.commandName}:`, err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Ocorreu um erro ao executar esse comando!", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Ocorreu um erro ao executar esse comando!", ephemeral: true });
    }
  }
}

module.exports = { interactionCreate };