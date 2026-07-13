const { updateMemberRoles } = require("../roleScheduler");
const { dailyJobs } = require("../jobs/dailyJobs");
const { iniciarHealthCheck } = require("../health");
const cron = require("node-cron");

async function ready(client) {
  console.log(`🦆 PatoBot online como ${client.user.tag}`);

  iniciarHealthCheck();

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error("❌ Servidor não encontrado!");
    return;
  }

  console.log("🔍 Verificando cargos ao iniciar...");
  await updateMemberRoles(guild);

  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Verificação diária iniciada...");
    await dailyJobs(guild);
  });
}

module.exports = { ready };