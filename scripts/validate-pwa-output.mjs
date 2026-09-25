import { existsSync, readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "out/manifest.webmanifest",
  "out/sw.js",
  "out/icons/app-icon.svg",
  "out/apple-icon",
];

for (const file of requiredFiles) {
  if (!statSync(file).isFile()) throw new Error(`Missing PWA output: ${file}`);
}

const html = readFileSync("out/index.html", "utf8");
const manifest = JSON.parse(readFileSync("out/manifest.webmanifest", "utf8"));

const expectedHtml = [
  'rel="manifest" href="/game2/manifest.webmanifest"',
  'rel="apple-touch-icon" href="/game2/apple-icon?',
];
for (const fragment of expectedHtml) {
  if (!html.includes(fragment)) throw new Error(`index.html is missing: ${fragment}`);
}
if (manifest.start_url !== "/game2/" || manifest.scope !== "/game2/") {
  throw new Error("Manifest scope and start_url must use the GitHub Pages base path");
}
if (manifest.icons?.[0]?.src !== "/game2/icons/app-icon.svg" || !existsSync("out/icons/app-icon.svg")) {
  throw new Error("Manifest SVG icon does not resolve to the exported text asset");
}
const appleIcon = readFileSync("out/apple-icon");
if (!appleIcon.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
  throw new Error("The exported Apple metadata route is not a PNG image");
}
if (html.includes("/game2/game2/") || html.includes('href="/sw.js"')) {
  throw new Error("Found an invalid root or duplicated base path URL");
}

console.log(`Validated ${requiredFiles.length} PWA files and production base-path metadata.`);
