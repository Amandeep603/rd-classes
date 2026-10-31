import sharp from "sharp";
import fs from "fs";

async function createOgImage() {
  const width = 1200;
  const height = 630;
  
  const svgText = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A0A0B" />
        <stop offset="100%" stop-color="#16161A" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFB800" />
        <stop offset="100%" stop-color="#FF9000" />
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    
    <!-- Decorative top bar -->
    <rect x="0" y="0" width="${width}" height="8" fill="url(#accentGrad)" />
    
    <!-- Border card -->
    <rect x="60" y="60" width="1080" height="510" rx="24" fill="#121214" stroke="#26262B" stroke-width="2" />
    
    <!-- Badge -->
    <rect x="110" y="110" width="330" height="40" rx="20" fill="#FFB800" fill-opacity="0.15" stroke="#FFB800" stroke-width="1.5" />
    <text x="275" y="136" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" fill="#FFB800" text-anchor="middle">SECTOR 9, FARIDABAD, HARYANA</text>
    
    <!-- Heading -->
    <text x="110" y="225" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="800" fill="#FFFFFF">R.D. CLASSES</text>
    <text x="110" y="285" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="#FFB800">FOR ACCOUNTANCY</text>
    
    <!-- Subtitle / Value Props -->
    <text x="110" y="360" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="500" fill="#D1D5DB">CBSE Class 11 &amp; 12 Coaching · Concept-First Mastery</text>
    <text x="110" y="405" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="400" fill="#9CA3AF">Taught by Ronak Dugar · Consistent 100/100 Board Results</text>
    
    <!-- Footer row inside card -->
    <line x1="110" y1="450" x2="1030" y2="450" stroke="#26262B" stroke-width="1" />
    <text x="110" y="495" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="#FFFFFF">https://www.rd-classes.in</text>
    <text x="1030" y="495" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="600" fill="#FFB800" text-anchor="end">Offline &amp; Online Batches</text>
  </svg>
  `;

  await sharp(Buffer.from(svgText))
    .png()
    .toFile("public/images/og-image.png");
  console.log("public/images/og-image.png generated successfully (1200x630)");
}

createOgImage().catch(console.error);

