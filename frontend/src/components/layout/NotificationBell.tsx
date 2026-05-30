import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { fetchNotifications, markNotificationAsRead } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: !!user,
    refetchInterval: 15000, // Check every 15 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-brand-cyan" />;
    }
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-zinc-800 bg-zinc-950/95 backdrop-blur shadow-2xl" align="end" alignOffset={-10}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h4 className="font-semibold text-sm text-white">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-zinc-500">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif: any) => (
                <div 
                  key={notif._id}
                  className={`p-4 border-b border-zinc-800/50 flex gap-3 transition-colors ${notif.read ? 'opacity-60' : 'bg-brand-cyan/5'}`}
                >
                  <div className="mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium leading-none ${notif.read ? 'text-zinc-300' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 shrink-0 text-zinc-500 hover:text-brand-cyan"
                      onClick={() => markAsReadMutation.mutate(notif._id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
