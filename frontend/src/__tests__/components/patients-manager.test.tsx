import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { PatientsManager } from '../../components/patients-manager'
import { vi, describe, it, expect } from 'vitest'

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    getPatients: vi.fn().mockResolvedValue([
      {
        id: 'p1',
        name: 'Patient One',
        date_of_birth: '1950-01-01',
        birth_year_only: false,
        underlying_diseases: [],
        isActive: true,
      },
      {
        id: 'p2',
        name: 'Patient Two',
        date_of_birth: '1960-01-01',
        birth_year_only: false,
        underlying_diseases: [],
        isActive: false,
      }
    ]),
    getProfile: vi.fn().mockResolvedValue({
      primary_patient_id: 'p1'
    }),
    createPatient: vi.fn().mockResolvedValue({ id: 'p3' }),
    updatePatient: vi.fn().mockResolvedValue({ id: 'p1' }),
    deletePatient: vi.fn().mockResolvedValue({ success: true }),
  },
}))

describe('PatientsManager', () => {
  it('renders the list of patients', async () => {
    render(<PatientsManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/Patient One/i)).toBeInTheDocument()
      expect(screen.getByText(/Patient Two/i)).toBeInTheDocument()
    })

  })

  it('opens add patient dialog when clicking the button', async () => {
    render(<PatientsManager />)
    
    // Wait for loading to finish and find the "Add" button
    const addButton = await screen.findByText(/เพิ่มผู้ป่วยใหม่/i)
    fireEvent.click(addButton)
    
    expect(screen.getByText(/เพิ่มโปรไฟล์ผู้ป่วยใหม่/i)).toBeInTheDocument()
  })
})
