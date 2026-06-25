require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const cron = require("node-cron");
const { updateMemberRoles } = require("./roleScheduler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("clientReady", async () => {
  console.log(`🦆 PatoBot online como ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error("❌ Servidor não encontrado!");
    return;
  }

  console.log("🔍 Verificando cargos ao iniciar...");
  await updateMemberRoles(guild);

  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Verificação diária iniciada...");
    await updateMemberRoles(guild);
  });
});

process.on("unhandledRejection", (error) => {
  console.error("Erro não tratado:", error);
});

client.login(process.env.BOT_TOKEN);