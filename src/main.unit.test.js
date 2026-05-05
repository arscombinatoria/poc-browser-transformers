import { describe, expect, it } from 'vitest';
import { buildErrorMessage, formatDisplayResult } from './main.js';

describe('main.js unit helpers', () => {
  it('表示文言整形はtaskKeyに応じて処理される', () => {
    expect(formatDisplayResult('generation', [{ generated_text: 'gen' }])).toBe('gen');
    expect(formatDisplayResult('summarization', [{ summary_text: 'sum' }])).toBe('sum');
    expect(formatDisplayResult('classification', [{ label: 'POSITIVE', score: 0.2 }])).toBe('POSITIVE: 0.2000');
  });

  it('例外メッセージはErrorオブジェクトから組み立てる', () => {
    expect(buildErrorMessage(new Error('network failed'))).toBe('エラーが発生しました: network failed');
  });

  it('例外メッセージは非Error値にも対応する', () => {
    expect(buildErrorMessage('unknown failure')).toBe('エラーが発生しました: unknown failure');
  });
});
