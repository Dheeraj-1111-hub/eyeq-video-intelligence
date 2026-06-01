const { streamText } = require('ai');
const { groq } = require('@ai-sdk/groq');
require('dotenv').config();
const http = require('http');

const server = http.createServer((req, res) => {
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [{ role: 'user', content: 'hello' }]
  });
  result.pipeUIMessageStreamToResponse(res);
});

server.listen(5001, () => {
  console.log('Test server on 5001');
  fetch('http://localhost:5001', { method: 'POST' })
    .then(async response => {
      console.log('Status:', response.status);
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        process.stdout.write(Buffer.from(value).toString());
      }
      server.close();
    });
});
