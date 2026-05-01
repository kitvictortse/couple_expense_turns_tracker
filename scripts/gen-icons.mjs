import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0ea5e9"/>
  <g fill="white">
    <circle cx="176" cy="185" r="52"/>
    <path d="M80 390 Q80 285 176 285 Q272 285 272 390 L272 430 L80 430 Z"/>
    <circle cx="340" cy="185" r="52" fill="rgba(255,255,255,0.65)"/>
    <path d="M244 390 Q244 285 340 285 Q436 285 436 390 L436 430 L244 430 Z" fill="rgba(255,255,255,0.65)"/>
  </g>
</svg>`;

const buf = Buffer.from(svg);

await Promise.all([
  sharp(buf).resize(192, 192).png().toFile("public/icon-192x192.png"),
  sharp(buf).resize(512, 512).png().toFile("public/icon-512x512.png"),
  sharp(buf).resize(180, 180).png().toFile("public/apple-touch-icon.png"),
]);

console.log("Icons generated.");
