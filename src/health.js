const http = require("http");

function iniciarHealthCheck() {
  const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("🦆 PatoBot online!");
  });

  server.listen(3000, () => {
    console.log("✅ Health check rodando na porta 3000");
  });
}

module.exports = { iniciarHealthCheck };