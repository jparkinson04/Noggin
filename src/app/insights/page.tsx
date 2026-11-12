import { aiConfigured } from "@/lib/ai/extract";
import { currentUser } from "@/lib/auth/currentUser";
import { latestAudit, loadTarget } from "@/lib/audience/store";
import { AudienceInsights } from "@/components/insights/AudienceInsights";

/** Insights: who is reacting to their posts, against who they said they want to reach. */
export default async function InsightsPage() {
  const user = await currentUser();
  const [target, audit] = await Promise.all([loadTarget(user), latestAudit(user)]);
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6 md:py-10">
      <AudienceInsights initialTarget={target} initialAudit={audit} canRun={aiConfigured()} />
    </div>
  );
}
