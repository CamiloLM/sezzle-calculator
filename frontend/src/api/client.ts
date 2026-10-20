import type { CalculateFailure, CalculateRequest, CalculateSuccess } from './types'

export const REQUEST_TIMEOUT_MS = 5000
export const NETWORK_ERROR_MESSAGE = "Can't reach the server"

const CALCULATE_URL = '/api/v1/calculate'

type ApiErrorKind = 'backend' | 'network'

/**
 * - backend: the server rejected the calculation; the message is the server's own
 * - network: no usable answer (fetch failed, timeout, unexpected body)
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind

  constructor(kind: ApiErrorKind, message: string) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
  }
}

function isSuccess(body: unknown): body is CalculateSuccess {
  return typeof body === 'object' && body !== null && 'result' in body && typeof body.result === 'number'
}

function isFailure(body: unknown): body is CalculateFailure {
  return typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
}

/** Asks the backend for one calculation. Rejects with ApiError, or with the AbortError if `signal` aborts. */
export async function calculate(request: CalculateRequest, signal?: AbortSignal): Promise<number> {
  const { operation, a, b } = request
  let response: Response
  let body: unknown
  try {
    response = await fetch(CALCULATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b === undefined ? { operation, a } : { operation, a, b }),
      signal: AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...(signal ? [signal] : [])]),
    })
    body = await response.json()
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError('network', NETWORK_ERROR_MESSAGE)
  }

  if (response.ok && isSuccess(body)) return body.result
  if (!response.ok && isFailure(body)) throw new ApiError('backend', body.error)
  throw new ApiError('network', NETWORK_ERROR_MESSAGE)
}
