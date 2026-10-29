import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { SideNav } from "@/components/shell/SideNav";
import { CaptureProvider } from "@/components/capture/CaptureSheet";
import { BrainProvider } from "@/components/brain/BrainStore";
import { LinkedInProvider } from "@/components/linkedin/LinkedInProvider";
import { ExpiryBanner } from "@/components/linkedin/ExpiryBanner";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { signedInUser } from "@/lib/auth/currentUser";
import { loadBrain } from "@/lib/brain/store";
import { THEME_COOKIE, themeFrom } from "@/lib/theme";
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await signedInUser();
  const theme = themeFrom((await cookies()).get(THEME_COOKIE)?.value);
  // Signed out, the only page anyone can reach is sign-in: no rail, and nothing that loads their data.
  if (!user) {
    return (
      <html lang="en-GB" data-theme={theme} className={`${bricolage.variable} ${figtree.variable}`}>
        <body className="min-h-screen">{children}</body>
      </html>
    );
  }

  const brain = await loadBrain(user);
  return (
    <html lang="en-GB" data-theme={theme} className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="min-h-screen lg:flex">
        <BrainProvider initial={brain}>
          <CaptureProvider>
            <LinkedInProvider>
              <SettingsProvider>
                <SideNav initials={initials(user.name)} />
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
