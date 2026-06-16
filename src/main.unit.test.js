import { describe, expect, it } from 'vitest';
import { buildErrorMessage, formatDisplayResult, formatElapsedSeconds } from './main.js';

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

  it('例外メッセージはnullish値でも失敗理由を文字列化する', () => {
    expect(buildErrorMessage(null)).toBe('エラーが発生しました: null');
    expect(buildErrorMessage(undefined)).toBe('エラーが発生しました: undefined');
  });

  it('経過秒数は小数点2桁で表示する', () => {
    expect(formatElapsedSeconds(1234)).toBe('1.23');
  });

  it('経過秒数は0ミリ秒と丸め境界でも小数点2桁を維持する', () => {
    expect(formatElapsedSeconds(0)).toBe('0.00');
    expect(formatElapsedSeconds(999)).toBe('1.00');
  });
});
