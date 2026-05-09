import { vi, describe, it, expect, beforeEach } from 'vitest'
import { fetchWithAuth, api } from '../../lib/api'

// Mock fetch
global.fetch = vi.fn()

describe('api lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('fetchWithAuth', () => {
    it('sends authorization header when token exists', async () => {
      localStorage.setItem('famicare_token', 'test-token')
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'success' }),
      })

      await fetchWithAuth('/test')

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test'), expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      }))
    })

    it('throws error when response is not ok', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Error message' }),
      })

      await expect(fetchWithAuth('/test')).rejects.toThrow('Error message')
    })

    it('redirects to login on 401', async () => {
      // Mock window.location safely
      const originalLocation = window.location
      const mockLocation = { href: '' }
      
      // Use Object.defineProperty to bypass read-only property if needed
      delete (window as any).location
      window.location = mockLocation as any

      ;(fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      })

      localStorage.setItem('famicare_token', 'some-token')

      try {
        await fetchWithAuth('/test')
      } catch (e) {
        // expected
      }

      expect(mockLocation.href).toBe('/login')
      const token = localStorage.getItem('famicare_token')
      expect(token).toBe(null)

      // Restore
      ;(window as any).location = originalLocation
    })
  })

  describe('api helpers', () => {
    it('getProfile calls correct endpoint', async () => {
      ;(fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ name: 'User' }),
      })

      await api.getProfile()
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/auth/profile'), expect.anything())
    })
  })
})
