const { deepseekApiKey, deepseekApiUrl, deepseekModel } = require('../config');

function createError(code, message, details) {
  const error = new Error(message);
  error.code = code;
  if (details) error.details = details;
  return error;
}

async function callDeepSeekChat({
  messages,
  responseFormat,
  temperature = 0.2,
  maxTokens = 300,
  timeoutMs = 12000,
  purpose = 'general',
}) {
  if (!deepseekApiKey) {
    throw createError('MISSING_DEEPSEEK_KEY', 'Missing DEEPSEEK_API_KEY');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      model: deepseekModel || 'deepseek-v4-flash',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    };
    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    const response = await fetch(deepseekApiUrl || 'https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await response.text();

    if (!response.ok) {
      console.error('[deepseek] request failed', {
        purpose,
        status: response.status,
        body: rawBody,
      });
      throw createError('DEEPSEEK_FAILED', `DeepSeek request failed with status ${response.status}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (error) {
      console.error('[deepseek] invalid json response', { purpose, body: rawBody });
      throw createError('DEEPSEEK_FAILED', 'DeepSeek returned invalid JSON response');
    }

    const firstChoice = parsed?.choices?.[0] || null;
    const message = firstChoice?.message || {};

    const contentRaw = message?.content;
    const content = Array.isArray(contentRaw)
      ? contentRaw.map((part) => String(part?.text || part?.content || '')).join(' ').trim()
      : String(contentRaw || '').trim();

    if (!content) {
      const reasoningRaw = message?.reasoning_content;
      const reasoning = Array.isArray(reasoningRaw)
        ? reasoningRaw.map((part) => String(part?.text || part?.content || '')).join(' ').trim()
        : String(reasoningRaw || '').trim();

      const emptyDiagnostics = {
        purpose,
        status: response.status,
        model: parsed?.model || payload.model || null,
        finishReason: firstChoice?.finish_reason || null,
        choicesLength: Array.isArray(parsed?.choices) ? parsed.choices.length : 0,
        messageKeys: Object.keys(message || {}),
        contentLength: content.length,
        reasoningContentLength: reasoning.length,
      };
      console.warn('[deepseek] empty content diagnostics', emptyDiagnostics);
      throw createError('DEEPSEEK_EMPTY', 'DeepSeek returned empty content', emptyDiagnostics);
    }

    return content;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createError('DEEPSEEK_TIMEOUT', `DeepSeek request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  callDeepSeekChat,
};
