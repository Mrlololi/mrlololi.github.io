// Installs Chromium for Playwright into mrlololi-site/.playwright-browsers.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../../..');
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(projectRoot, '.playwright-browsers') };

const res = spawnSync('npx', ['playwright', 'install', 'chromium'], { env, stdio: 'inherit', shell: true });
process.exit(res.status ?? 1);
