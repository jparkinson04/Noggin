import { ScheduledQueue } from "@/components/linkedin/ScheduledQueue";
import { StudioTabs } from "@/components/studio/StudioTabs";

/** The LinkedIn queue: upcoming, published, failed. */
export default function Scheduled() {
  return (
    <div className="px-4 py-6 md:px-6 lg:pt-8">
      <StudioTabs />
      <div className="mt-8">
        <ScheduledQueue />
      </div>
    </div>
  );
}
