import { useEffect } from 'react'

export function useDocumentTitle(pageName) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = pageName ? `WorkForge — ${pageName}` : 'WorkForge'
    return () => {
      document.title = prevTitle
    }
  }, [pageName])
}

export default useDocumentTitle
