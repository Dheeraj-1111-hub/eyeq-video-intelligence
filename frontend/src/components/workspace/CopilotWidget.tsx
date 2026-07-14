import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Play } from 'lucide-react';
import { askAssistant, AssistantResponse } from '@/features/assistant/services/assistantApi';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  match?: AssistantResponse['match'];
}

export function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'I am EYEQ Copilot. What are you looking for in the footage today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askAssistant(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        match: response.match
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error connecting to the intelligence core. Please try again later.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-cyan text-black rounded-full shadow-[0_0_20px_rgba(30,212,237,0.4)] flex items-center justify-center z-50 hover:bg-brand-cyan/90 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isOpen ? 0 : 1, y: 0, pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-zinc-950/95 backdrop-blur-xl border border-brand-cyan/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-gradient-to-r from-brand-cyan/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/50">
                  <Bot className="w-4 h-4 text-brand-cyan" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">EYEQ Copilot</h3>
                  <p className="text-[10px] text-brand-cyan font-mono tracking-widest uppercase">Forensic VQA Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                    msg.role === 'assistant' 
                      ? 'bg-zinc-900 border border-brand-cyan/30 text-brand-cyan' 
                      : 'bg-zinc-800 border border-white/10 text-zinc-300'
                  }`}>
                    {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                    <div className={`px-4 py-2 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-brand-cyan text-black rounded-tr-sm font-medium'
                        : 'bg-zinc-900 border border-white/10 text-zinc-200 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.match && msg.match.thumbnail && (
                      <div className="mt-2 w-full bg-zinc-900 border border-brand-cyan/20 rounded-xl overflow-hidden shadow-lg">
                        <div className="relative aspect-video bg-black">
                          <img 
                            src={`http://localhost:8001${msg.match.thumbnail}`} 
                            alt="Evidence Match" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-brand-cyan border border-brand-cyan/20">
                            {msg.match.score > 0.8 ? 'HIGH CONFIDENCE' : 'POTENTIAL MATCH'}
                          </div>
                        </div>
                        <div className="p-3 bg-zinc-900/50">
                          <div className="text-xs font-medium text-white line-clamp-1 mb-1">{msg.match.video_filename}</div>
                          <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between mb-3">
                            <span>TIME: {msg.match.timestamp}</span>
                            <span>SCORE: {Math.round(msg.match.score * 100)}%</span>
                          </div>
                          <Button 
                            className="w-full h-8 text-xs bg-white/5 hover:bg-brand-cyan/20 hover:text-brand-cyan border border-white/10 hover:border-brand-cyan/50"
                            onClick={() => {
                              navigate({ 
                                to: '/analyze', 
                                search: { 
                                  active: msg.match?.video_id, 
                                  t: msg.match?.timestamp_seconds 
                                } 
                              });
                            }}
                          >
                            <Play className="w-3 h-3 mr-2" />
                            View in Player
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-brand-cyan/30 text-brand-cyan flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-zinc-900 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-zinc-950 border-t border-white/10">
              <div className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Copilot (e.g. 'Show me the red car')"
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-brand-cyan/50 resize-none min-h-[44px] max-h-[120px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 w-8 h-8 bg-brand-cyan/10 hover:bg-brand-cyan text-brand-cyan hover:text-black rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
