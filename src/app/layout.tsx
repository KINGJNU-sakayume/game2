import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/gowun-batang/400.css";
import "@fontsource/gowun-batang/700.css";
import "@fontsource/ibm-plex-sans-kr/400.css";
import "@fontsource/ibm-plex-sans-kr/500.css";
import "@fontsource/ibm-plex-sans-kr/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import { PwaRegistration } from "@/components/pwa/PwaRegistration";
import { withBasePath } from "@/config/pwa";
import "./globals.css";

const THEME_COLOR = "#f3efe7";

export const metadata: Metadata = {
  title: "비가 그친 뒤",
  description: "정상 검사 뒤에 숨은 병을 찾는 선택형 의료 미스터리",
  applicationName: "비가 그친 뒤",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "비가 그친 뒤", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: THEME_COLOR };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ko"><body>{children}<PwaRegistration /></body></html>;
}
