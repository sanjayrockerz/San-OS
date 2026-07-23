import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { VoiceWorkspace } from "@/components/voice/voice-workspace";

export const metadata = {
  title: "Voice OS — SanOS",
  description: "Voice-first workspace for quick notes, brain dumps, meeting recordings, and intelligent intake",
};

export default function VoicePage() {
  return (
    <PageTransition>
      <PageHeader
        title="Voice Operating System"
        description="Speak your notes, brain dumps, client syncs, or meeting reviews — parsed and routed into your Personal OS automatically."
      />
      <VoiceWorkspace />
    </PageTransition>
  );
}
