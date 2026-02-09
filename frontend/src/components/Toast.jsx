import { useEffect, useState } from 'react'
import './Toast.css'

export default function Toast({ message, type = 'info', onClose }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, 2700)

    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        )
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        )
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        )
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        )
    }
  }

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  )
}
