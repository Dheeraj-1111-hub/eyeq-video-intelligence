const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ userId: '6659af83b54784de880c51b7', role: 'admin' }, process.env.JWT_SECRET || 'eyeq-super-secret-jwt-key-2026', { expiresIn: '7d' });

fetch('http://localhost:5000/api/agent/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Give me a summary of the platforms current active cases.' }]
  })
}).then(async res => {
  console.log('Status:', res.status);
  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    process.stdout.write(Buffer.from(value).toString());
  }
}).catch(console.error);
