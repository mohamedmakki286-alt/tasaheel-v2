import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const androidRoot = resolve(here, '..');
const sharedRoot = resolve(androidRoot, '..', 'web-workshop');

await rm(resolve(androidRoot, 'src'), { recursive: true, force: true });
await cp(resolve(sharedRoot, 'src'), resolve(androidRoot, 'src'), { recursive: true });
await cp(resolve(sharedRoot, 'public'), resolve(androidRoot, 'public'), { recursive: true, force: true });
console.log('Workshop Web source synced to Android project.');
