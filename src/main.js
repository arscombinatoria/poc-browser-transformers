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

export function initApp(documentLike, options = {}) {
  const pipelineCache = new Map();
  const pipelineFactory = options.pipelineFactory ?? globalThis.__TEST_PIPELINE__ ?? defaultPipeline;

  const taskSelect = documentLike.getElementById('taskSelect');
  const inputText = documentLike.getElementById('inputText');
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

  async function getPipeline(taskKey) {
    if (pipelineCache.has(taskKey)) {
      setStatus('Using cached pipeline...');
      return pipelineCache.get(taskKey);
    }

    const { task, model } = TASK_CONFIGS[taskKey];
    setStatus(`Loading model (${model})...`);
    const pipe = await pipelineFactory(task, model, {
      dtype: 'q4',
      device: 'webgpu'
    });
    pipelineCache.set(taskKey, pipe);
    return pipe;
  }

  async function runInference() {
    const text = inputText.value.trim();
    const taskKey = getCurrentTaskKey();
    if (!text) {
      setError('入力テキストを入力してください。');
      return;
    }

    runButton.disabled = true;
    setError('');
    setOutput('');

    try {
      const pipe = await getPipeline(taskKey);
      setStatus('Running inference...');
      const result = await pipe(text);
      setOutput(formatDisplayResult(taskKey, result));
      setStatus('Done');
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

  populateTaskSelect();
  taskSelect.value = 'generation';
  applyDefaultInput();
}

if (typeof document !== 'undefined') {
  initApp(document);
}
