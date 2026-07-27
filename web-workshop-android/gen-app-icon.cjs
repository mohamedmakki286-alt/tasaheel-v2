const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = __dirname;
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
const source = path.join(root, 'public', 'tasaheel-workshop-icon.svg');
const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

async function renderLegacy(size, destination) {
  await sharp(source, { density: 600 })
    .resize(size, size)
    .png()
    .toFile(destination);
}

async function renderAdaptive(size, destination) {
  const artworkSize = Math.round(size * 0.70);
  const artwork = await sharp(source, { density: 600 })
    .resize(artworkSize, artworkSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artwork, gravity: 'center' }])
    .png()
    .toFile(destination);
}

async function main() {
  for (const [density, size] of Object.entries(densities)) {
    const directory = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(directory, { recursive: true });
    await Promise.all([
      renderLegacy(size, path.join(directory, 'ic_launcher.png')),
      renderLegacy(size, path.join(directory, 'ic_launcher_round.png')),
      renderAdaptive(size, path.join(directory, 'ic_launcher_foreground.png')),
    ]);
  }

  // Adaptive icons use a 432px xxxhdpi foreground.
  const adaptiveDirectory = path.join(res, 'mipmap-anydpi-v26');
  fs.mkdirSync(adaptiveDirectory, { recursive: true });
  await renderAdaptive(432, path.join(adaptiveDirectory, 'ic_launcher_foreground.png'));
  console.log('Workshop Android launcher icons generated.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
