export function formatGenerationResult(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return first?.generated_text ?? JSON.stringify(result, null, 2);
}

export function formatSummaryResult(result) {
  const first = Array.isArray(result) ? result[0] : result;
  return first?.summary_text ?? JSON.stringify(result, null, 2);
}

export function formatClassificationResult(result) {
  const list = Array.isArray(result) ? result : [result];
  return list
    .map((item, i) => {
      const label = item?.label ?? `label_${i}`;
      const score = typeof item?.score === 'number' ? item.score.toFixed(4) : 'N/A';
      return `${label}: ${score}`;
    })
    .join('\n');
}

export function formatResult(taskKey, result) {
  if (taskKey === 'generation') return formatGenerationResult(result);
  if (taskKey === 'summarization') return formatSummaryResult(result);
  return formatClassificationResult(result);
}
