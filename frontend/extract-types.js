const fs = require('fs');
const dts = fs.readFileSync('node_modules/@ai-sdk/react/dist/index.d.ts', 'utf8');

const useChatOptionsMatch = dts.match(/type UseChatOptions<.*?> = ([\s\S]*?);/);
if (useChatOptionsMatch) {
  console.log("UseChatOptions:");
  console.log(useChatOptionsMatch[0]);
}

const chatInitMatch = dts.match(/type ChatInit<.*?> = ([\s\S]*?);/);
if (chatInitMatch) {
  console.log("ChatInit:");
  console.log(chatInitMatch[0]);
}
