import { render, screen, waitFor } from '@testing-library/react'
import { HealthDashboard } from '../../components/health-dashboard'
import { vi, describe, it, expect } from 'vitest'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getProfile: vi.fn().mockResolvedValue({
      display_name: 'Test User',
      primary_patient_id: 'p1',
    }),
    getPatients: vi.fn().mockResolvedValue([
      {
        id: 'p1',
        name: 'Patient One',
        date_of_birth: '1950-01-01',
        underlying_diseases: ['เบาหวาน'],
      }
    ]),
    getStats: vi.fn().mockResolvedValue({
      total_patients: 1,
      total_members: 2,
      total_logs: 5,
      active_alerts: 0,
      latest_log: {
        id: 'l1',
        measured_at: new Date().toISOString(),
        bp_1_sys: 118,
        bp_1_dia: 78,
        pulse: 70,
        next_appointment: null,
      }
    }),
    getMembers: vi.fn().mockResolvedValue([]),
  },
}))

describe('HealthDashboard', () => {
  it('renders the health dashboard with patient info', async () => {
    render(<HealthDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/Patient One/i)).toBeInTheDocument()
    }, { timeout: 5000 })
    
    expect(screen.getAllByText(/ความดันโลหิต/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/118\/78/)).toBeInTheDocument()
    expect(screen.getByText(/ชีพจร/i)).toBeInTheDocument()
    expect(screen.getByText(/70/)).toBeInTheDocument()


  })

  it('renders the vitals cards with correct data', async () => {
    render(<HealthDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/118\/78/)).toBeInTheDocument()
    })
  })
})
