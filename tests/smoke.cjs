const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#list .card', { timeout: 15000 });
  const initialCount = await page.locator('#list .card').count();
  if (initialCount < 8) throw new Error('Expected default itinerary cards; got ' + initialCount);

  await page.locator('#mode').click();
  if (!(await page.locator('body').evaluate(el => el.classList.contains('edit')))) throw new Error('Edit mode did not activate');

  const duration = page.locator('#list .card').first().locator('.dur');
  const before = await duration.textContent();
  await page.locator('#list .card').first().locator('[data-a="d"][data-v="5"]').click();
  const after = await duration.textContent();
  if (before === after) throw new Error('Duration control did not update the itinerary');

  await page.locator('#undoBar').click();
  const undone = await duration.textContent();
  if (undone !== before) throw new Error('Undo did not restore the previous duration');

  await page.locator('#start').fill('07:00');
  await page.locator('#start').press('Tab');
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#list .card');
  const savedStart = await page.locator('#start').inputValue();
  if (savedStart !== '07:00') throw new Error('Start time was not persisted; got ' + savedStart);
  if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));

  console.log(JSON.stringify({ mobileViewport: '390x844', itineraryCards: initialCount, editMode: 'PASS', durationAndUndo: 'PASS', localStoragePersistence: 'PASS', pageErrors: errors.length }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
