import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Search, FolderOpen, BarChart3, Settings, Upload, Eye, Cpu, Layers, Sparkles, Video, Settings2, Clock, User, Zap, Languages, Bot } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/aceternity/background-beams";
import { CardContainer, CardBody, CardItem } from "@/components/ui/aceternity/3d-card";
import { Meteors } from "@/components/ui/aceternity/meteors";
import { FloatingNode, FloatingConnectionLine } from "@/components/ui/floating-nodes";
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from "@/components/auth";
import { UploadDialog } from "@/components/workspace/UploadDialog";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/", label: "Workspace", icon: LayoutGrid },
  { to: "/search", label: "Search", icon: Search },
  { to: "/cases", label: "Cases", icon: FolderOpen },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

const titles: Record<string, string> = {
  "/": "Apartment Investigation Workspace",
  "/search": "Search",
  "/cases": "Cases",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/admin": "System Administration",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "Workspace";
  const [isSignUp, setIsSignUp] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate({ to: "/search", search: { q: searchQuery.trim() } });
    }
  };

  return (
    <>
    <UploadDialog 
      open={isUploadOpen} 
      onOpenChange={setIsUploadOpen} 
    />
    <SignedIn>
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen">
        <BackgroundBeams />
      </div>
      {/* Sidebar - Glassmorphism */}
      <aside className="fixed inset-y-0 left-0 flex w-[220px] flex-col border-r border-white/5 bg-card/60 backdrop-blur-2xl z-20 shadow-2xl h-screen">
        <div className="flex h-14 items-center gap-2 px-4 border-b border-white/5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(30,212,237,0.2)]">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase">EYEQ</span>
        </div>

        <div className="px-3 py-6 flex-1">
          <div className="px-2 pb-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
            System Menu
          </div>
          <nav className="flex flex-col gap-1.5">
            {nav.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden ${
                    active
                      ? "text-primary shadow-[0_0_15px_rgba(30,212,237,0.05)]"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {active && <div className="absolute inset-0 bg-primary/10" />}
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(30,212,237,0.5)]" />
                  )}
                  <Icon
                    className={`h-4 w-4 relative z-10 ${active ? "animate-pulse" : "opacity-70 group-hover:opacity-100 transition-opacity"}`}
                  />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
            
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden ${
                  pathname === "/admin"
                    ? "text-primary shadow-[0_0_15px_rgba(30,212,237,0.05)]"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {pathname === "/admin" && <div className="absolute inset-0 bg-primary/10" />}
                {pathname === "/admin" && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(30,212,237,0.5)]" />
                )}
                <Cpu
                  className={`h-4 w-4 relative z-10 ${pathname === "/admin" ? "animate-pulse text-brand-cyan" : "opacity-70 group-hover:opacity-100 transition-opacity"}`}
                />
                <span className="relative z-10">Administration</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-muted-foreground tracking-wider uppercase">
                  System Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col relative z-10 pl-[220px]">
        {/* Topbar - Impressive Cinematic */}
        <header className="flex h-16 items-center gap-6 border-b border-white/10 px-8 bg-black/40 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20 relative">
          {/* Subtle top highlight */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          <div className="w-[300px] shrink-0">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={title}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-[15px] font-bold text-white tracking-wide"
              >
                {title}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative flex items-center group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
              <input
                type="text"
                placeholder="Search database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleGlobalSearch}
                className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white/90 shadow-inner transition-all duration-300 focus:border-primary/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 relative z-10"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="relative group overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,hsl(var(--primary))_50%,transparent_100%)] opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-4 py-1 text-sm font-medium text-zinc-100 backdrop-blur-3xl transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-primary gap-2 shadow-[0_0_15px_rgba(30,212,237,0.15)] group-hover:shadow-[0_0_20px_rgba(30,212,237,0.3)]">
                <Upload className="h-4 w-4" />
                Upload Footage
              </span>
            </button>
            <NotificationBell />
            <div className="h-8 w-8 ml-2 flex items-center justify-center">
              <UserButton />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-hidden relative">{children}</main>
        
      </div>
    </div>
    </SignedIn>
    <SignedOut>
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-background text-foreground p-0 m-0 w-full max-w-full">
        
        {/* Left Side - Dark theme brand panel */}
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r overflow-hidden justify-between">
          <div className="absolute inset-0 bg-zinc-950" />
          
          {/* Subtle grid pattern over the dark background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff15_1px,transparent_1px),linear-gradient(to_bottom,#ffffff15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          {/* Aceternity Background Beams */}
          <BackgroundBeams className="opacity-60" />

          {/* Top Logo */}
          <div className="relative z-20 flex items-center text-lg font-medium gap-2 tracking-tight">
            <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
              <Video className="h-5 w-5 text-primary" />
            </div>
            EYEQ Video Intelligence
          </div>
          
          {/* Central Eye/Scanner Animation to fill empty space */}
          <div className="relative z-20 flex flex-col items-center justify-center flex-1 w-full my-12 pointer-events-none">
             <div className="relative w-64 h-64 flex items-center justify-center">
                {/* Outer Ring */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-primary/20 border-dashed"
                />
                
                {/* Middle Ring */}
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-8 rounded-full border-2 border-primary/10 border-t-primary/50"
                />

                {/* Inner Glow */}
                <div className="absolute inset-16 rounded-full bg-primary/5 blur-xl" />

                {/* Center Icon */}
                <div className="relative bg-zinc-950 border border-primary/20 w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.2)] backdrop-blur-md">
                   <Eye className="w-8 h-8 text-primary animate-pulse" />
                </div>

                {/* Floating "Detected" Badges */}
                <motion.div 
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 -right-12 bg-zinc-900/80 border border-white/10 px-3 py-1.5 rounded-md text-[10px] font-mono backdrop-blur-sm flex items-center gap-1.5 shadow-xl"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PERSON DETECTED
                </motion.div>

                <motion.div 
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 -left-16 bg-zinc-900/80 border border-white/10 px-3 py-1.5 rounded-md text-[10px] font-mono backdrop-blur-sm flex items-center gap-1.5 shadow-xl"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  RESTRICTED ZONE
                </motion.div>
             </div>
             
             <div className="mt-8 text-center max-w-sm">
                <div className="text-primary font-mono text-xs mb-2 tracking-widest uppercase">System Active</div>
                <div className="text-zinc-500 text-sm leading-relaxed">Processing live video feeds across 1,200+ connected camera nodes with sub-second latency.</div>
             </div>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-20 mt-auto mb-8">
            <blockquote className="space-y-2">
              <p className="text-lg text-zinc-300 leading-relaxed font-serif italic">
                &ldquo;The ability to search through terabytes of raw security footage using simple natural language has reduced our investigation times from weeks to literally minutes.&rdquo;
              </p>
              <footer className="text-sm text-zinc-500 font-medium tracking-wide uppercase">Director of Security Operations</footer>
            </blockquote>
          </div>
        </div>
        
        {/* Right Side - Form */}
        <div className="p-4 lg:p-8 flex items-center justify-center h-full w-full bg-black">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
             
             {/* Mobile Logo Fallback */}
             <div className="flex lg:hidden items-center justify-center gap-2 mb-4 text-lg font-medium tracking-tight text-white">
                <Video className="h-5 w-5 text-cyan-500" />
                EYEQ Video Intelligence
             </div>

             {isSignUp ? (
               <SignUp onToggleMode={() => setIsSignUp(false)} />
             ) : (
               <SignIn onToggleMode={() => setIsSignUp(true)} />
             )}

             
             <p className="px-8 text-center text-sm text-muted-foreground mt-4">
               By clicking continue, you agree to our{" "}
               <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                 Terms of Service
               </a>{" "}
               and{" "}
               <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                 Privacy Policy
               </a>
               .
             </p>
          </div>
        </div>
      </div>
    </SignedOut>
    </>
  );
}
