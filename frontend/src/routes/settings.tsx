import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";

// Shadcn UI Imports
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/services/analyticsApi"; // Wait, I put settingsApi in its own file.
import { settingsApi as settingsApiActual } from "@/services/settingsApi";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — EYEQ" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApiActual.fetchSettings,
  });

  // Local state for smooth slider dragging before backend commit
  const [localDetection, setLocalDetection] = useState(0.5);
  const [localReid, setLocalReid] = useState(0.85);
  const [localSearch, setLocalSearch] = useState(0.7);

  // Sync local sliders when real settings load or update
  useEffect(() => {
    if (settings) {
      setLocalDetection(settings.detectionThreshold);
      setLocalReid(settings.reidThreshold);
      setLocalSearch(settings.searchThreshold);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApiActual.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: settingsApiActual.updateProfile,
    onSuccess: () => {
      // Update global context so header/sidebar refresh immediately
      updateUser({ name: profileName });
      setProfilePassword("");
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
  });

  const deleteStorageMutation = useMutation({
    mutationFn: settingsApiActual.deleteStorage,
    onSuccess: (data) => {
      alert(data.message);
    }
  });

  if (isLoading || !settings) {
    return <div className="p-8 text-zinc-500">Loading settings...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/5 border border-white/10 shadow-sm">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how EYEQ indexes and stores your footage.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* SECTION 1: PROFILE */}
        <Section title="Profile Settings" subtitle="Manage your account credentials">
          <Row label="Full Name" hint="Your display name in the workspace.">
            <Input 
              type="text" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-[250px] bg-black/40 border-white/10" 
            />
          </Row>
          <Row label="New Password" hint="Leave blank to keep your current password.">
            <Input 
              type="password" 
              value={profilePassword}
              onChange={(e) => setProfilePassword(e.target.value)}
              className="w-[250px] bg-black/40 border-white/10" 
              placeholder="••••••••"
            />
          </Row>
          <div className="flex justify-end items-center gap-4 p-4 border-t border-white/5">
            {profileSuccess && (
              <span className="text-sm font-medium text-brand-emerald">
                Profile updated successfully
              </span>
            )}
            <Button 
              size="sm"
              variant="outline"
              className="border-white/10"
              onClick={() => updateProfileMutation.mutate({ name: profileName, password: profilePassword })}
              disabled={updateProfileMutation.isPending}
            >
              Update Profile
            </Button>
          </div>
        </Section>

        {/* SECTION 2: AI CONFIGURATION */}
        <Section 
          title="Artificial Intelligence" 
          subtitle="Tuning for detection and indexing"
          action={
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/10 text-xs text-zinc-400 hover:text-white"
              onClick={() => {
                if (window.confirm("Reset all AI thresholds to their default values?")) {
                  updateSettingsMutation.mutate({
                    detectionThreshold: 0.5,
                    reidThreshold: 0.85,
                    searchThreshold: 0.7
                  });
                }
              }}
              disabled={updateSettingsMutation.isPending}
            >
              Reset to Defaults
            </Button>
          }
        >
          <Row
            label="YOLO Detection Confidence"
            hint={`${Math.round(localDetection * 100)}% — below this threshold, object detections are dropped.`}
          >
            <Slider
              value={[localDetection * 100]}
              min={10}
              max={99}
              step={1}
              onValueChange={(val) => setLocalDetection(val[0] / 100)}
              onValueCommit={(val) => {
                updateSettingsMutation.mutate({ detectionThreshold: val[0] / 100 });
              }}
              className="w-full [&_[role=slider]]:bg-brand-cyan [&>span:first-child]:bg-brand-cyan/20 [&_[role=slider]]:border-brand-cyan"
            />
          </Row>
          <Row
            label="Re-ID Verification Threshold"
            hint={`${Math.round(localReid * 100)}% — strictness for cross-camera person tracking.`}
          >
            <Slider
              value={[localReid * 100]}
              min={50}
              max={99}
              step={1}
              onValueChange={(val) => setLocalReid(val[0] / 100)}
              onValueCommit={(val) => {
                updateSettingsMutation.mutate({ reidThreshold: val[0] / 100 });
              }}
              className="w-full [&_[role=slider]]:bg-brand-purple [&>span:first-child]:bg-brand-purple/20 [&_[role=slider]]:border-brand-purple"
            />
          </Row>
          <Row
            label="Semantic Search Match Limit"
            hint={`${Math.round(localSearch * 100)}% — strictness for text-to-video natural language queries.`}
          >
            <Slider
              value={[localSearch * 100]}
              min={30}
              max={99}
              step={1}
              onValueChange={(val) => setLocalSearch(val[0] / 100)}
              onValueCommit={(val) => {
                updateSettingsMutation.mutate({ searchThreshold: val[0] / 100 });
              }}
              className="w-full [&_[role=slider]]:bg-brand-emerald [&>span:first-child]:bg-brand-emerald/20 [&_[role=slider]]:border-brand-emerald"
            />
          </Row>
        </Section>

        {/* SECTION 3: NOTIFICATIONS */}
        <Section title="Notification Preferences" subtitle="When should EYEQ alert you?">
          <Row label="Processing Complete" hint="Alert when a video has finished AI indexing.">
            <Switch 
              checked={settings.notifications?.processingComplete ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications: { ...settings.notifications, processingComplete: checked } })}
              className="data-[state=checked]:bg-brand-cyan" 
            />
          </Row>
          <Row label="Case Updates" hint="Alert when evidence is added to your case.">
            <Switch 
              checked={settings.notifications?.caseUpdates ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications: { ...settings.notifications, caseUpdates: checked } })}
              className="data-[state=checked]:bg-brand-cyan" 
            />
          </Row>
          <Row label="Report Generated" hint="Alert when a PDF brief is ready for download.">
            <Switch 
              checked={settings.notifications?.reportGenerated ?? true}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ notifications: { ...settings.notifications, reportGenerated: checked } })}
              className="data-[state=checked]:bg-brand-cyan" 
            />
          </Row>
        </Section>

        {/* SECTION 4: STORAGE MANAGEMENT */}
        <Section title="Storage & Retention" subtitle="Manage your workspace footprints">
          <Row
            label="Retention policy"
            hint="Auto-delete old footage to save space."
          >
            <Select 
              value={settings.retentionPolicy} 
              onValueChange={(val) => updateSettingsMutation.mutate({ retentionPolicy: val })}
            >
              <SelectTrigger className="w-[200px] bg-black/40 border-white/10">
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="forever">Keep Forever</SelectItem>
              </SelectContent>
            </Select>
          </Row>
          <Row label="Clear Video Storage" hint="Irreversibly delete all your uploaded videos and detections.">
            <Button variant="destructive" size="sm" onClick={() => {
              if (window.confirm("Are you absolutely sure you want to delete all videos? This cannot be undone.")) {
                deleteStorageMutation.mutate("videos");
              }
            }}>Delete All Videos</Button>
          </Row>
          <Row label="Clear Case Files" hint="Irreversibly delete all cases and evidence logs.">
            <Button variant="destructive" size="sm" onClick={() => {
              if (window.confirm("Are you absolutely sure you want to delete all case files? This cannot be undone.")) {
                deleteStorageMutation.mutate("cases");
              }
            }}>Delete All Cases</Button>
          </Row>
        </Section>

        {/* SECTION 5: SECURITY */}
        <Section title="Security" subtitle="Active sessions and access controls">
          <Row label="Current Role" hint="Your RBAC permission level.">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/10 text-white rounded text-xs font-mono capitalize">
                {user?.role}
              </span>
            </div>
          </Row>
          <Row label="Active Session" hint="End your current secure session.">
            <Button variant="outline" size="sm" className="border-white/10 text-zinc-300" onClick={logout}>
              Log out of EYEQ
            </Button>
          </Row>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="border-b border-white/5 px-6 py-5 bg-background/50 flex justify-between items-center gap-4">
        <div>
          <div className="text-base font-semibold text-white/90">{title}</div>
          {subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] items-center gap-6 px-6 py-5 transition-colors hover:bg-white/[0.02]">
      <div>
        <div className="text-sm font-medium text-white/80">{label}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex justify-end md:justify-start">{children}</div>
    </div>
  );
}
