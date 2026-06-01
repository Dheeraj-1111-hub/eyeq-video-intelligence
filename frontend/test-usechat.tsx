import React from 'react';
import { renderToString } from 'react-dom/server';
import { useChat } from '@ai-sdk/react';

function TestComponent() {
  const chat = useChat();
  console.log("USECHAT KEYS:", Object.keys(chat));
  return <div>Test</div>;
}

try {
  renderToString(React.createElement(TestComponent));
} catch (e) {
  console.error(e);
}
