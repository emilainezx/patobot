const ROLE_TABLE = [
  { minDays: 1095, roleId: "1382572204130308106" }, // Pato Místico
  { minDays: 730,  roleId: "1382554596375003156" },  // Pato Real
  { minDays: 365,  roleId: "1382554305332117514" },  // Pato Lendário
  { minDays: 180,  roleId: "1382554135039180911" },  // Pato Veloz
  { minDays: 90,   roleId: "1381805419525050428" },  // Pato Aprendiz
  { minDays: 0,    roleId: "892202757270929441"  },  // Filhote de Pato
];

const ROLE_NAMES = {
  "1382572204130308106": "Pato Místico",
  "1382554596375003156": "Pato Real",
  "1382554305332117514": "Pato Lendário",
  "1382554135039180911": "Pato Veloz",
  "1381805419525050428": "Pato Aprendiz",
  "892202757270929441":  "Filhote de Pato",
};

const ANCESTRAL_ROLE_ID = "1382569492542128239";

async function updateMemberRoles(guild) {
  const members = await guild.members.fetch();
  const now = Date.now();
  let atualizados = 0;

  for (const [, member] of members) {
    if (member.user.bot) continue;
    if (member.roles.cache.has(ANCESTRAL_ROLE_ID)) continue;

    const daysInServer = Math.floor((now - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
    const targetRole = ROLE_TABLE.find(r => daysInServer >= r.minDays);
    if (!targetRole) continue;

    const roleIds = ROLE_TABLE.map(r => r.roleId);
    const rolesToRemove = member.roles.cache.filter(
      r => roleIds.includes(r.id) && r.id !== targetRole.roleId
    );

    if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove);

    if (!member.roles.cache.has(targetRole.roleId)) {
      await member.roles.add(targetRole.roleId);
      console.log(`🦆 ${member.user.username} → cargo atualizado (${daysInServer} dias)`);
      atualizados++;
    }
  }

  console.log(`✅ Verificação concluída — ${atualizados} membro(s) atualizado(s)`);
}

module.exports = { updateMemberRoles, ROLE_TABLE, ROLE_NAMES };