import { createContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast'



const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6)
    setToasts((prev) => [...prev, { id, type, message, duration }])
    return id
  }, [])

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
  }

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none">
          {toasts.map((item) => (
            <Toast
              key={item.id}
              id={item.id}
              type={item.type}
              message={item.message}
              duration={item.duration}
              onClose={removeToast}
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export { ToastContext }
export default ToastProvider




