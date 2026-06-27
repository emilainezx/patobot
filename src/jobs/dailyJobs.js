const { Aniversario, Multa } = require("../database");
const { updateMemberRoles, ROLE_TABLE, ROLE_NAMES } = require("../roleScheduler");
const { gerarMensagemAniversario } = require("../functions/gerarMensagemAniversario");
const { EmbedBuilder } = require("discord.js");
const { ANIVERSARIO_CHANNEL_ID, MUTED_ROLE_ID } = require("../constants");

async function dailyJobs(guild) {
  await updateMemberRoles(guild);

  const multasExpiradas = await Multa.findAll({ where: { ativa: true } });
  for (const multa of multasExpiradas) {
    if (new Date() >= new Date(multa.expiraEm)) {
      const member = await guild.members.fetch(multa.userId).catch(() => null);
      if (member && member.roles.cache.has(MUTED_ROLE_ID)) {
        await member.roles.remove(MUTED_ROLE_ID);
      }
      await multa.update({ ativa: false });
      console.log(`🔓 Multa de ${multa.username} expirou e foi removida`);
    }
  }

  const hoje = new Date();
  const dia = hoje.getDate();
  const mes = hoje.getMonth() + 1;

  const aniversariantes = await Aniversario.findAll({ where: { dia, mes } });
  const channel = guild.channels.cache.get(ANIVERSARIO_CHANNEL_ID);

  if (channel && aniversariantes.length > 0) {
    for (const aniversariante of aniversariantes) {
      const member = await guild.members.fetch(aniversariante.userId).catch(() => null);
      if (!member) continue;

      const daysInServer = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
      const currentRole = ROLE_TABLE.find(r => daysInServer >= r.minDays);
      const cargo = currentRole ? ROLE_NAMES[currentRole.roleId] : "Filhote de Pato";

      const mensagem = await gerarMensagemAniversario(aniversariante.username, cargo);

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("🎂 Feliz Aniversário!")
        .setDescription(`${mensagem}\n\nParabéns ${member}! 🦆🎉`)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: "Patolândia • melhor servidor de todos os tempos" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }
  }
}

module.exports = { dailyJobs };