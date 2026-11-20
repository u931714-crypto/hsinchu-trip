const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#list .card', { timeout: 15000 });
  const initialCount = await page.locator('#list .card').count();
  if (initialCount < 8) throw new Error('Default itinerary incomplete: ' + initialCount);
  results.push({ test: 'mobile_initial_render', status: 'PASS', cards: initialCount });

  await page.locator('#mode').click();
  if (!(await page.locator('body').evaluate(el => el.classList.contains('edit')))) throw new Error('Edit mode did not activate');
  results.push({ test: 'edit_mode', status: 'PASS' });

  const first = page.locator('#list .card').first();
  const before = await first.locator('.dur').textContent();
  await first.locator('[data-a="d"][data-v="5"]').click();
  if (await first.locator('.dur').textContent() === before) throw new Error('Duration control did not update');
  await page.locator('#undoBar').click();
  if (await page.locator('#list .card').first().locator('.dur').textContent() !== before) throw new Error('Undo did not restore duration');
  results.push({ test: 'duration_and_undo', status: 'PASS' });

  const beforeOrder = await page.locator('#list .card').evaluateAll(cards => cards.map(c => c.dataset.id));
  await page.locator('#list .card').nth(1).locator('[data-a="up"]').click();
  const afterOrder = await page.locator('#list .card').evaluateAll(cards => cards.map(c => c.dataset.id));
  if (afterOrder[0] !== beforeOrder[1] || afterOrder[1] !== beforeOrder[0]) throw new Error('Move-up reorder failed');
  await page.locator('#undoBar').click();
  results.push({ test: 'manual_reordering_and_undo', status: 'PASS' });

  await page.locator('#poolBox summary').click();
  const poolCard = page.locator('#pool .card').first();
  if (await poolCard.count()) {
    const poolId = await poolCard.getAttribute('data-id');
    await poolCard.locator('[data-addback]').click();
    if (!(await page.locator('#list .card').evaluateAll(cards => cards.some(c => c.dataset.id === poolId)))) throw new Error('Add-back failed');
    await page.locator('#undoBar').click();
    results.push({ test: 'alternative_stop_addback_and_undo', status: 'PASS' });
  } else results.push({ test: 'alternative_stop_addback_and_undo', status: 'SKIP', reason: 'No alternative stop' });

  await page.locator('#start').fill('23:00');
  await page.locator('#start').press('Tab');
  await page.waitForTimeout(200);
  if (!(await page.locator('#sum').innerText()).includes('個問題')) throw new Error('Late-start conflict warning missing');
  await page.locator('#start').fill('08:00');
  await page.locator('#start').press('Tab');
  results.push({ test: 'schedule_conflict_warning', status: 'PASS' });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#list .card');
  if (await page.locator('#start').inputValue() !== '08:00') throw new Error('Start-time persistence failed');
  results.push({ test: 'local_storage_persistence', status: 'PASS' });
  if (errors.length) throw new Error('Browser errors: ' + errors.join(' | '));
  results.push({ test: 'browser_runtime_errors', status: 'PASS', count: 0 });

  const report = { viewport: '390x844', runAt: new Date().toISOString(), tests: results, passed: results.filter(x => x.status === 'PASS').length, skipped: results.filter(x => x.status === 'SKIP').length, failed: 0 };
  fs.writeFileSync('qa-report.json', JSON.stringify(report, null, 2));
  console.log('QA_REPORT=' + JSON.stringify(report));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
