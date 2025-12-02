import { ReactNode } from 'react'
import { AuthProvider } from '../auth/AuthProvider'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">{children}</div>
      </div>
    </AuthProvider>
  )
}