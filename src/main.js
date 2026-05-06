import './style.css';
import { pipeline as defaultPipeline } from '@huggingface/transformers';
import { formatResult } from './core/inference.js';

const TASK_CONFIGS = {
  generation: {
    label: 'Text Generation',
    task: 'text-generation',
    model: 'onnx-community/Qwen2.5-0.5B-Instruct',
    defaultInput: 'Once upon a time'
  },
  generationSmol: {
    label: 'Text Generation',
    task: 'text-generation',
    model: 'HuggingFaceTB/SmolLM2-360M-Instruct',
    defaultInput: 'Once upon a time'
  },
  generationGemma: {
    label: 'Text Generation',
    task: 'text-generation',
    model: 'onnx-community/gemma-3-270m-it-ONNX',
    defaultInput: 'Once upon a time'
  },
  summarization: {
    label: 'Summarization',
    task: 'summarization',
    model: 'Xenova/distilbart-cnn-6-6',
    defaultInput:
      'Transformers.js allows you to run machine learning models directly in the browser without a backend server. This proof of concept demonstrates simple tasks in a static app.'
  },
  classification: {
    label: 'Sentiment Classification',
    task: 'sentiment-analysis',
    model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    defaultInput: 'I love how easy this browser AI demo is to use.'
  }
};

export function buildErrorMessage(error) {
  return `エラーが発生しました: ${error?.message ?? String(error)}`;
}

export function formatDisplayResult(taskKey, result) {
  return formatResult(taskKey, result);
}

export function formatElapsedSeconds(milliseconds) {
  return (milliseconds / 1000).toFixed(2);
}

export function initApp(documentLike, options = {}) {
  const pipelineCache = new Map();
  const pipelineFactory = options.pipelineFactory ?? globalThis.__TEST_PIPELINE__ ?? defaultPipeline;

  const taskSelect = documentLike.getElementById('taskSelect');
  const dtypeSelect = documentLike.getElementById('dtypeSelect');
  const inputText = documentLike.getElementById('inputText');
  const maxNewTokensInput = documentLike.getElementById('maxNewTokens');
  const maxNewTokensValue = documentLike.getElementById('maxNewTokensValue');
  const runButton = documentLike.getElementById('runButton');
  const clearButton = documentLike.getElementById('clearButton');
  const statusText = documentLike.getElementById('statusText');
  const outputText = documentLike.getElementById('outputText');
  const errorText = documentLike.getElementById('errorText');

  function setStatus(message) {
    statusText.textContent = message;
  }

  function setError(message = '') {
    errorText.textContent = message;
  }

  function setOutput(message = '') {
    outputText.textContent = message;
  }

  function populateTaskSelect() {
    Object.entries(TASK_CONFIGS).forEach(([key, config]) => {
      const option = documentLike.createElement('option');
      option.value = key;
      option.textContent = `${config.label} (${config.model})`;
      taskSelect.append(option);
    });
  }

  function getCurrentTaskKey() {
    return taskSelect.value;
  }

  function applyDefaultInput() {
    const key = getCurrentTaskKey();
    inputText.placeholder = TASK_CONFIGS[key].defaultInput;
  }

  function getCurrentDtype() {
    return dtypeSelect?.value || 'q4';
  }

  function getPipelineCacheKey(taskKey, dtype) {
    return `${taskKey}:${dtype}`;
  }

  function getMaxNewTokens() {
    return Number(maxNewTokensInput?.value || 128);
  }

  function syncMaxNewTokensLabel() {
    if (maxNewTokensValue) {
      maxNewTokensValue.textContent = String(getMaxNewTokens());
    }
  }

  async function getPipeline(taskKey, dtype) {
    const cacheKey = getPipelineCacheKey(taskKey, dtype);
    if (pipelineCache.has(cacheKey)) {
      setStatus('Using cached pipeline...');
      return pipelineCache.get(cacheKey);
    }

    const { task, model } = TASK_CONFIGS[taskKey];
    setStatus(`Loading model (${model})...`);
    const pipe = await pipelineFactory(task, model, {
      dtype,
      device: 'webgpu'
    });
    pipelineCache.set(cacheKey, pipe);
    return pipe;
  }

  async function runInference() {
    const text = inputText.value.trim();
    const taskKey = getCurrentTaskKey();
    const dtype = getCurrentDtype();
    if (!text) {
      setError('入力テキストを入力してください。');
      return;
    }

    runButton.disabled = true;
    setError('');
    setOutput('');

    try {
      const pipe = await getPipeline(taskKey, dtype);
      setStatus('Running inference...');
      const startTime = globalThis.performance?.now?.() ?? Date.now();
      const generationOptions = taskKey.startsWith('generation')
        ? { max_new_tokens: getMaxNewTokens() }
        : undefined;
      const result = await pipe(text, generationOptions);
      const elapsedMilliseconds = (globalThis.performance?.now?.() ?? Date.now()) - startTime;
      setOutput(formatDisplayResult(taskKey, result));
      setStatus(`Done (${formatElapsedSeconds(elapsedMilliseconds)}s)`);
    } catch (error) {
      console.error(error);
      setError(buildErrorMessage(error));
      setStatus('Error');
    } finally {
      runButton.disabled = false;
    }
  }

  runButton.addEventListener('click', runInference);
  clearButton.addEventListener('click', () => {
    inputText.value = '';
    setOutput('');
    setError('');
    setStatus('Idle');
  });
  taskSelect.addEventListener('change', () => {
    setOutput('');
    setError('');
    setStatus('Idle');
    applyDefaultInput();
  });
  maxNewTokensInput?.addEventListener('input', syncMaxNewTokensLabel);

  populateTaskSelect();
  taskSelect.value = 'generation';
  applyDefaultInput();
  syncMaxNewTokensLabel();
}

if (typeof document !== 'undefined') {
  initApp(document);
}
