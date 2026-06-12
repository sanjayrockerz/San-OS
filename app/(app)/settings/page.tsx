"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks/use-mounted";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Tune DSA OS to the way you work." />

      <Section className="mx-auto grid max-w-3xl gap-4">
        {/* Appearance */}
        <SettingsCard title="Appearance" description="Customize how DSA OS looks on this device.">
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = mounted && theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all",
                    selected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsCard>

        {/* Profile */}
        <SettingsCard title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" defaultValue="Sanjay" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="sanjay@dsa.os" />
            </div>
          </div>
        </SettingsCard>

        {/* Study preferences */}
        <SettingsCard title="Study Preferences">
          <Row label="Daily goal" hint="Problems to solve each day" control={<Input type="number" defaultValue={5} className="w-20 text-center" />} />
          <Separator />
          <Row label="Spaced repetition" hint="Auto-schedule revision based on confidence" control={<Switch defaultChecked aria-label="Spaced repetition" />} />
          <Separator />
          <Row label="Show timer while solving" control={<Switch defaultChecked aria-label="Show timer" />} />
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard title="Notifications">
          <Row label="Daily plan reminder" hint="Every morning at 8:00 AM" control={<Switch defaultChecked aria-label="Daily reminder" />} />
          <Separator />
          <Row label="Revision due alerts" control={<Switch defaultChecked aria-label="Revision alerts" />} />
          <Separator />
          <Row label="Weekly report email" control={<Switch aria-label="Weekly report" />} />
        </SettingsCard>
      </Section>
    </PageTransition>
  );
}
