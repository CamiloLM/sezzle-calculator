import { useCallback, useEffect, useReducer, type KeyboardEvent } from 'react'
import { ApiError, calculate, NETWORK_ERROR_MESSAGE } from '../api/client'
import { actionForKey } from '../calculator/keymap'
import { calculatorReducer, initialState } from '../calculator/reducer'

/** Wires the pure reducer to the API: sends `state.request` and dispatches the answer. */
export function useCalculator() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState)
  const { request } = state

  useEffect(() => {
    if (request === null) return

    const controller = new AbortController()
    const { operation, a, b } = request
    calculate({ operation, a, b }, controller.signal)
      .then((result) => dispatch({ type: 'resolved', result }))
      .catch((error: unknown) => {
        // Our own cleanup aborted the call; the reducer has moved on already.
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : NETWORK_ERROR_MESSAGE
        dispatch({ type: 'failed', message })
      })

    return () => controller.abort()
  }, [request])

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const action = actionForKey(event.key)
    if (action === null) return
    event.preventDefault()
    dispatch(action)
  }, [])

  return { state, dispatch, onKeyDown }
}
