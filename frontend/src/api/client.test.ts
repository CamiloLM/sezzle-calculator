import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate, NETWORK_ERROR_MESSAGE } from './client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch() {
  return vi.spyOn(globalThis, 'fetch')
}

/** Awaits a promise that must reject and returns what it rejected with. */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the promise to reject')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('calculate', () => {
  it('posts the request as JSON to the calculate endpoint', async () => {
    const fetchSpy = mockFetch().mockResolvedValue(jsonResponse({ result: 8 }))

    await calculate({ operation: 'add', a: 5, b: 3 })

    expect(fetchSpy).toHaveBeenCalledWith('/api/v1/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: 'add', a: 5, b: 3 }),
      signal: expect.any(AbortSignal),
    })
  })

  it('omits b for sqrt', async () => {
    const fetchSpy = mockFetch().mockResolvedValue(jsonResponse({ result: 4 }))

    await calculate({ operation: 'sqrt', a: 16 })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body).toStrictEqual({ operation: 'sqrt', a: 16 })
  })

  it('returns the result', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ result: 8 }))

    await expect(calculate({ operation: 'add', a: 5, b: 3 })).resolves.toBe(8)
  })

  it('throws a backend ApiError with the message from the server', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ error: 'cannot divide by zero' }, 400))

    const error = await rejection(calculate({ operation: 'divide', a: 8, b: 0 }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'ApiError', kind: 'backend', message: 'cannot divide by zero' })
  })

  it.each<[string, () => Promise<Response>]>([
    ['fetch fails', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['the request times out', () => Promise.reject(new DOMException('timed out', 'TimeoutError'))],
    ['the response is not JSON', () => Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502 }))],
    ['a success has no numeric result', () => Promise.resolve(jsonResponse({ result: 'eight' }))],
    ['an error has no string message', () => Promise.resolve(jsonResponse({ error: 42 }, 400))],
  ])('throws a network ApiError when %s', async (_name, respond) => {
    mockFetch().mockImplementation(respond)

    const error = await rejection(calculate({ operation: 'add', a: 5, b: 3 }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'network', message: NETWORK_ERROR_MESSAGE })
  })

  it("rethrows the AbortError when the caller's signal aborts", async () => {
    mockFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
        }),
    )
    const controller = new AbortController()

    const pending = rejection(calculate({ operation: 'add', a: 5, b: 3 }, controller.signal))
    controller.abort()
    const error = await pending

    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })
})
