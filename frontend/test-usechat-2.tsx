import React from 'react';
import { renderToString } from 'react-dom/server';
import { useChat } from '@ai-sdk/react';

function TestComponent() {
  const chat = useChat();
  console.log("sendMessage is a", typeof chat.sendMessage);
  console.log("sendMessage toString:", chat.sendMessage?.toString());
  return <div>Test</div>;
}

try {
  renderToString(React.createElement(TestComponent));
} catch (e) {
  console.error(e);
}
