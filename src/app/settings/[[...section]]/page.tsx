import { notFound } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { SECTIONS } from "@/lib/settings/sections";

/** /settings, /settings/voice, /settings/linkedin … one section at a time. */
export default async function Settings({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  const id = section?.[0] ?? "profile";
  if (!SECTIONS.some((s) => s.id === id)) notFound();
  return <SettingsPage section={id} />;
}
