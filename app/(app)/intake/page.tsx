import { Brain } from "lucide-react";
import { UniversalIntake } from "@/components/intake/universal-intake";

export const metadata = {
  title: "Intake — SanOS",
  description: "Universal natural-language intake for SanOS",
};

export default function IntakePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="size-6 text-primary" />
        </div>
        <h1 className="text-xl font-semibold">What&apos;s on your mind?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe anything — I&apos;ll auto-detect projects, clients, concepts, and save to the right place.
        </p>
      </div>
      <UniversalIntake />
    </div>
  );
}
