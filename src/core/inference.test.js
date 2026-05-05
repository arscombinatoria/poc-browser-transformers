import { describe, expect, it } from 'vitest';
import {
  formatClassificationResult,
  formatGenerationResult,
  formatResult,
  formatSummaryResult
} from './inference.js';

describe('inference formatters', () => {
  it('formatGenerationResultはgenerated_textを返す', () => {
    expect(formatGenerationResult([{ generated_text: 'Hello world' }])).toBe('Hello world');
  });

  it('formatGenerationResultはfallbackでJSON文字列を返す', () => {
    expect(formatGenerationResult({ foo: 'bar' })).toContain('"foo": "bar"');
  });

  it('formatSummaryResultはsummary_textを返す', () => {
    expect(formatSummaryResult([{ summary_text: 'short summary' }])).toBe('short summary');
  });

  it('formatClassificationResultはラベルとスコアを整形する', () => {
    expect(
      formatClassificationResult([
        { label: 'POSITIVE', score: 0.98765 },
        { score: 'bad score' }
      ])
    ).toBe('POSITIVE: 0.9877\nlabel_1: N/A');
  });

  it('formatResultはtaskKeyに応じて処理を切り替える', () => {
    expect(formatResult('generation', [{ generated_text: 'gen' }])).toBe('gen');
    expect(formatResult('summarization', [{ summary_text: 'sum' }])).toBe('sum');
    expect(formatResult('classification', [{ label: 'NEGATIVE', score: 0.1 }])).toBe('NEGATIVE: 0.1000');
  });
});
