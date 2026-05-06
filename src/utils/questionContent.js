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
    const html = katex.renderToString(expression.trim(), {
      displayMode,
      throwOnError: false,
      strict: false
    })
    // Wrap math so surrounding text spacing is preserved and styles can be normalized
    if (displayMode) {
      return `<div class="katex-block">${html}</div>`
    }
    return `<span class="katex-inline">${html}</span>`
  } catch {
    return escapeHtml(expression)
  }
}

function renderPlainText(text) {
  // keep plain text in a span to avoid CSS bleed into KaTeX elements
  return `<span class="plain-text">${escapeHtml(text).replace(/\n/g, '<br>')}</span>`
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
    if (looksLikeLatex(text)) {
      const whole = tryRenderWholeLatex(text)
      if (whole) return displayWrapCandidate(whole)
      return renderPlainText(text)
    }
    return renderPlainText(text)
  }

  result += renderPlainText(text.slice(lastIndex))
  return result
}

function displayWrapCandidate(katexHtml) {
  // try to detect if katexHtml is a block-like expression (contains displaystyle)
  if (/<span[^>]*class="katex-display"|class="katex\s+katex-display"/.test(katexHtml) || /\\displaystyle/.test(katexHtml)) {
    return `<div class="katex-block">${katexHtml}</div>`
  }
  return `<span class="katex-inline">${katexHtml}</span>`
}

export function normalizeLatexInput(content) {
  const text = String(content ?? '').trim()
  if (!text) return text

  // if already contains common LaTeX delimiters, return as-is
  if (/\\\\\(|\\\\\)|\$\$|\$/.test(text)) return text

  // if it looks like LaTeX, wrap as inline math
  if (looksLikeLatex(text)) {
    return `\\(${text}\\)`
  }

  return text
}