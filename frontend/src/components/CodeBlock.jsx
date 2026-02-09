import { useState } from 'react'
import './CodeBlock.css'

// Simple syntax highlighting patterns for common languages
const languagePatterns = {
  javascript: {
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|try|catch|throw|new|this|true|false|null|undefined)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
  },
  python: {
    keywords: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|True|False|None|and|or|not|in|is|lambda|global|nonlocal|pass|break|continue|yield|async|await)\b/g,
    strings: /(["']{3}[\s\S]*?["']{3}|["'](?:(?!\1)[^\\]|\\.)*["'])/g,
    comments: /(#.*$)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
    decorators: /(@\w+)/g,
  },
  java: {
    keywords: /\b(public|private|protected|class|interface|extends|implements|return|if|else|for|while|new|this|static|final|void|int|String|boolean|double|float|long|try|catch|throw|throws|import|package|null|true|false)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[dDfFlL]?)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
    annotations: /(@\w+)/g,
  },
  go: {
    keywords: /\b(func|package|import|return|if|else|for|range|switch|case|default|var|const|type|struct|interface|map|chan|go|defer|select|nil|true|false|make|new|append|len|cap)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
  },
  rust: {
    keywords: /\b(fn|let|mut|const|if|else|for|while|loop|match|return|struct|enum|impl|trait|pub|use|mod|self|Self|true|false|Some|None|Ok|Err|async|await|move|unsafe)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fiu]?\d*)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
    macros: /\b(\w+!)/g,
  },
  typescript: {
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|async|await|try|catch|throw|new|this|true|false|null|undefined|interface|type|enum|implements|extends|private|public|protected|readonly|as|is|keyof|typeof|infer)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
    functions: /\b([a-zA-Z_]\w*)\s*(?=\()/g,
    types: /:\s*([A-Z]\w*)/g,
  },
}

// Language aliases
const languageAliases = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rs: 'rust',
}

function highlightCode(code, language) {
  const lang = languageAliases[language] || language
  const patterns = languagePatterns[lang]

  if (!patterns) {
    return escapeHtml(code)
  }

  let highlighted = escapeHtml(code)

  // Apply highlighting in order (comments last to override)
  if (patterns.strings) {
    highlighted = highlighted.replace(patterns.strings, '<span class="token string">$&</span>')
  }
  if (patterns.numbers) {
    highlighted = highlighted.replace(patterns.numbers, '<span class="token number">$1</span>')
  }
  if (patterns.keywords) {
    highlighted = highlighted.replace(patterns.keywords, '<span class="token keyword">$1</span>')
  }
  if (patterns.functions) {
    highlighted = highlighted.replace(patterns.functions, '<span class="token function">$1</span>')
  }
  if (patterns.decorators) {
    highlighted = highlighted.replace(patterns.decorators, '<span class="token decorator">$1</span>')
  }
  if (patterns.annotations) {
    highlighted = highlighted.replace(patterns.annotations, '<span class="token annotation">$1</span>')
  }
  if (patterns.macros) {
    highlighted = highlighted.replace(patterns.macros, '<span class="token macro">$1</span>')
  }
  if (patterns.comments) {
    highlighted = highlighted.replace(patterns.comments, '<span class="token comment">$1</span>')
  }

  return highlighted
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function CodeBlock({ code, language = 'text', showLineNumbers = true }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const lines = code.split('\n')
  const highlightedCode = highlightCode(code, language)

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <button 
          className={`copy-btn ${copied ? 'copied' : ''}`} 
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="code-block-content">
        {showLineNumbers && (
          <div className="line-numbers">
            {lines.map((_, i) => (
              <span key={i} className="line-number">{i + 1}</span>
            ))}
          </div>
        )}
        <pre className="code-pre">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  )
}
