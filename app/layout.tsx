import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from './auth/AuthProvider'

export const metadata = {
  title: 'Alien Chat',
  description: 'Sci‑fi green terminal chat with Supabase'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-black text-white">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}