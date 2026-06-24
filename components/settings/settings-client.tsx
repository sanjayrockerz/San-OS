"use client";

import { useActionState, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks/use-mounted";
import { Constants, type Tables } from "@/types/database";
import { updatePreferences, type ActionResult } from "@/app/(app)/settings/actions";
import { FOCUS_MODE_LABEL, REMINDER_CATEGORY_LABEL } from "@/lib/design/status";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  hint,
  control,
}: {
  label: string;
  hint?: string;
  control: React.ReactNode;
}) {
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

/** A Switch paired with a hidden input so its state posts in a server-action form. */
function ToggleField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  return (
    <Row
      label={label}
      hint={hint}
      control={
        <>
          <input type="hidden" name={name} value={checked ? "on" : "off"} />
          <Switch defaultChecked={defaultChecked} onCheckedChange={setChecked} aria-label={label} />
        </>
      }
    />
  );
}

interface Props {
  preferences: Tables<"user_preferences"> | null;
  profile: { displayName: string; email: string };
}

const initialResult: ActionResult | null = null;

export function SettingsClient({ preferences, profile }: Props) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [result, action, pending] = useActionState(updatePreferences, initialResult);
  const [focusMode, setFocusMode] = useState(preferences?.default_focus_mode ?? "none");

  const focusModes = Constants.public.Enums.focus_mode;
  const categories = Constants.public.Enums.reminder_category;
  const hidden = new Set(preferences?.hidden_categories ?? []);

  return (
    <PageTransition>
      <PageHeader title="Settings" description="Tune SanOS to the way you work." />

      <Section className="mx-auto grid max-w-3xl gap-4">
        {/* Appearance */}
        <SettingsCard title="Appearance" description="Customize how SanOS looks on this device.">
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

        <form action={action} className="grid gap-4">
          {/* Notifications */}
          <SettingsCard title="Notifications" description="What SanOS surfaces, and how.">
            <ToggleField
              name="notificationsEnabled"
              label="Enable notifications"
              hint="Reminders, revisions, and assignments appear in the Notification Center"
              defaultChecked={preferences?.notifications_enabled ?? true}
            />
            <Separator />
            <ToggleField
              name="dailyBriefEnabled"
              label="Daily Brief"
              hint="A morning summary of today's focus"
              defaultChecked={preferences?.daily_brief_enabled ?? true}
            />
            <Separator />
            <ToggleField
              name="eveningReviewEnabled"
              label="Evening Review"
              hint="An end-of-day summary of what got done"
              defaultChecked={preferences?.evening_review_enabled ?? true}
            />
          </SettingsCard>

          {/* Reminder Preferences */}
          <SettingsCard
            title="Reminder Preferences"
            description="Quiet hours suppress new notifications, without cancelling them."
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quietHoursStart">Quiet hours start</Label>
                <Input
                  id="quietHoursStart"
                  name="quietHoursStart"
                  type="time"
                  defaultValue={preferences?.quiet_hours_start ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quietHoursEnd">Quiet hours end</Label>
                <Input
                  id="quietHoursEnd"
                  name="quietHoursEnd"
                  type="time"
                  defaultValue={preferences?.quiet_hours_end ?? ""}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Manage individual reminders on the{" "}
              <a href="/notifications" className="text-primary underline">
                Notifications
              </a>{" "}
              page.
            </p>
          </SettingsCard>

          {/* Focus Modes */}
          <SettingsCard
            title="Focus Modes"
            description="Your default lens for the dashboard — filters the battle plan, recommendations, and assignments."
          >
            <input type="hidden" name="defaultFocusMode" value={focusMode} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {focusModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFocusMode(mode)}
                  className={cn(
                    "rounded-xl border p-3 text-sm font-medium transition-all",
                    focusMode === mode
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {FOCUS_MODE_LABEL[mode] ?? mode}
                </button>
              ))}
            </div>
          </SettingsCard>

          {/* Privacy */}
          <SettingsCard
            title="Privacy"
            description="Hide categories app-wide — they're excluded regardless of focus mode."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {categories.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="hiddenCategories"
                    value={c}
                    defaultChecked={hidden.has(c)}
                    className="size-4 rounded border-input"
                  />
                  {REMINDER_CATEGORY_LABEL[c] ?? c}
                </label>
              ))}
            </div>
          </SettingsCard>

          {result && !result.ok && <p className="text-sm text-danger">{result.error}</p>}

          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending ? "Saving…" : "Save Settings"}
          </Button>
        </form>

        {/* Profile */}
        <SettingsCard title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Display name</p>
              <p className="text-sm font-medium capitalize">{profile.displayName}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Managed by your account provider.
          </p>
        </SettingsCard>
      </Section>
    </PageTransition>
  );
}
