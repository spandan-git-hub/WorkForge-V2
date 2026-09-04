import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce a fast-changing value.
 * @param {any} value
 * @param {number} delay in milliseconds
 * @returns {any} debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
