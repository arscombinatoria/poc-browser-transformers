import { test, expect } from '@playwright/test';


test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__TEST_PIPELINE__ = async (task) => {
      if (task === 'text-generation') {
        return async (text) => [{ generated_text: `${text}...generated` }];
      }

      if (task === 'summarization') {
        return async (text) => [{ summary_text: `${text.slice(0, 20)}...summary` }];
      }

      return async () => [{ label: 'POSITIVE', score: 0.99 }];
    };
  });
});

test('タスク選択でプレースホルダーが切り替わる', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#inputText')).toHaveAttribute('placeholder', 'Once upon a time');
  await page.selectOption('#taskSelect', 'summarization');
  await expect(page.locator('#inputText')).toHaveAttribute(
    'placeholder',
    'Transformers.js allows you to run machine learning models directly in the browser without a backend server. This proof of concept demonstrates simple tasks in a static app.'
  );
});

test('実行ボタンで推論結果が表示される', async ({ page }) => {
  await page.goto('/');

  await page.fill('#inputText', 'hello world');
  await page.click('#runButton');

  await expect(page.locator('#statusText')).toHaveText(/^Done \(\d+\.\d{2}s\)$/);
  await expect(page.locator('#outputText')).toContainText('hello world...generated');
  await expect(page.locator('#errorText')).toHaveText('');
});

test('クリアボタンで状態が初期化される', async ({ page }) => {
  await page.goto('/');

  await page.fill('#inputText', 'to be cleared');
  await page.click('#runButton');
  await expect(page.locator('#outputText')).not.toHaveText('');

  await page.click('#clearButton');
  await expect(page.locator('#inputText')).toHaveValue('');
  await expect(page.locator('#statusText')).toHaveText('Idle');
  await expect(page.locator('#outputText')).toHaveText('');
  await expect(page.locator('#errorText')).toHaveText('');
});


test('空白入力で実行すると推論せずエラーが表示される', async ({ page }) => {
  await page.goto('/');

  await page.fill('#inputText', '   ');
  await page.click('#runButton');

  await expect(page.locator('#statusText')).toHaveText('Idle');
  await expect(page.locator('#outputText')).toHaveText('');
  await expect(page.locator('#errorText')).toHaveText('入力テキストを入力してください。');
});
