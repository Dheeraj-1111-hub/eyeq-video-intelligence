import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot, X, Send, Search, Database, FileText, AlertCircle, Activity, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InvestigatorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  
  const { messages, sendMessage, status, error } = useChat({
    onError: (e) => {
      console.error("useChat error:", e);
      alert("Failed to connect to Investigator: " + e.message);
    }
  });

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || status === 'streaming' || status === 'submitted') return;
    sendMessage({ text: input }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("eyeq_jwt")}` }
    });
    setInput("");
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, isOpen, isExpanded]);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setIsOpen(true)}
              className="relative group flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_0_30px_rgba(30,212,237,0.3)] hover:shadow-[0_0_40px_rgba(30,212,237,0.5)] hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
              <Bot size={28} className="relative z-10" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed z-50 flex flex-col bg-zinc-950/90 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden rounded-2xl ${
              isExpanded 
                ? "bottom-6 right-6 left-6 top-6 md:left-auto md:w-[800px] md:top-6" 
                : "bottom-24 right-6 w-[400px] h-[600px] max-h-[80vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 text-primary rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(30,212,237,0.2)]">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-foreground">EYEQ Investigator</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Agents Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/10 rounded-md transition-colors hidden md:block"
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 hover:text-rose-400 rounded-md transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-5"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl mb-4 border border-primary/20 shadow-lg shadow-primary/10">
                    <Bot size={32} />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Autonomous Investigator</h4>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    I am a multi-agent system. Describe your objective, and I will autonomously orchestrate search, tracking, and evidence collection across the platform.
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    {[
                      "Find anyone carrying a backpack and create a case.",
                      "Investigate suspicious activity in the lobby after 6 PM."
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          sendMessage({ text: suggestion }, {
                            headers: { Authorization: `Bearer ${localStorage.getItem("eyeq_jwt")}` }
                          });
                        }}
                        className="p-2.5 text-xs text-left bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-primary/50 transition-all text-muted-foreground hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 mt-1">
                      <Bot size={14} />
                    </div>
                  )}
                  
                  <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div 
                      className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-lg ${
                        m.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-white/5 border border-white/10 text-foreground rounded-tl-sm backdrop-blur-md"
                      }`}
                    >
                      {/* Message Parts (New SDK) or Content (Old/Optimistic SDK) */}
                      {m.parts ? m.parts.map((part: any, i: number) => {
                        if (part.type === 'text') {
                          return <div key={i} className="whitespace-pre-wrap">{part.text}</div>;
                        }
                        if (part.type === 'dynamic-tool' || part.type?.startsWith('tool-')) {
                          const toolName = part.type === 'dynamic-tool' ? part.toolName : part.type.replace('tool-', '');
                          const toolCall = { ...part, toolName, toolCallId: part.toolCallId || i.toString() };
                          return (
                            <div key={toolCall.toolCallId} className="mt-3 first:mt-2">
                              <ToolCallWidget toolCall={toolCall} />
                            </div>
                          );
                        }
                        return null;
                      }) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(status === 'streaming' || status === 'submitted') && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30 animate-pulse mt-1">
                    <Bot size={14} />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-foreground rounded-tl-sm shadow-lg backdrop-blur-md flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider ml-1">Orchestrating</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-black/40 border-t border-white/10 backdrop-blur-xl">
              <form 
                id="widget-form"
                onSubmit={onSubmit} 
                className="relative flex items-center"
              >
                <input
                  className="w-full bg-white/5 border border-white/10 text-foreground rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all shadow-md"
                  value={input}
                  placeholder="Ask Investigator..."
                  onChange={(e) => setInput(e.target.value)}
                  disabled={status === 'streaming' || status === 'submitted'}
                />
                <button
                  id="widget-submit-btn"
                  type="submit"
                  disabled={(status === 'streaming' || status === 'submitted') || !input?.trim()}
                  className="absolute right-1.5 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <Send size={16} className={(status === 'streaming' || status === 'submitted') ? "animate-pulse" : ""} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ToolCallWidget({ toolCall }: { toolCall: any }) {
  const { toolName, state } = toolCall;
  const args = toolCall.args || toolCall.input;
  const result = toolCall.result || toolCall.output;
  
  let icon = <Activity size={14} />;
  let label = "Task Execution";
  let color = "text-blue-400";
  let bg = "bg-blue-400/10";
  let border = "border-blue-400/20";

  if (toolName === "search_evidence") {
    icon = <Search size={14} />;
    label = "Search Agent";
    color = "text-emerald-400";
    bg = "bg-emerald-400/10";
    border = "border-emerald-400/20";
  } else if (toolName === "track_subject") {
    icon = <Activity size={14} />;
    label = "Tracking Agent";
    color = "text-purple-400";
    bg = "bg-purple-400/10";
    border = "border-purple-400/20";
  } else if (toolName === "create_case" || toolName === "add_evidence") {
    icon = <Database size={14} />;
    label = "Investigation Agent";
    color = "text-orange-400";
    bg = "bg-orange-400/10";
    border = "border-orange-400/20";
  } else if (toolName === "generate_report") {
    icon = <FileText size={14} />;
    label = "Report Agent";
    color = "text-pink-400";
    bg = "bg-pink-400/10";
    border = "border-pink-400/20";
  } else if (toolName === "get_platform_stats") {
    icon = <AlertCircle size={14} />;
    label = "Analytics Agent";
    color = "text-cyan-400";
    bg = "bg-cyan-400/10";
    border = "border-cyan-400/20";
  }

  return (
    <div className={`p-2.5 rounded-lg border ${border} ${bg} flex flex-col gap-2 backdrop-blur-sm shadow-inner`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 font-medium text-[11px] uppercase tracking-wide ${color}`}>
          {icon}
          {label}
        </div>
        <div className="text-[10px] font-mono px-1.5 py-0.5 rounded pl-2">
          {["call", "input-streaming", "input-available"].includes(state) ? (
             <span className="flex items-center gap-1.5 text-yellow-500/80">
               <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/80 animate-pulse" />
               Processing
             </span>
          ) : (
             <span className="flex items-center gap-1.5 text-green-500/80">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500/80" />
               Complete
             </span>
          )}
        </div>
      </div>
      
      {["call", "input-streaming", "input-available"].includes(state) && args && (
        <div className="text-[10px] text-white/50 font-mono bg-black/40 p-1.5 rounded border border-white/5 break-words">
          {JSON.stringify(args).substring(0, 100)}{JSON.stringify(args).length > 100 ? "..." : ""}
        </div>
      )}
      
      {["result", "output-available"].includes(state) && result && (
        <div className="text-[10px] text-white/70 font-mono bg-black/40 p-1.5 rounded max-h-24 overflow-y-auto border border-white/5 break-words">
          {typeof result === 'object' ? JSON.stringify(result) : result}
        </div>
      )}
    </div>
  );
}
