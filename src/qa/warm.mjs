// Stage 4: section modules load when their section comes near. QA scrolls through the page once
// (and waits for the KI data) so every demo is set up, then returns to the top.
export async function warm(page, { back = true } = {}) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h + 1000; y += 600) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(60);
  }
  if (await page.$('.kidemo')) await page.waitForSelector('.kidemo.has-data', { state: 'attached', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
  if (back) { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200); }
}
