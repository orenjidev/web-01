import type { Metadata } from "next";
import {
  Barlow,
  Merriweather,
  JetBrains_Mono,
  Outfit,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { PublicConfigProvider } from "@/context/PublicConfigContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ModalProvider } from "@/context/ModalContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MaintenanceProvider } from "@/context/MaintenanceContext";

/* =====================================================
   Fonts
===================================================== */
const fontSans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const fontSerif = Merriweather({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "700", "900"],
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/* =====================================================
   Metadata
===================================================== */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT_URL}/api/public/config`, {
      next: { revalidate: 60 },
    });
    const data = await res.json();
    const name: string = data?.serverName ?? "Ran Online GS";
    return {
      title: { template: `%s | ${name}`, default: name },
      description: data?.serverMotto ?? "",
    };
  } catch {
    return {
      title: { template: "%s | Ran Online GS", default: "Ran Online GS" },
      description: "",
    };
  }
}

/* =====================================================
   Layout
===================================================== */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <MaintenanceProvider>
          <AuthProvider>
            <PublicConfigProvider>
              <LanguageProvider>
                <TooltipProvider>
                  <ModalProvider>{children}</ModalProvider>
                </TooltipProvider>
              </LanguageProvider>
            </PublicConfigProvider>
          </AuthProvider>
        </MaintenanceProvider>
      </body>
    </html>
  );
}
