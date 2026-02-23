import './LanguageSelector.css'

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', icon: '🟨' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'go', name: 'Go', icon: '🐹' },
  { id: 'rust', name: 'Rust', icon: '🦀' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚡' },
  { id: 'csharp', name: 'C#', icon: '💜' },
  { id: 'ruby', name: 'Ruby', icon: '💎' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'swift', name: 'Swift', icon: '🍎' },
  { id: 'kotlin', name: 'Kotlin', icon: '🤖' },
]

export default function LanguageSelector({ selectedLanguage, onSelect }) {
  const selectedLangInfo = LANGUAGES.find(l => l.id === selectedLanguage) || LANGUAGES[0]

  return (
    <div className="language-selector">
      <div className="selector-header">
        <h3>🌐 Select Language</h3>
      </div>
      <div className="language-dropdown">
        <select 
          value={selectedLanguage}
          onChange={(e) => onSelect(e.target.value)}
          className="lang-select"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.icon} {lang.name}
            </option>
          ))}
        </select>
        <div className="select-arrow">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
