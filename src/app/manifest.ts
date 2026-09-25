import type { MetadataRoute } from "next";
import { withBasePath } from "@/config/pwa";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "비가 그친 뒤",
    short_name: "비가 그친 뒤",
    description: "선택으로 이어지는 서사형 의료 드라마",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#080d12",
    theme_color: "#11100f",
    orientation: "portrait-primary",
    lang: "ko",
    icons: [
      { src: withBasePath("/icons/app-icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBasePath("/icons/app-icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
