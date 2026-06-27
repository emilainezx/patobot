require("dotenv").config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require("discord.js");
const { conectarBanco } = require("./database");
const { ready } = require("./events/ready");
const { guildMemberAdd } = require("./events/guildMemberAdd");
const { interactionCreate } = require("./events/interactionCreate");
const path = require("path");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Carrega comandos automaticamente
const commandFolders = fs.readdirSync(path.join(__dirname, "discord/commands"));
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(path.join(__dirname, "discord/commands", folder)).filter(f => f.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, "discord/commands", folder, file));
    client.commands.set(command.data.name, command);
  }
}

// Registra comandos no Discord
async function registerCommands() {
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Comandos registrados!");
}

client.once("clientReady", async () => {
  await conectarBanco();
  await registerCommands();
  await ready(client);
});

client.on("guildMemberAdd", guildMemberAdd);
client.on("interactionCreate", interactionCreate);

process.on("unhandledRejection", (error) => {
  console.error("Erro não tratado:", error);
});

client.login(process.env.BOT_TOKEN);