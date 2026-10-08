import { MonthView } from "@/components/calendar/MonthView";

/** Calendar: which post goes out on which day, what's been posted, and the diary. */
export default function CalendarPage() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 md:px-6 md:py-10">
      <MonthView />
    </div>
  );
}
