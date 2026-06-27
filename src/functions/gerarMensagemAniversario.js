async function gerarMensagemAniversario(username, cargo) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Crie uma mensagem curta e criativa de feliz aniversário para ${username}, que é ${cargo} na Patolândia, um servidor Discord temático de patos. A mensagem deve ter no máximo 2 frases, ser divertida e mencionar algo sobre patos. Responda apenas com a mensagem, sem aspas.`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

module.exports = { gerarMensagemAniversario };