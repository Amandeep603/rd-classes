import sharp from "sharp";

async function getPixel(img, x, y) {
  const p = await img.clone().extract({ left: Math.round(x), top: Math.round(y), width: 1, height: 1 }).raw().toBuffer();
  const hex = `#${((1 << 24) + (p[0] << 16) + (p[1] << 8) + p[2]).toString(16).slice(1).toUpperCase()}`;
  return { r: p[0], g: p[1], b: p[2], hex };
}

async function findColors() {
  const img = sharp("reference/about-design.png");
  
  // 1. Highlight: "Ronak Sir" highlight is around y: 260, x: 75..200
  // Let's test a few points inside the highlight
  console.log("Highlight samples:");
  for (let x = 80; x <= 160; x += 20) {
    console.log(`x=${x}, y=262:`, (await getPixel(img, x, 262)).hex);
  }

  // 2. Yellow Backdrop:
  console.log("\nYellow Backdrop samples:");
  for (let x = 600; x <= 640; x += 10) {
    console.log(`x=${x}, y=110:`, (await getPixel(img, x, 110)).hex);
  }

  // 3. Chip Background:
  console.log("\nChip Background samples:");
  for (let x = 60; x <= 120; x += 20) {
    console.log(`x=${x}, y=100:`, (await getPixel(img, x, 100)).hex);
  }

  // 4. Navy in Heading / CTA:
  console.log("\nHeading Navy samples (inside large letter stems):");
  console.log("H1 stem (x=70, y=140):", (await getPixel(img, 70, 140)).hex);
  console.log("CTA Banner (x=250, y=900):", (await getPixel(img, 250, 900)).hex);

  // 5. Pillar 1 (Blue gradient top-left to bottom-right):
  console.log("\nPillar 1 samples:");
  console.log("Top-left (x=245, y=560):", (await getPixel(img, 245, 560)).hex);
  console.log("Center (x=260, y=650):", (await getPixel(img, 260, 650)).hex);
  console.log("Bottom-right (x=330, y=745):", (await getPixel(img, 330, 745)).hex);

  // 6. Pillar 2 (Yellow gradient):
  console.log("\nPillar 2 samples:");
  console.log("Top-left (x=400, y=570):", (await getPixel(img, 400, 570)).hex);
  console.log("Center (x=410, y=650):", (await getPixel(img, 410, 650)).hex);
  console.log("Bottom-right (x=485, y=755):", (await getPixel(img, 485, 755)).hex);

  // 7. Pillar 3 (Green gradient):
  console.log("\nPillar 3 samples:");
  console.log("Top-left (x=550, y=580):", (await getPixel(img, 550, 580)).hex);
  console.log("Center (x=560, y=660):", (await getPixel(img, 560, 660)).hex);
  console.log("Bottom-right (x=635, y=760):", (await getPixel(img, 635, 760)).hex);

  // 8. Bottom Circles:
  console.log("\nBottom Circles:");
  console.log("Outer circle (x=630, y=980):", (await getPixel(img, 630, 980)).hex);
  console.log("Inner circle (x=650, y=940):", (await getPixel(img, 650, 940)).hex);
}

findColors().catch(console.error);

