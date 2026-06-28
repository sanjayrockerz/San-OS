"use client";

import { useActionState, useEffect } from "react";

import type { Tables } from "@/types/database";
import { Constants } from "@/types/database";
import { updateClientRecord } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const E = Constants.public.Enums;

const STATUS_LABELS: Record<string, string> = {
  prospect: "Prospect",
  active: "Active",
  inactive: "Inactive",
  churned: "Churned",
};

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

interface Props {
  client: Tables<"clients">;
  onClose: () => void;
}

export function ClientEditForm({ client, onClose }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateClientRecord,
    null,
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h2 className="font-semibold">Edit Client</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <form action={action} className="p-5 space-y-4">
          <input type="hidden" name="clientId" value={client.id} />

          <div className="space-y-1.5">
            <Label className="text-xs">Client Name *</Label>
            <Input name="name" defaultValue={client.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Company</Label>
              <Input name="company" defaultValue={client.company ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Input name="industry" defaultValue={client.industry ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input name="email" type="email" defaultValue={client.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input name="phone" defaultValue={client.phone ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">WhatsApp</Label>
              <Input name="whatsapp" defaultValue={client.whatsapp ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select
                name="status"
                defaultValue={client.status}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {E.client_status.map((s) => (
                  <option key={s} value={s} className="bg-background">
                    {STATUS_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Website</Label>
            <Input name="website" type="url" defaultValue={client.website ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Textarea name="address" rows={2} defaultValue={client.address ?? ""} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Tax Info / GST</Label>
            <Input name="tax_info" defaultValue={client.tax_info ?? ""} placeholder="GSTIN" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea name="notes" rows={3} defaultValue={client.notes ?? ""} />
          </div>

          {state && !state.ok && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Saving…" : "Save Changes"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
