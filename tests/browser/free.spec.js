import { expect, test } from '@playwright/test';

for (const [language, high] of [['es', 'Riesgo alto'], ['pt', 'Risco alto'], ['en', 'High risk']]) {
  test(`Free scanner and private history in ${language}`, async ({ page, context }) => {
    await page.goto('/');
    await page.locator('#lang').selectOption(language);
    await page.locator('#example').click();
    await expect(page.locator('#risk')).toHaveText(high);
    await page.locator('#scan').click();
    await expect(page.locator('#history li')).toHaveCount(0);

    await page.locator('#keep').check();
    await page.locator('#scan').click();
    const entries = await page.evaluate(() => JSON.parse(localStorage.getItem('ag-history')));
    expect(entries).toHaveLength(1);
    expect(Object.keys(entries[0]).sort()).toEqual(['count', 'date', 'level']);

    await page.evaluate(() => navigator.serviceWorker.ready);
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#history li')).toHaveCount(1);
    await page.locator('#example').click();
    await expect(page.locator('#risk')).toHaveText('Riesgo alto');
    await page.locator('#erase').click();
    await expect(page.locator('#history li')).toHaveCount(0);
    await page.locator('#clear').click();
    await expect(page.locator('#result')).toBeHidden();
  });
}
