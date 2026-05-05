import { beforeEach, describe, expect, it, vi } from 'vitest'

const pipelineMock = vi.fn()

vi.mock('@huggingface/transformers', () => ({
  pipeline: pipelineMock
}))

function createElementStub(initial = '') {
  return {
    value: initial,
    textContent: '',
    placeholder: '',
    disabled: false,
    options: [],
    listeners: {},
    append(option) {
      this.options.push(option)
    },
    addEventListener(event, handler) {
      this.listeners[event] = handler
    }
  }
}

describe('main.js', () => {
  let elements

  beforeEach(() => {
    vi.resetModules()
    pipelineMock.mockReset()

    elements = {
      taskSelect: createElementStub(),
      inputText: createElementStub(),
      runButton: createElementStub(),
      clearButton: createElementStub(),
      statusText: createElementStub(''),
      outputText: createElementStub(''),
      errorText: createElementStub('')
    }

    global.document = {
      getElementById(id) {
        return elements[id]
      },
      createElement() {
        return { value: '', textContent: '' }
      }
    }
  })

  it('初期化時にタスク一覧とデフォルトプレースホルダーを設定する', async () => {
    await import('./main.js')

    expect(elements.taskSelect.options).toHaveLength(3)
    expect(elements.taskSelect.value).toBe('generation')
    expect(elements.inputText.placeholder).toBe('Once upon a time')
    expect(elements.runButton.listeners.click).toBeTypeOf('function')
  })

  it('推論実行時にpipelineを呼び出して結果を表示する', async () => {
    const inferMock = vi.fn().mockResolvedValue([{ generated_text: 'Hello world' }])
    pipelineMock.mockResolvedValue(inferMock)

    await import('./main.js')

    elements.inputText.value = 'hello'
    await elements.runButton.listeners.click()

    expect(pipelineMock).toHaveBeenCalledWith('text-generation', 'Xenova/distilgpt2')
    expect(inferMock).toHaveBeenCalledWith('hello')
    expect(elements.outputText.textContent).toBe('Hello world')
    expect(elements.statusText.textContent).toBe('Done')
    expect(elements.errorText.textContent).toBe('')
    expect(elements.runButton.disabled).toBe(false)
  })

  it('入力が空の時はエラーを表示してpipelineを呼び出さない', async () => {
    await import('./main.js')

    elements.inputText.value = '   '
    await elements.runButton.listeners.click()

    expect(pipelineMock).not.toHaveBeenCalled()
    expect(elements.errorText.textContent).toBe('入力テキストを入力してください。')
  })
})
