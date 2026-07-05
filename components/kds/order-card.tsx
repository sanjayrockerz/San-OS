"use client";

import { Check, Clock, Info } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface KDSOrder {
  id: string;
  customer_name: string | null;
  items: any[];
  total_amount: number | null;
  status: "pending" | "acknowledged" | "completed" | "cancelled";
  created_at: string;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function OrderCard({ 
  order, 
  onAcknowledge, 
  onComplete 
}: { 
  order: KDSOrder;
  onAcknowledge: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  const isPending = order.status === "pending";

  return (
    <div className={`
      relative p-5 rounded-2xl border transition-all duration-500 overflow-hidden shadow-sm
      ${isPending ? 'bg-amber-500/10 border-amber-500/50 scale-[1.02] shadow-amber-500/20' : 'bg-card border-border'}
    `}>
      {isPending && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-red-500 animate-pulse" />
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {order.customer_name || "Guest Order"}
          </h3>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(order.created_at)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold bg-secondary px-2 py-1 rounded-md">
            #{order.id.slice(0, 4).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-6 min-h-[80px]">
        {order.items && order.items.length > 0 ? (
          order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="font-medium">{item.quantity || 1}x {item.name}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground italic">No items listed</div>
        )}
      </div>

      <div className="pt-4 border-t flex items-center justify-between mt-auto">
        <span className="font-bold text-foreground">
          ${order.total_amount ? Number(order.total_amount).toFixed(2) : "0.00"}
        </span>
        
        {isPending ? (
          <Button 
            onClick={() => onAcknowledge(order.id)} 
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg animate-pulse h-10 px-6 font-bold"
          >
            Acknowledge
          </Button>
        ) : (
          <Button 
            onClick={() => onComplete(order.id)} 
            variant="outline" 
            className="h-10 px-6"
          >
            <Check className="w-4 h-4 mr-2" /> Complete
          </Button>
        )}
      </div>
    </div>
  );
}
