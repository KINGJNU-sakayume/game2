import type { MetadataRoute } from "next";
import { withBasePath } from "@/config/pwa";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "비가 그친 뒤",
    short_name: "비가 그친 뒤",
    description: "정상 검사 뒤에 숨은 병을 찾는 선택형 의료 미스터리",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#f3efe7",
    theme_color: "#f3efe7",
    orientation: "portrait-primary",
    lang: "ko",
    icons: [
      { src: withBasePath("/icons/app-icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBasePath("/icons/app-icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
