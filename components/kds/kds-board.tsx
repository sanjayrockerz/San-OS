"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { kdsAlertEngine } from "@/lib/kds/alert-engine";
import { OrderCard, type KDSOrder } from "./order-card";
import { getKdsSettings } from "@/app/(app)/settings/notifications/actions";
import { AlertTriangle, ChefHat, LayoutGrid } from "lucide-react";

export function KDSBoard({ initialOrders }: { initialOrders: KDSOrder[] }) {
  const [orders, setOrders] = useState<KDSOrder[]>(initialOrders);
  const [isFlashing, setIsFlashing] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    getKdsSettings().then((data) => {
      setSettings(data);
      // Failsafe: if there are pending unacknowledged orders on mount, start alert
      if (initialOrders.some(o => o.status === "pending") && data && !data.is_muted) {
        kdsAlertEngine.startAlert(data.volume, data.repeat_interval_sec, data.sound_url);
        setIsFlashing(true);
      }
    });

    // Subscribe to realtime orders
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as KDSOrder;
          setOrders((prev) => [newOrder, ...prev]);
          
          if (settings && !settings.is_muted) {
            kdsAlertEngine.startAlert(settings.volume, settings.repeat_interval_sec, settings.sound_url);
          } else if (!settings) {
            kdsAlertEngine.startAlert(100, 10, null); // safe fallback
          }
          
          setIsFlashing(true);
          
          // Browser Notification
          if (settings?.enable_browser_notifications && Notification.permission === "granted") {
            new Notification("NEW ORDER ALERT", {
              body: `Order #${newOrder.id.slice(0,4).toUpperCase()} just arrived!`,
              icon: "/icon.png"
            });
          }
        }
      )
      .subscribe();

    // Ask for browser notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
      kdsAlertEngine.stopAlert();
    };
  }, [supabase, initialOrders, settings]);

  const handleAcknowledge = async (id: string) => {
    // Optimistic UI update
    setOrders((prev) => 
      prev.map(o => o.id === id ? { ...o, status: "acknowledged" } : o)
    );

    // If no more pending orders, stop alarms
    const remainingPending = orders.filter(o => o.id !== id && o.status === "pending").length;
    if (remainingPending === 0) {
      kdsAlertEngine.stopAlert();
      setIsFlashing(false);
    }

    // Persist
    await (supabase as any).from("orders").update({ 
      status: "acknowledged",
      acknowledged_at: new Date().toISOString()
    }).eq("id", id);
  };

  const handleComplete = async (id: string) => {
    setOrders((prev) => prev.filter(o => o.id !== id));
    await (supabase as any).from("orders").update({ 
      status: "completed",
      completed_at: new Date().toISOString()
    }).eq("id", id);
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <>
      {/* Global Visual Flash */}
      <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-300 ${isFlashing ? 'bg-red-500/20 animate-pulse' : 'opacity-0'}`} />

      {/* Slide-down Banner */}
      <div className={`fixed top-0 left-0 w-full bg-red-600 text-white p-3 text-center font-bold tracking-widest shadow-xl transform transition-transform duration-500 z-40 flex items-center justify-center gap-2 ${pendingCount > 0 ? 'translate-y-0' : '-translate-y-full'}`}>
        <AlertTriangle className="w-5 h-5 animate-bounce" />
        {pendingCount} UNACKNOWLEDGED ORDER{pendingCount !== 1 ? 'S' : ''} PENDING
        <AlertTriangle className="w-5 h-5 animate-bounce" />
      </div>

      <div className="flex flex-col h-full space-y-6 pt-10 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-foreground">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground font-medium">
                Active Orders: {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Board Grid */}
        <div className="flex-1 min-h-0 bg-secondary/30 rounded-3xl p-6 border overflow-y-auto">
          {orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
              <LayoutGrid className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-medium">Kitchen is clear</h3>
              <p>Waiting for new orders to arrive...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
              {orders.map((order) => (
                <div key={order.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <OrderCard 
                    order={order} 
                    onAcknowledge={handleAcknowledge}
                    onComplete={handleComplete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
