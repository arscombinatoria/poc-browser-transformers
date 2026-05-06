import { beforeEach, describe, expect, it, vi } from 'vitest';

const pipelineMock = vi.fn();

vi.mock('@huggingface/transformers', () => ({
  pipeline: pipelineMock
}));

function createElementStub(initial = '') {
  return {
    value: initial,
    textContent: '',
    placeholder: '',
    disabled: false,
    options: [],
    listeners: {},
    append(option) {
      this.options.push(option);
    },
    addEventListener(event, handler) {
      this.listeners[event] = handler;
    }
  };
}

describe('main.js initApp (UI integration)', () => {
  let elements;

  beforeEach(() => {
    vi.resetModules();
    pipelineMock.mockReset();

    elements = {
      taskSelect: createElementStub(),
      dtypeSelect: createElementStub('q4'),
      inputText: createElementStub(),
      maxNewTokens: createElementStub('64'),
      maxNewTokensValue: createElementStub(''),
      runButton: createElementStub(),
      clearButton: createElementStub(),
      statusText: createElementStub(''),
      outputText: createElementStub(''),
      errorText: createElementStub('')
    };

    global.document = {
      getElementById(id) {
        return elements[id];
      },
      createElement() {
        return { value: '', textContent: '' };
      }
    };
  });

  it('初期化時にDOM要素へイベントを接続し初期状態を設定する', async () => {
    const { initApp } = await import('./main.js');
    initApp(global.document);

    expect(elements.taskSelect.options).toHaveLength(8);
    expect(elements.taskSelect.value).toBe('generation');
    expect(elements.inputText.placeholder).toBe('Once upon a time');
    expect(elements.dtypeSelect.value).toBe('q4');
    expect(elements.maxNewTokensValue.textContent).toBe('64');
    expect(elements.maxNewTokens.listeners.input).toBeTypeOf('function');
    expect(elements.runButton.listeners.click).toBeTypeOf('function');
    expect(elements.clearButton.listeners.click).toBeTypeOf('function');
    expect(elements.taskSelect.listeners.change).toBeTypeOf('function');
  });

  it('イベントフロー: clickで推論実行、change/clearで表示をリセットする', async () => {
    const pipe = vi.fn().mockResolvedValue([{ generated_text: 'ok' }]);
    pipelineMock.mockResolvedValue(pipe);

    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.inputText.value = 'hello';
    await elements.runButton.listeners.click();

    expect(pipelineMock).toHaveBeenCalledWith('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'q4',
      device: 'webgpu',
      max_new_tokens: 64
    });
    expect(pipe).toHaveBeenCalledWith('hello');
    expect(elements.outputText.textContent).toBe('ok');
    expect(elements.statusText.textContent).toMatch(/^Done \(\d+\.\d{2}s\)$/);

    elements.outputText.textContent = 'dirty';
    elements.errorText.textContent = 'dirty';
    elements.taskSelect.value = 'summarization';
    elements.taskSelect.listeners.change();
    expect(elements.outputText.textContent).toBe('');
    expect(elements.errorText.textContent).toBe('');
    expect(elements.statusText.textContent).toBe('Idle');

    elements.inputText.value = 'remain';
    elements.clearButton.listeners.click();
    expect(elements.inputText.value).toBe('');
    expect(elements.outputText.textContent).toBe('');
    expect(elements.errorText.textContent).toBe('');
    expect(elements.statusText.textContent).toBe('Idle');
  });

  it('入力が空の場合は推論せずエラーを表示する', async () => {
    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.inputText.value = '    ';
    await elements.runButton.listeners.click();

    expect(pipelineMock).not.toHaveBeenCalled();
    expect(elements.errorText.textContent).toBe('入力テキストを入力してください。');
  });

  it('pipelineが失敗した場合はエラー状態になりボタンを再有効化する', async () => {
    pipelineMock.mockRejectedValue(new Error('load failed'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.inputText.value = 'hello';
    await elements.runButton.listeners.click();

    expect(elements.statusText.textContent).toBe('Error');
    expect(elements.errorText.textContent).toContain('load failed');
    expect(elements.runButton.disabled).toBe(false);
    errorSpy.mockRestore();
  });


  it('dtypeを変更すると別pipelineとして初期化する', async () => {
    const pipe = vi.fn().mockResolvedValue([{ generated_text: 'ok' }]);
    pipelineMock.mockResolvedValue(pipe);

    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.inputText.value = 'first';
    await elements.runButton.listeners.click();

    elements.dtypeSelect.value = 'fp16';
    elements.inputText.value = 'second';
    await elements.runButton.listeners.click();

    expect(pipelineMock).toHaveBeenCalledTimes(2);
    expect(pipelineMock).toHaveBeenNthCalledWith(1, 'text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'q4',
      device: 'webgpu',
      max_new_tokens: 64
    });
    expect(pipelineMock).toHaveBeenNthCalledWith(2, 'text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'fp16',
      device: 'webgpu',
      max_new_tokens: 64
    });
  });


  it('max_new_tokensスライダーの値をpipelineFactoryへ渡す', async () => {
    const pipe = vi.fn().mockResolvedValue([{ generated_text: 'ok' }]);
    pipelineMock.mockResolvedValue(pipe);

    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.maxNewTokens.value = '128';
    elements.maxNewTokens.listeners.input();
    elements.inputText.value = 'hello';
    await elements.runButton.listeners.click();

    expect(elements.maxNewTokensValue.textContent).toBe('128');
    expect(pipelineMock).toHaveBeenCalledWith('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
      dtype: 'q4',
      device: 'webgpu',
      max_new_tokens: 128
    });
  });

  it('同一タスク2回目の実行でpipelineキャッシュを利用する', async () => {
    const pipe = vi.fn().mockResolvedValue([{ generated_text: 'ok' }]);
    pipelineMock.mockResolvedValue(pipe);

    const { initApp } = await import('./main.js');
    initApp(global.document);

    elements.inputText.value = 'first';
    await elements.runButton.listeners.click();
    elements.inputText.value = 'second';
    await elements.runButton.listeners.click();

    expect(pipelineMock).toHaveBeenCalledTimes(1);
    expect(pipe).toHaveBeenCalledTimes(2);
    expect(elements.statusText.textContent).toMatch(/^Done \(\d+\.\d{2}s\)$/);
  });
});
