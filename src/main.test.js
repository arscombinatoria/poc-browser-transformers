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

  it('キャッシュ済みpipelineを再利用する', async () => {
    const inferMock = vi.fn().mockResolvedValue([{ generated_text: 'cached result' }])
    pipelineMock.mockResolvedValue(inferMock)
    await import('./main.js')

    elements.inputText.value = 'first'
    await elements.runButton.listeners.click()
    elements.inputText.value = 'second'
    await elements.runButton.listeners.click()

    expect(pipelineMock).toHaveBeenCalledTimes(1)
    expect(inferMock).toHaveBeenCalledTimes(2)
    expect(elements.statusText.textContent).toBe('Done')
  })

  it('サマリータスクの出力を整形する', async () => {
    const inferMock = vi.fn().mockResolvedValue([{ summary_text: 'short summary' }])
    pipelineMock.mockResolvedValue(inferMock)
    await import('./main.js')

    elements.taskSelect.value = 'summarization'
    elements.taskSelect.listeners.change()
    elements.inputText.value = 'long text'
    await elements.runButton.listeners.click()

    expect(pipelineMock).toHaveBeenCalledWith('summarization', 'Xenova/distilbart-cnn-6-6')
    expect(elements.outputText.textContent).toBe('short summary')
  })

  it('分類タスクの出力を整形する', async () => {
    const inferMock = vi.fn().mockResolvedValue([
      { label: 'POSITIVE', score: 0.98765 },
      { score: 'bad score' }
    ])
    pipelineMock.mockResolvedValue(inferMock)
    await import('./main.js')

    elements.taskSelect.value = 'classification'
    elements.taskSelect.listeners.change()
    elements.inputText.value = 'great app'
    await elements.runButton.listeners.click()

    expect(pipelineMock).toHaveBeenCalledWith('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english')
    expect(elements.outputText.textContent).toBe('POSITIVE: 0.9877\nlabel_1: N/A')
  })

  it('生成タスクでgenerated_textがない場合はJSON文字列で表示する', async () => {
    const inferMock = vi.fn().mockResolvedValue({ foo: 'bar' })
    pipelineMock.mockResolvedValue(inferMock)
    await import('./main.js')

    elements.taskSelect.value = 'generation'
    elements.inputText.value = 'x'
    await elements.runButton.listeners.click()

    expect(elements.outputText.textContent).toContain('"foo": "bar"')
  })

  it('推論エラー時はエラーメッセージを表示する', async () => {
    const err = new Error('boom')
    pipelineMock.mockRejectedValue(err)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await import('./main.js')

    elements.inputText.value = 'hello'
    await elements.runButton.listeners.click()

    expect(elements.statusText.textContent).toBe('Error')
    expect(elements.errorText.textContent).toBe('エラーが発生しました: boom')
    expect(elements.runButton.disabled).toBe(false)
    spy.mockRestore()
  })

  it('クリアボタンで状態を初期化する', async () => {
    await import('./main.js')

    elements.inputText.value = 'filled'
    elements.outputText.textContent = 'output'
    elements.errorText.textContent = 'error'
    elements.statusText.textContent = 'Done'

    elements.clearButton.listeners.click()

    expect(elements.inputText.value).toBe('')
    expect(elements.outputText.textContent).toBe('')
    expect(elements.errorText.textContent).toBe('')
    expect(elements.statusText.textContent).toBe('Idle')
  })
})
