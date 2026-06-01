const { streamText } = require('ai');
const { groq } = require('@ai-sdk/groq');
require('dotenv').config();
const { z } = require('zod');

async function main() {
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [{ role: 'user', content: 'Use the test_tool.' }],
    tools: {
      test_tool: {
        description: 'A test tool.',
        parameters: z.object({}),
        execute: async () => {
          console.log('TEST TOOL EXECUTED');
          return { ok: true };
        }
      }
    },
    maxSteps: 5
  });

  for await (const chunk of result.fullStream) {
    console.log(chunk);
  }
}
main().catch(console.error);
