import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import dotenv from 'dotenv';
dotenv.config();

const result = streamText({
  model: groq('llama-3.3-70b-versatile'),
  messages: [{ role: 'user', content: 'hello' }]
});

const proto = Object.getPrototypeOf(result);
console.log("Result Keys:", Object.keys(result));
console.log("Proto Keys:", Object.getOwnPropertyNames(proto));
