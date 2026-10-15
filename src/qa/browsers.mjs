// Keeps Playwright's browser download inside the project folder
// (mrlololi-site/.playwright-browsers) instead of %LOCALAPPDATA%.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(here, '../..');
export const projectRoot = path.resolve(repoRoot, '..');
export const qaDir = path.join(projectRoot, 'qa');

process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(projectRoot, '.playwright-browsers');

// Imported after the env var is set, so Playwright picks up the local path.
const { chromium } = await import('playwright');
export { chromium };
