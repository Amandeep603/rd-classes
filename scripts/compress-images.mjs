import fs from "fs";
import path from "path";
import sharp from "sharp";

async function compressAll() {
  console.log("=== COMPRESSING OVERSIZED IMAGES IN /public ===");

  const report = [];

  // 1. Hero cutouts (used in HeroImageGrid, displayed at max ~180px wide on desktop, ~100px on mobile)
  // We resize to width 420px (2.3x retina) with quality 82 WebP/PNG
  const cutouts = [1, 2, 3, 4, 5];
  for (const n of cutouts) {
    const webpPath = `public/images/hero/cutouts/student-${n}-cutout.webp`;
    if (fs.existsSync(webpPath)) {
      const input = fs.readFileSync(webpPath);
      const beforeSize = input.length;
      const buf = await sharp(input)
        .resize({ width: 420, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();
      fs.writeFileSync(webpPath, buf);
      const afterSize = buf.length;
      report.push({
        file: webpPath,
        beforeKb: (beforeSize / 1024).toFixed(1),
        afterKb: (afterSize / 1024).toFixed(1),
        reduction: `${Math.round(((beforeSize - afterSize) / beforeSize) * 100)}%`,
      });
    }

    const pngPath = `public/images/hero/cutouts/student-${n}-cutout.png`;
    if (fs.existsSync(pngPath)) {
      const input = fs.readFileSync(pngPath);
      const beforeSize = input.length;
      const buf = await sharp(input)
        .resize({ width: 420, withoutEnlargement: true })
        .png({ quality: 80, compressionLevel: 9, effort: 7 })
        .toBuffer();
      fs.writeFileSync(pngPath, buf);
      const afterSize = buf.length;
      report.push({
        file: pngPath,
        beforeKb: (beforeSize / 1024).toFixed(1),
        afterKb: (afterSize / 1024).toFixed(1),
        reduction: `${Math.round(((beforeSize - afterSize) / beforeSize) * 100)}%`,
      });
    }
  }

  // 2. Course 3D icons (used in CourseCard, displayed at max 170x120px)
  // We resize to width 340px (2x retina) with quality 82 WebP
  const courseIcons = [
    "books-3d.webp",
    "test-paper-3d.webp",
    "open-book-3d.webp",
    "revision-plan-3d.webp",
    "open-book-orange-3d.webp",
    "laptop-play-3d.webp",
    "course-revision-plan-3d.webp",
    "course-books-3d.webp",
    "course-open-book-3d.webp",
    "hero-books-stack.webp",
  ];

  for (const name of courseIcons) {
    const filePath = path.join("public/images/courses", name);
    if (fs.existsSync(filePath)) {
      const input = fs.readFileSync(filePath);
      const beforeSize = input.length;
      const buf = await sharp(input)
        .resize({ width: 340, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();
      fs.writeFileSync(filePath, buf);
      const afterSize = buf.length;
      report.push({
        file: filePath.replace(/\\/g, "/"),
        beforeKb: (beforeSize / 1024).toFixed(1),
        afterKb: (afterSize / 1024).toFixed(1),
        reduction: `${Math.round(((beforeSize - afterSize) / beforeSize) * 100)}%`,
      });
    }
  }

  // 3. Other large files
  const otherFiles = [
    { p: "public/images/courses/hero-books-reference.png", w: 800, fmt: "png" },
    { p: "public/images/courses/hero-books-reference.webp", w: 800, fmt: "webp" },
    { p: "public/images/books-stack-3d.png", w: 500, fmt: "png" },
    { p: "public/images/portal/auth-study-desk.jpg", w: 900, fmt: "jpeg" },
  ];

  for (const item of otherFiles) {
    if (fs.existsSync(item.p)) {
      const input = fs.readFileSync(item.p);
      const beforeSize = input.length;
      let pipeline = sharp(input).resize({ width: item.w, withoutEnlargement: true });
      if (item.fmt === "png") pipeline = pipeline.png({ quality: 80, compressionLevel: 9 });
      else if (item.fmt === "webp") pipeline = pipeline.webp({ quality: 80 });
      else if (item.fmt === "jpeg") pipeline = pipeline.jpeg({ quality: 80 });
      const buf = await pipeline.toBuffer();
      fs.writeFileSync(item.p, buf);
      const afterSize = buf.length;
      report.push({
        file: item.p,
        beforeKb: (beforeSize / 1024).toFixed(1),
        afterKb: (afterSize / 1024).toFixed(1),
        reduction: `${Math.round(((beforeSize - afterSize) / beforeSize) * 100)}%`,
      });
    }
  }

  console.log("\n=== COMPRESSION REPORT ===");
  console.table(report);

  const totalBefore = report.reduce((acc, r) => acc + parseFloat(r.beforeKb), 0);
  const totalAfter = report.reduce((acc, r) => acc + parseFloat(r.afterKb), 0);
  console.log(`\nTotal payload reduced from ${(totalBefore / 1024).toFixed(2)} MB to ${(totalAfter / 1024).toFixed(2)} MB (-${Math.round(((totalBefore - totalAfter) / totalBefore) * 100)}%)!`);
}

compressAll().catch(console.error);
