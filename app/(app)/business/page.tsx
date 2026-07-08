import Link from "next/link";
import type { ElementType } from "react";
import { ArrowRight, Building2, Users, Target, Wallet } from "lucide-react";

import { requireContext } from "@/lib/server/context";
import { PageTransition, Section } from "@/components/layout/page-transition";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { UniversalIntake } from "@/components/intake/universal-intake";

export default async function BusinessPage() {
  const { user, services } = await requireContext("/business");

  const [clients, projects, pipeline, finance] = await Promise.all([
    services.client.listForUser(user.id),
    services.project.listForUser(user.id),
    services.pipeline.listOpen(user.id),
    services.finance.snapshot(user.id),
  ]);

  const activeClients = clients.filter((client) => client.status === "active").length;
  const activeProjects = projects.filter((project) => project.status !== "completed" && project.status !== "archived").length;

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
        <PageHeader
          title="Business Hub"
          description="One place for clients, pipeline, finance, and quick natural-language capture."
        />

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Clients" value={clients.length} sub={`${activeClients} active`} icon={Users} href="/clients" />
          <SummaryCard label="Projects" value={projects.length} sub={`${activeProjects} active`} icon={Building2} href="/projects" />
          <SummaryCard label="Pipeline" value={pipeline.length} sub="open deals" icon={Target} href="/pipeline" />
          <SummaryCard label="Revenue" value={`₹${Math.round(finance.monthRevenue).toLocaleString("en-IN")}`} sub="this month" icon={Wallet} href="/finance" />
        </div>

        <Section>
          <div className="surface-card rounded-2xl p-5">
            <SectionHeading
              title="Business Inbox"
              action={<Link href="/projects/new" className="text-xs font-medium text-primary hover:underline">Create project</Link>}
            />
            <p className="mb-4 text-sm text-muted-foreground">
              Paste a client note, WhatsApp message, or project brief. The intake parser will classify it and route it without a model.
            </p>
            <UniversalIntake />
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: ElementType;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="lift p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
          </div>
          <span className="rounded-xl border border-border bg-muted/40 p-2 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
          Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
}
