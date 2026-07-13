const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

async function fazerBackup() {
  const data = new Date().toISOString().split("T")[0];
  const pastaBackup = path.join(process.env.HOME || "/home/ubuntu", "backups");
  const arquivo = path.join(pastaBackup, `patobot-${data}.sql`);

  if (!fs.existsSync(pastaBackup)) {
    fs.mkdirSync(pastaBackup, { recursive: true });
  }

  const url = new URL(process.env.DATABASE_URL);
  const comando = `PGPASSWORD=${url.password} pg_dump -h ${url.hostname} -U ${url.username} -d ${url.pathname.slice(1)} -f ${arquivo}`;

  return new Promise((resolve, reject) => {
    exec(comando, (err) => {
      if (err) {
        console.error("❌ Erro ao fazer backup:", err);
        reject(err);
      } else {
        console.log(`✅ Backup realizado: ${arquivo}`);

        const arquivos = fs.readdirSync(pastaBackup)
          .filter(f => f.startsWith("patobot-"))
          .sort();

        if (arquivos.length > 7) {
          const antigos = arquivos.slice(0, arquivos.length - 7);
          for (const antigo of antigos) {
            fs.unlinkSync(path.join(pastaBackup, antigo));
            console.log(`🗑️ Backup antigo removido: ${antigo}`);
          }
        }

        resolve();
      }
    });
  });
}

module.exports = { fazerBackup };