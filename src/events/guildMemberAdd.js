const { EmbedBuilder } = require("discord.js");
const { WELCOME_CHANNEL_ID } = require("../constants");

async function guildMemberAdd(member) {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  await channel.send({
    content: `${member}`,
    embeds: [
      new EmbedBuilder()
        .setColor(0xFFD700)
        .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**Bem-vindo(a)!**\nOlá ${member}, espero que você se divirta na Patolândia!\n\`ID do usuário: ${member.user.id}\``)
        .setTimestamp()
    ]
  });

  try {
    await member.roles.add(process.env.FILHOTE_ROLE_ID);
  } catch (err) {
    console.error("Erro ao atribuir cargo de boas-vindas:", err);
  }
}

module.exports = { guildMemberAdd };