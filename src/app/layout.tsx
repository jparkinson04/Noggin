import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SideNav } from "@/components/shell/SideNav";
import { CaptureProvider } from "@/components/capture/CaptureSheet";
import { BrainProvider } from "@/components/brain/BrainStore";
import { LinkedInProvider } from "@/components/linkedin/LinkedInProvider";
import { ExpiryBanner } from "@/components/linkedin/ExpiryBanner";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { sampleBrain } from "@/lib/brain/sampleBrain";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
});
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree" });

export const metadata: Metadata = {
  title: "Noggin",
  description: "A personal-brand brain for LinkedIn.",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="min-h-screen lg:flex">
        <BrainProvider>
          <CaptureProvider>
            <LinkedInProvider>
              <SettingsProvider>
                <SideNav initials={initials(sampleBrain.ownerName)} />
                <div className="min-w-0 flex-1">
                  <ExpiryBanner />
                  <main>{children}</main>
                </div>
              </SettingsProvider>
            </LinkedInProvider>
          </CaptureProvider>
        </BrainProvider>
      </body>
    </html>
  );
}
