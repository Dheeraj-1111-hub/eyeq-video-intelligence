import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, BrainCircuit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export function InvestigatorPanel() {
  const [open, setOpen] = useState(false);
  const { token } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "http://localhost:5000/api/investigator/chat",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl border-primary/20 bg-background/80 backdrop-blur-lg hover:bg-primary/10 transition-all duration-500 hover:scale-105 z-50 group"
        >
          <BrainCircuit className="h-6 w-6 text-primary group-hover:animate-pulse" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col border-l border-primary/10 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-4 border-b border-primary/10 bg-muted/30">
          <SheetTitle className="flex items-center gap-2 font-orbitron tracking-wider">
            <BrainCircuit className="h-5 w-5 text-primary" />
            Autonomous Investigator
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-col gap-4 pb-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground mt-20">
                <div className="p-4 rounded-full bg-primary/10">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <div className="max-w-[280px]">
                  <p className="font-semibold text-foreground mb-1">EYEQ Copilot Online</p>
                  <p className="text-sm">I can search footage, track subjects, and build cases automatically. What would you like to investigate?</p>
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  m.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                  m.role === "user" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-lg p-3 text-sm",
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted/50 border border-border"
                )}>
                  {/* Handle text content */}
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  
                  {/* Handle tool invocations/results */}
                  {m.toolInvocations?.map((tool) => (
                    <Card key={tool.toolCallId} className="mt-2 p-3 bg-background/50 border-primary/20 text-xs flex flex-col gap-2">
                      <div className="font-semibold flex items-center gap-2 text-primary">
                        <BrainCircuit className="h-3 w-3" />
                        Executing: {tool.toolName}
                      </div>
                      <div className="text-muted-foreground truncate">
                        Args: {JSON.stringify(tool.args)}
                      </div>
                      {'result' in tool && (
                        <div className="text-emerald-500 font-medium truncate">
                          Result: {JSON.stringify(tool.result)}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4 text-muted-foreground animate-pulse" />
                </div>
                <div className="rounded-lg p-3 bg-muted/50 border border-border flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                  <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the investigator to track a subject..."
              className="flex-1 border-primary/20 focus-visible:ring-primary/30"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
