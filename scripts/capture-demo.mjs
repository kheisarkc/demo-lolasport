import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(root, '.runtime/browsers');
const { chromium } = await import('@playwright/test');
const output = resolve(root, '.runtime/reports');
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:3001/bukti-demo.svg');
  await page.locator('svg').screenshot({ path: resolve(root, 'apps/web/public/bukti-demo.png') });
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:3001');
    await page.getByRole('heading', { name: 'Futsal Arena' }).waitFor();
    await page.screenshot({ path: resolve(output, `catalog-${name}.png`), fullPage: true });
  }
  console.log('Bukti PNG fiktif dan screenshot katalog tersimpan.');
} finally {
  await browser.close();
}
