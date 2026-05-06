import katex from 'katex'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderMath(expression, displayMode = false) {
  try {
    return katex.renderToString(expression.trim(), {
      displayMode,
      throwOnError: false,
      strict: false
    })
  } catch {
    return escapeHtml(expression)
  }
}

function renderPlainText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function looksLikeLatex(text) {
  return /\\[a-zA-Z]+|\^|_|\{|\}|\(|\)|\$/.test(text)
}

function tryRenderWholeLatex(text) {
  try {
    return katex.renderToString(text.trim(), {
      displayMode: false,
      throwOnError: false,
      strict: false
    })
  } catch {
    return ''
  }
}

export function renderQuestionContent(content, contentFormat = 'PLAIN_TEXT') {
  const text = String(content ?? '')
  if (!text) return ''

  if (String(contentFormat || '').toUpperCase() !== 'LATEX') {
    return renderPlainText(text)
  }

  const pattern = /\\\((.+?)\\\)|\$\$(.+?)\$\$|\$(.+?)\$/gs
  let result = ''
  let lastIndex = 0
  let foundMath = false

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0
    const fullMatch = match[0]
    const expression = match[1] ?? match[2] ?? match[3] ?? ''
    const displayMode = Boolean(match[2])

    result += renderPlainText(text.slice(lastIndex, index))
    result += renderMath(expression, displayMode)
    lastIndex = index + fullMatch.length
    foundMath = true
  }

  if (!foundMath) {
    return looksLikeLatex(text) ? (tryRenderWholeLatex(text) || renderPlainText(text)) : renderPlainText(text)
  }

  result += renderPlainText(text.slice(lastIndex))
  return result
}