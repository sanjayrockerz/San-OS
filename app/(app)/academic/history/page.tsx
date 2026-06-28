import { requireContext } from "@/lib/server/context";
import { PageTransition } from "@/components/layout/page-transition";
import { PageHeader } from "@/components/layout/page-header";
import { AcademicHistoryClient } from "@/components/academic/academic-history-client";

export default async function AcademicHistoryPage() {
  const { user, services } = await requireContext("/academic/history");

  const [semesters, rawSemesters] = await Promise.all([
    services.academicPerformance.semesters(user.id).catch(() => []),
    services.repos.academicSemesters.findOrdered(user.id).catch(() => []),
  ]);

  return (
    <PageTransition>
      <PageHeader
        title="Academic History"
        description="Your permanent semester-by-semester record — the ground truth the CGPA engine builds from."
      />
      <AcademicHistoryClient semesters={semesters} rawSemesters={rawSemesters} />
    </PageTransition>
  );
}
