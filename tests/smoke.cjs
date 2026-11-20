const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const results = [];
  const errors = [];
  let browser;
  let page;
  const report = {
    run: process.env.QA_RUN || 'manual',
    runId: process.env.GITHUB_RUN_ID || null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
    commit: process.env.GITHUB_SHA || null,
    viewport: '390x844',
    runAt: new Date().toISOString(),
    tests: results,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors
  };
  const check = (name, fn) => async () => {
    try {
      const detail = await fn();
      results.push({ test: name, status: 'PASS', ...(detail || {}) });
    } catch (e) {
      errors.push({ test: name, message: e.message });
      results.push({ test: name, status: 'FAIL', message: e.message });
      throw e;
    }
  };

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    page = await context.newPage();
    page.on('pageerror', e => errors.push({ test: 'pageerror', message: e.message }));
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#list .card', { timeout: 15000 });

    await check('mobile_initial_render', async () => {
      const cards = await page.locator('#list .card').count();
      if (cards < 8) throw new Error('Default itinerary incomplete: ' + cards);
      return { cards };
    })();

    await check('edit_mode', async () => {
      await page.locator('#mode').click();
      if (!(await page.locator('body').evaluate(el => el.classList.contains('edit')))) throw new Error('Edit mode did not activate');
    })();

    await check('duration_and_undo', async () => {
      const first = page.locator('#list .card').first();
      const before = await first.locator('.dur').textContent();
      await first.locator('[data-a="d"][data-v="5"]').click();
      if (await first.locator('.dur').textContent() === before) throw new Error('Duration control did not update');
      await page.locator('#undoBar').click();
      if (await page.locator('#list .card').first().locator('.dur').textContent() !== before) throw new Error('Undo did not restore duration');
    })();

    await check('manual_reordering_and_undo', async () => {
      const before = await page.locator('#list .card').evaluateAll(cards => cards.map(c => c.dataset.id));
      await page.locator('#list .card').nth(1).locator('[data-a="up"]').click();
      const after = await page.locator('#list .card').evaluateAll(cards => cards.map(c => c.dataset.id));
      if (after[0] !== before[1] || after[1] !== before[0]) throw new Error('Move-up reorder failed');
      await page.locator('#undoBar').click();
    })();

    await check('alternative_stop_addback_and_undo', async () => {
      await page.locator('#poolBox summary').click();
      const card = page.locator('#pool .card').first();
      if (!(await card.count())) return { skipped: true, reason: 'No alternative stop available' };
      const id = await card.getAttribute('data-id');
      await card.locator('[data-addback]').click();
      if (!(await page.locator('#list .card').evaluateAll(cards => cards.some(c => c.dataset.id === id)))) throw new Error('Add-back failed');
      await page.locator('#undoBar').click();
    })();

    await check('schedule_conflict_warning', async () => {
      await page.locator('#start').fill('23:00');
      await page.locator('#start').press('Tab');
      await page.waitForTimeout(250);
      if (!(await page.locator('#sum').innerText()).includes('個問題')) throw new Error('Late-start conflict warning missing');
      await page.locator('#start').fill('08:00');
      await page.locator('#start').press('Tab');
    })();

    await check('local_storage_persistence', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#list .card');
      const value = await page.locator('#start').inputValue();
      if (value !== '08:00') throw new Error('Start-time persistence failed: ' + value);
    })();

    await check('browser_runtime_errors', async () => {
      if (errors.length) throw new Error(errors.map(e => e.message).join(' | '));
    })();

  } catch (error) {
    if (!errors.some(e => e.message === error.message)) errors.push({ test: 'uncaught', message: error.stack || error.message });
    report.fatal = error.stack || error.message;
    if (page) {
      try {
        fs.mkdirSync('qa-reports/screenshots', { recursive: true });
        await page.screenshot({ path: path.join('qa-reports/screenshots', 'run-' + report.run + '-failure.png'), fullPage: true });
      } catch (screenshotError) {
        report.screenshotError = screenshotError.message;
      }
    }
  } finally {
    if (browser) await browser.close();
    report.passed = results.filter(x => x.status === 'PASS').length;
    report.skipped = results.filter(x => x.skipped).length;
    report.failed = results.filter(x => x.status === 'FAIL').length + (report.fatal ? 1 : 0);
    report.tests = results;
    fs.mkdirSync('qa-reports', { recursive: true });
    fs.writeFileSync('qa-reports/run-' + report.run + '.json', JSON.stringify(report, null, 2));
    console.log('QA_REPORT=' + JSON.stringify(report));
    if (report.failed || errors.length) process.exitCode = 1;
  }
})();
