import { render, screen } from '@testing-library/react'
import { SidebarNav } from '../../components/sidebar-nav'
import { vi, describe, it, expect } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    getProfile: vi.fn().mockResolvedValue({
      display_name: 'Test User',
      picture_url: '',
    }),
  },
}))

describe('SidebarNav', () => {
  it('renders the brand name', () => {
    render(<SidebarNav />)
    expect(screen.getAllByText(/Fami/i)).toHaveLength(2) // Mobile and Desktop
    expect(screen.getAllByText(/Care/i)).toHaveLength(2)
  })

  it('renders navigation items', () => {
    render(<SidebarNav />)
    expect(screen.getAllByText(/หน้าหลัก/i)).toHaveLength(2) // Mobile Bottom Nav and Desktop Sidebar
    expect(screen.getAllByText(/ผู้ป่วย/i)).toHaveLength(2)
  })
})
