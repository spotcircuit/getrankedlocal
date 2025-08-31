// Convert selected images in /public to WebP using sharp
// Usage: node scripts/convert-images-to-webp.js

const path = require('path');
const fs = require('fs');

async function ensureSharp() {
  try {
    require.resolve('sharp');
    return require('sharp');
  } catch (e) {
    console.error('[convert-images-to-webp] Missing dependency: sharp');
    console.error('Install it with: npm i -D sharp');
    process.exit(1);
  }
}

(async () => {
  const sharp = await ensureSharp();
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');

  // Images to convert (relative to /public)
  const images = [
    'before-after-ranking-slider.png',
    '90-day-success-roadmap.png',
    '90dayROI.png',
    'competitor-alert-dashboard.png',
    'ranking-ladder-visualization.png',
    'revenue-loss-flow.png',
    'customer-journey-bypass.png',
    'trust-authority-badges.png',
    'social-proof.jpeg',
  ];

  const quality = Number(process.env.WEBP_QUALITY || 82);

  let converted = 0;
  for (const rel of images) {
    const srcPath = path.join(publicDir, rel);
    const dstPath = srcPath.replace(/\.(png|jpg|jpeg)$/i, '.webp');

    if (!fs.existsSync(srcPath)) {
      console.warn(`[skip] Not found: ${rel}`);
      continue;
    }

    try {
      await sharp(srcPath)
        .webp({ quality })
        .toFile(dstPath);
      converted++;
      console.log(`[ok] ${rel} -> ${path.basename(dstPath)} (q=${quality})`);
    } catch (err) {
      console.error(`[fail] ${rel}:`, err.message);
    }
  }

  console.log(`Done. Converted ${converted} file(s).`);
})();
