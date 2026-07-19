const sharp = require('sharp');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><circle cx="48" cy="48" r="48" fill="#D71920"/><text x="48" y="62" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="40" fill="white">&#1589;</text></svg>`;
const buf = Buffer.from(svg);
sharp(buf, { density: 150 }).png().toFile('android/app/src/main/res/drawable/ic_stat_icon_config_sample.png')
  .then(() => console.log('notification icon done'))
  .catch(console.error);
