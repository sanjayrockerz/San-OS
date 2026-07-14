import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { FocusTimerWidget } from "@/components/dashboard/focus-timer-widget";

export default async function FocusPage() {
  await requireContext("/focus");
  return <PageTransition><div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:px-6"><PageHeader title="Focus Timer" description="Start a calm, distraction-free work session." /><FocusTimerWidget focusMode="none" /></div></PageTransition>;
}
