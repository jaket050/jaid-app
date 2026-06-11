import { useEffect } from 'react'

function Toast({ chamorro, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="toast" role="status">
      <span className="toast__word">{chamorro}</span>
      <span className="toast__text">learned</span>
    </div>
  )
}

export default Toast
