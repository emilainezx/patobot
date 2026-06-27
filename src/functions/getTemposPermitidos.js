const { PRESIDENTE_ID, MINISTRO_ID, SENADOR_ID, DEPUTADO_ID } = require("../constants");

function getTemposPermitidos(member) {
  if (member.roles.cache.has(PRESIDENTE_ID)) return ["1h", "1d", "7d", "30d"];
  if (member.roles.cache.has(MINISTRO_ID)) return ["1h", "1d", "7d"];
  if (member.roles.cache.has(SENADOR_ID)) return ["1h", "1d"];
  if (member.roles.cache.has(DEPUTADO_ID)) return ["1h"];
  return [];
}

module.exports = { getTemposPermitidos };