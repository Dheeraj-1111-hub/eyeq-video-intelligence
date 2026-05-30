import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, 
  Database, 
  HardDrive, 
  Users, 
  Film, 
  Briefcase, 
  Activity, 
  AlertCircle
} from "lucide-react";
import { fetchAdminMetrics, fetchAdminStorage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

// Shadcn UI Imports
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "System Administration — EYEQ" }] }),
  component: AdminDashboard,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: fetchAdminMetrics,
    enabled: user?.role === "admin",
    refetchInterval: 10000,
  });

  const { data: storage, isLoading: isLoadingStorage } = useQuery({
    queryKey: ["admin", "storage"],
    queryFn: fetchAdminStorage,
    enabled: user?.role === "admin",
    refetchInterval: 30000,
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
        <ShieldAlert className="h-12 w-12 mb-4 text-zinc-700" />
        <h2 className="text-lg font-semibold text-zinc-300">Access Denied</h2>
        <p className="text-sm">You must be an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background/95">
      <div className="p-6 border-b border-zinc-800/60 bg-zinc-950/50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-brand-cyan" />
            System Administration
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time infrastructure monitoring and audit logs.</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Film className="h-4 w-4" /> Total Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {isLoadingMetrics ? "..." : metrics?.metrics?.videos || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {isLoadingMetrics ? "..." : metrics?.metrics?.cases || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" /> Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {isLoadingMetrics ? "..." : metrics?.metrics?.users || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/40 border-zinc-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <HardDrive className="h-16 w-16 text-brand-cyan" />
              </div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs font-medium text-brand-cyan uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-4 w-4" /> Total Storage Used
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-white">
                  {isLoadingStorage ? "..." : formatBytes(storage?.totalSizeBytes || 0)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Uploads: {formatBytes(storage?.uploadsSizeBytes || 0)} • Thumbnails: {formatBytes(storage?.thumbnailsSizeBytes || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Audit Logs */}
          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-brand-cyan" /> 
                Live Audit Logs
              </CardTitle>
              <CardDescription>Real-time feed of system activity and user actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                {isLoadingMetrics ? (
                  <div className="flex items-center text-zinc-500">Loading logs...</div>
                ) : metrics?.activity?.length === 0 ? (
                  <div className="flex items-center text-zinc-500 gap-2">
                    <AlertCircle className="h-4 w-4" /> No recent activity found.
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-zinc-800 before:via-zinc-800 before:to-transparent">
                    {metrics?.activity?.map((log: any) => (
                      <div key={log._id} className="relative flex gap-4 items-start pl-8">
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-background bg-brand-cyan" />
                        <div className="flex-1 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-white">{log.action}</span>
                            <span className="text-xs text-zinc-500 font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400">
                            User: <span className="text-zinc-300">{log.userId?.name || "Unknown"} ({log.userId?.email || "N/A"})</span>
                          </div>
                          {log.resourceId && (
                            <div className="text-xs text-zinc-400 mt-1">
                              Resource: <span className="font-mono bg-zinc-900 px-1 rounded">{log.resourceId}</span>
                            </div>
                          )}
                          {log.metadata && (
                            <pre className="mt-2 text-[10px] text-zinc-500 bg-zinc-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  );
}
