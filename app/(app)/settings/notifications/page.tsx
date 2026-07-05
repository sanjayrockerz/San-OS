"use client";

import { useEffect, useState } from "react";
import { getKdsSettings, updateKdsSettings } from "./actions";
import { kdsAlertEngine } from "@/lib/kds/alert-engine";
import { BellRing, Volume2, Save, Activity, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    volume: 100,
    repeat_interval_sec: 10,
    is_muted: false,
    enable_browser_notifications: true,
    sound_url: "",
  });

  useEffect(() => {
    getKdsSettings().then((data) => {
      if (data) setSettings(data as any);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateKdsSettings(settings);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    kdsAlertEngine.testAlert(settings.volume, settings.sound_url);
  };

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Notification & Alert Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure how the Kitchen Display System (KDS) alerts you when new orders arrive.
        </p>
      </div>

      <div className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
        
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              {settings.is_muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />} 
              Global Mute
            </h3>
            <p className="text-sm text-muted-foreground">Disable all KDS audio alerts.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.is_muted}
              onChange={(e) => setSettings({...settings, is_muted: e.target.checked})}
            />
            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
          </label>
        </div>

        <hr className="border-border" />

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Alert Volume ({settings.volume}%)</label>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            className="w-full accent-primary"
            value={settings.volume}
            onChange={(e) => setSettings({...settings, volume: parseInt(e.target.value)})}
            disabled={settings.is_muted}
          />
        </div>

        {/* Repeat Interval */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Repeat Interval (Seconds)</label>
          <p className="text-xs text-muted-foreground">How often the alert loops until the order is acknowledged.</p>
          <input 
            type="number" 
            min="2" max="60"
            className="w-full p-2 bg-background border rounded-lg text-sm outline-none focus:border-primary"
            value={settings.repeat_interval_sec}
            onChange={(e) => setSettings({...settings, repeat_interval_sec: parseInt(e.target.value)})}
          />
        </div>

        {/* Custom Sound URL */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Custom Sound URL (Optional)</label>
          <p className="text-xs text-muted-foreground">Leave blank to use the built-in synthesized commercial POS chime.</p>
          <input 
            type="url" 
            placeholder="https://example.com/bell.mp3"
            className="w-full p-2 bg-background border rounded-lg text-sm outline-none focus:border-primary"
            value={settings.sound_url || ""}
            onChange={(e) => setSettings({...settings, sound_url: e.target.value})}
          />
        </div>

        <hr className="border-border" />

        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <BellRing className="w-4 h-4" /> Browser Notifications
            </h3>
            <p className="text-sm text-muted-foreground">Show native OS toast notifications.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.enable_browser_notifications}
              onChange={(e) => setSettings({...settings, enable_browser_notifications: e.target.checked})}
            />
            <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" onClick={handleTest} disabled={settings.is_muted} className="flex-1 border border-border">
          <Activity className="w-4 h-4 mr-2 text-primary" /> Test Notification
        </Button>
        <Button variant="default" onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
          Save Settings
        </Button>
      </div>
    </div>
  );
}
