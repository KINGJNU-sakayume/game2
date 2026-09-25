import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import { withBasePath } from "@/config/pwa";
import "./globals.css";

export const metadata: Metadata = {
  title: "비가 그친 뒤",
  description: "선택으로 이어지는 서사형 의료 드라마",
  applicationName: "비가 그친 뒤",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "비가 그친 뒤", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#11100f" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ko"><body>{children}<PwaRegistration /></body></html>;
}
