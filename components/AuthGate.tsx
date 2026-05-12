import React from 'react'
import { AuthProvider } from '../features/auth/AuthContext'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
