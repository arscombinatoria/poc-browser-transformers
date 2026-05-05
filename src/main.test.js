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

describe('main.js initApp', () => {
  let elements;

  beforeEach(() => {
    vi.resetModules();
    pipelineMock.mockReset();

    elements = {
      taskSelect: createElementStub(),
      inputText: createElementStub(),
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

    const beforeRun = elements.runButton.listeners.click;
    const beforeClear = elements.clearButton.listeners.click;
    const beforeChange = elements.taskSelect.listeners.change;

    initApp(global.document);

    expect(elements.taskSelect.options).toHaveLength(6);
    expect(elements.taskSelect.value).toBe('generation');
    expect(elements.inputText.placeholder).toBe('Once upon a time');
    expect(elements.runButton.listeners.click).toBeTypeOf('function');
    expect(elements.clearButton.listeners.click).toBeTypeOf('function');
    expect(elements.taskSelect.listeners.change).toBeTypeOf('function');

    expect(elements.runButton.listeners.click).not.toBe(beforeRun);
    expect(elements.clearButton.listeners.click).not.toBe(beforeClear);
    expect(elements.taskSelect.listeners.change).not.toBe(beforeChange);
  });
});
