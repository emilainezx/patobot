const cooldowns = new Map();

async function interactionCreate(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  // Rate limiting — máximo 3 usos por comando a cada 10 segundos por usuário
  const key = `${interaction.user.id}-${interaction.commandName}`;
  const now = Date.now();
  const cooldownTime = 10 * 1000;
  const maxUses = 3;

  if (!cooldowns.has(key)) {
    cooldowns.set(key, { count: 1, firstUse: now });
  } else {
    const data = cooldowns.get(key);

    if (now - data.firstUse > cooldownTime) {
      cooldowns.set(key, { count: 1, firstUse: now });
    } else {
      data.count++;
      if (data.count > maxUses) {
        const tempoRestante = Math.ceil((cooldownTime - (now - data.firstUse)) / 1000);
        await interaction.reply({
          content: `⏳ Você está usando esse comando rápido demais! Aguarde **${tempoRestante}s**.`,
          ephemeral: true
        });
        return;
      }
    }
  }

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