import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate } from '../api/client'
import { Calculator } from './Calculator'

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, calculate: vi.fn() }
})

const mockedCalculate = vi.mocked(calculate)

function display() {
  return screen.getByRole('status')
}

async function clickKeys(user: ReturnType<typeof userEvent.setup>, names: string[]) {
  for (const name of names) {
    await user.click(screen.getByRole('button', { name }))
  }
}

afterEach(() => {
  mockedCalculate.mockReset()
})

describe('Calculator', () => {
  it('sends a clicked calculation to the API and shows the result', async () => {
    mockedCalculate.mockResolvedValue(8)
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, ['5', 'Add', '3', 'Equals'])

    expect(mockedCalculate).toHaveBeenCalledWith({ operation: 'add', a: 5, b: 3 }, expect.any(AbortSignal))
    await waitFor(() => expect(display()).toHaveTextContent(/^8$/))
  })

  it('accepts keyboard input while the calculator is focused', async () => {
    mockedCalculate.mockResolvedValue(24)
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByRole('region', { name: 'Calculator' }))
    await user.keyboard('12*2{Enter}')

    expect(mockedCalculate).toHaveBeenCalledWith({ operation: 'multiply', a: 12, b: 2 }, expect.any(AbortSignal))
    await waitFor(() => expect(display()).toHaveTextContent(/^24$/))
  })

  it('shows a backend error and clears it on the next digit', async () => {
    mockedCalculate.mockRejectedValue(new ApiError('backend', 'cannot divide by zero'))
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, ['5', 'Divide', '0', 'Equals'])
    await waitFor(() => expect(display()).toHaveTextContent('cannot divide by zero'))

    await clickKeys(user, ['7'])
    expect(display()).toHaveTextContent(/^7$/)
  })

  it('shows a network error message when the request fails', async () => {
    mockedCalculate.mockRejectedValue(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    render(<Calculator />)

    await clickKeys(user, ['5', 'Add', '3', 'Equals'])

    await waitFor(() => expect(display()).toHaveTextContent("Can't reach the server"))
  })
})
