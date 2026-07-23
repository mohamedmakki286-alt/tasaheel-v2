const sharp = require('sharp');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1920"><rect width="1280" height="1920" fill="#111111"/><circle cx="640" cy="800" r="200" fill="#D71920"/></svg>`;
sharp(Buffer.from(svg), { density: 150 }).png().toFile('android/app/src/main/res/drawable/splash.png')
  .then(() => console.log('splash done'))
  .catch(e => console.error(e.message));
