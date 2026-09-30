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

  it('チャット結果では最後のassistant本文だけを表示する', () => {
    expect(formatGenerationResult([{ generated_text: [
      { role: 'user', content: '以前の質問' },
      { role: 'assistant', content: '以前の回答' },
      { role: 'user', content: 'こんにちわ' },
      { role: 'assistant', content: 'こんにちは。' }
    ] }])).toBe('こんにちは。');
  });

  it('空のassistant本文を保持する', () => {
    expect(formatGenerationResult([{ generated_text: [{ role: 'assistant', content: '' }] }])).toBe('');
  });

  it.each([
    { messages: [] },
    { messages: [{ role: 'user', content: '質問' }] },
    { messages: [{ role: 'assistant', content: null }] }
  ])('assistant本文が取得できないチャット結果をJSONで表示する: %j', ({ messages }) => {
    const result = [{ generated_text: messages }];
    expect(formatGenerationResult(result)).toBe(JSON.stringify(result, null, 2));
  });

  it('formatGenerationResultはfallbackでJSON文字列を返す', () => {
    expect(formatGenerationResult({ foo: 'bar' })).toBe('{\n  "foo": "bar"\n}');
  });

  it('formatGenerationResultは空配列でもfallbackで空配列JSONを返す', () => {
    expect(formatGenerationResult([])).toBe('[]');
  });

  it('formatSummaryResultはsummary_textを返す', () => {
    expect(formatSummaryResult([{ summary_text: 'short summary' }])).toBe('short summary');
  });

  it('formatSummaryResultはsummary_textがない場合に入力全体をJSON文字列化する', () => {
    expect(formatSummaryResult([{ text: 'not a summary' }])).toBe('[\n  {\n    "text": "not a summary"\n  }\n]');
  });

  it('formatClassificationResultはラベルとスコアを整形する', () => {
    expect(
      formatClassificationResult([
        { label: 'POSITIVE', score: 0.98765 },
        { score: 'bad score' }
      ])
    ).toBe('POSITIVE: 0.9877\nlabel_1: N/A');
  });

  it('formatClassificationResultはnullをラベルなし・スコアなしの分類結果として整形する', () => {
    expect(formatClassificationResult(null)).toBe('label_0: N/A');
  });

  it('formatResultはtaskKeyに応じて処理を切り替える', () => {
    expect(formatResult('generation', [{ generated_text: 'gen' }])).toBe('gen');
    expect(formatResult('generationSmol', [{ generated_text: 'smol gen' }])).toBe('smol gen');
    expect(formatResult('generationBonsai', [{ generated_text: 'bonsai gen' }])).toBe('bonsai gen');
    expect(formatResult('summarization', [{ summary_text: 'sum' }])).toBe('sum');
    expect(formatResult('classification', [{ label: 'NEGATIVE', score: 0.1 }])).toBe('NEGATIVE: 0.1000');
  });

  it('formatResultは未定義タスクを分類結果として整形する', () => {
    expect(formatResult('unknown', { label: 'NEUTRAL', score: 0 })).toBe('NEUTRAL: 0.0000');
  });
});
