import sharp from "sharp";
import fs from "node:fs";

async function sampleColor(image, x, y, size = 3) {
  // Extract a small patch around (x, y) to average
  const patch = await image
    .clone()
    .extract({
      left: Math.max(0, Math.round(x - size / 2)),
      top: Math.max(0, Math.round(y - size / 2)),
      width: size,
      height: size,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0, g = 0, b = 0;
  const pixels = patch.data.length / patch.info.channels;
  for (let i = 0; i < patch.data.length; i += patch.info.channels) {
    r += patch.data[i];
    g += patch.data[i + 1];
    b += patch.data[i + 2];
  }
  r = Math.round(r / pixels);
  g = Math.round(g / pixels);
  b = Math.round(b / pixels);

  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  return { r, g, b, hex };
}

async function run() {
  const refImage = sharp("reference/about-design.png");
  const refMeta = await refImage.metadata();
  console.log(`Reference Image Size: ${refMeta.width}x${refMeta.height}`);

  // Let's sample key coordinates on the reference image (normalized 0..1 then scaled to 682x1024)
  // 1. Page background: top-left area ~ (x: 40, y: 150)
  // 2. Chip bg: ~ (x: 100, y: 105)
  // 3. Chip text: ~ (x: 100, y: 105 text pixel)
  // 4. Hero H1 Navy text: "Concept": ~ (x: 100, y: 145)
  // 5. Highlight behind "Ronak Sir.": ~ (x: 150, y: 255)
  // 6. Yellow backdrop shape: ~ (x: 330, y: 180) or top peeking area (x: 600, y: 105)
  // 7. Hero body text: ~ (x: 120, y: 320)
  // 8. Founder card background: ~ (x: 200, y: 450)
  // 9. Founder avatar ring / text: ~ (x: 100, y: 450)
  // 10. Pillar Card 1 (blue) top-left: ~ (x: 250, y: 570), center: (x: 300, y: 650), bottom-right: (x: 340, y: 730)
  // 11. Pillar Card 2 (yellow) top-left: ~ (x: 400, y: 570), center: (x: 450, y: 650), bottom-right: (x: 490, y: 740)
  // 12. Pillar Card 3 (green) top-left: ~ (x: 550, y: 580), center: (x: 600, y: 660), bottom-right: (x: 630, y: 750)
  // 13. CTA Banner navy: ~ (x: 400, y: 880)
  // 14. CTA Banner wedge (bottom-left): ~ (x: 80, y: 920)
  // 15. CTA Button yellow: ~ (x: 580, y: 880)

  const points = [
    { name: "Page Background", x: 45, y: 180 },
    { name: "Hero Chip Background", x: 100, y: 104 },
    { name: "Hero H1 Navy Text", x: 120, y: 140 },
    { name: "Highlight Behind Ronak Sir.", x: 150, y: 258 },
    { name: "Yellow Backdrop Shape (Top-Right)", x: 600, y: 106 },
    { name: "Hero Body Paragraph Text", x: 120, y: 320 },
    { name: "Founder Card Background", x: 250, y: 450 },
    { name: "Founder Card Heading/Navy", x: 260, y: 456 },
    { name: "Pillar 1 Card (Top-Left)", x: 250, y: 575 },
    { name: "Pillar 1 Card (Center)", x: 290, y: 650 },
    { name: "Pillar 1 Card (Bottom-Right)", x: 335, y: 735 },
    { name: "Pillar 2 Card (Top-Left)", x: 405, y: 575 },
    { name: "Pillar 2 Card (Center)", x: 445, y: 650 },
    { name: "Pillar 2 Card (Bottom-Right)", x: 490, y: 740 },
    { name: "Pillar 3 Card (Top-Left)", x: 555, y: 585 },
    { name: "Pillar 3 Card (Center)", x: 595, y: 660 },
    { name: "Pillar 3 Card (Bottom-Right)", x: 635, y: 750 },
    { name: "CTA Banner Navy", x: 400, y: 880 },
    { name: "CTA Banner Wedge (Bottom-Left)", x: 65, y: 925 },
    { name: "CTA Button Yellow", x: 580, y: 880 },
    { name: "Bottom Circles Yellow (Right)", x: 640, y: 980 },
  ];

  console.log("\n=== SAMPLING REFERENCE IMAGE ===");
  const refSamples = {};
  for (const pt of points) {
    const s = await sampleColor(refImage, pt.x, pt.y, 5);
    refSamples[pt.name] = s;
    console.log(`${pt.name.padEnd(35)}: ${s.hex} (rgb(${s.r}, ${s.g}, ${s.b}))`);
  }

  // Also check existing live screenshot if present
  const livePath = "C:/Users/amand/.gemini/antigravity/brain/cebeea2f-3a75-4711-aa0a-93701b2ffe66/about_desktop_1024px_final.png";
  if (fs.existsSync(livePath)) {
    console.log("\n=== SAMPLING LIVE SCREENSHOT (1024px) ===");
    const liveImage = sharp(livePath);
    const liveMeta = await liveImage.metadata();
    console.log(`Live Image Size: ${liveMeta.width}x${liveMeta.height}`);

    // Map proportional points to live image
    for (const pt of points) {
      const liveX = (pt.x / refMeta.width) * liveMeta.width;
      const liveY = (pt.y / refMeta.height) * liveMeta.height;
      try {
        const s = await sampleColor(liveImage, liveX, liveY, 5);
        console.log(`${pt.name.padEnd(35)} Live: ${s.hex}`);
      } catch (e) {
        // out of bounds or offset
      }
    }
  }

  fs.writeFileSync("scripts/sampled-colors.json", JSON.stringify(refSamples, null, 2));
}

run().catch(console.error);

