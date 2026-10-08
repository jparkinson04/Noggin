import { ConnectionCard } from "@/components/linkedin/ConnectionCard";
import { Narrow } from "@/components/shell/Narrow";

/** Account settings. For now: the LinkedIn connection. */
export default function Settings() {
  return (
    <Narrow>
      <h1 className="text-3xl">Settings</h1>
      <div className="mt-10">
        <ConnectionCard />
      </div>
    </Narrow>
  );
}
