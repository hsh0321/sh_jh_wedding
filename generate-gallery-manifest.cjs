'use strict';

const fs = require('node:fs');
const path = require('node:path');

const galleryDirectory = path.join(__dirname, 'assets', 'gallery-preload');
const manifestPath = path.join(galleryDirectory, 'gallery-manifest.json');
const galleryImagePattern = /^gallery-[^/\\]+\.(?:avif|jpe?g|png|webp)$/i;
const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function generateGalleryManifest() {
  const photos = fs.readdirSync(galleryDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && galleryImagePattern.test(entry.name))
    .map(entry => entry.name)
    .sort(naturalOrder.compare);

  if (!photos.length) throw new Error('No gallery images were found.');
  fs.writeFileSync(manifestPath, `${JSON.stringify(photos, null, 2)}\n`);
  console.log(`Gallery manifest: ${photos.length} photos`);
  return photos;
}

if (require.main === module) generateGalleryManifest();

module.exports = generateGalleryManifest;
