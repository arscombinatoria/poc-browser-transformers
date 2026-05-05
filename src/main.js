import './style.css';
import { pipeline } from '@huggingface/transformers';

const TASK_CONFIGS = {
  generation: {
    label: 'Text Generation',
    task: 'text-generation',
    model: 'Xenova/distilgpt2',
    defaultInput: 'Once upon a time'
  },
  summarization: {
    label: 'Summarization',
    task: 'summarization',
    model: 'Xenova/distilbart-cnn-6-6',
    defaultInput: 'Transformers.js allows you to run machine learning models directly in the browser without a backend server. This proof of concept demonstrates simple tasks in a static app.'
  },
  classification: {
    label: 'Sentiment Classification',
    task: 'sentiment-analysis',
    model: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
    defaultInput: 'I love how easy this browser AI demo is to use.'
  }
};

const pipelineCache = new Map();

const taskSelect = document.getElementById('taskSelect');
const inputText = document.getElementById('inputText');
const runButton = document.getElementById('runButton');
const clearButton = document.getElementById('clearButton');
const statusText = document.getElementById('statusText');
const outputText = document.getElementById('outputText');
const errorText = document.getElementById('errorText');

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
    const option = document.createElement('option');
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
  const pipe = await pipeline(task, model);
  pipelineCache.set(taskKey, pipe);
  return pipe;
}

function formatGenerationResult(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return first?.generated_text ?? JSON.stringify(result, null, 2);
}

function formatSummaryResult(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return first?.summary_text ?? JSON.stringify(result, null, 2);
}

function formatClassificationResult(result) {
  const list = Array.isArray(result) ? result : [result];
  return list
    .map((item, i) => {
      const label = item?.label ?? `label_${i}`;
      const score = typeof item?.score === 'number' ? item.score.toFixed(4) : 'N/A';
      return `${label}: ${score}`;
    })
    .join('\n');
}

function formatResult(taskKey, result) {
  if (taskKey === 'generation') return formatGenerationResult(result);
  if (taskKey === 'summarization') return formatSummaryResult(result);
  return formatClassificationResult(result);
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
    setOutput(formatResult(taskKey, result));
    setStatus('Done');
  } catch (error) {
    console.error(error);
    setError(`エラーが発生しました: ${error?.message ?? String(error)}`);
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
