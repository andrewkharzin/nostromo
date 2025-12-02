'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '../../lib/supabase/client'
import { User } from '@supabase/supabase-js'


interface AuthContextProps {
user: User | null
signIn: (email: string) => Promise<void>
signOut: () => Promise<void>
loading: boolean
}


const AuthContext = createContext<AuthContextProps>({ user: null, signIn: async () => {}, signOut: async () => {}, loading: true })


export function AuthProvider({ children }: { children: ReactNode }) {
const [user, setUser] = useState<User | null>(null)
const [loading, setLoading] = useState<boolean>(true)


useEffect(() => {
const supabase = createClient()
let mounted = true


const initUser = async () => {
const { data } = await supabase.auth.getUser()
if (!mounted) return
setUser(data?.user ?? null)
setLoading(false)
}
initUser()


const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
setUser(session?.user ?? null)
setLoading(false)
})


return () => { mounted = false; listener?.subscription?.unsubscribe?.() }
}, [])


const signIn = async (email: string) => {
if (!email) return
const supabase = createClient()
await supabase.auth.signInWithOtp({ email })
}


const signOut = async () => {
const supabase = createClient()
await supabase.auth.signOut()
setUser(null)
}


return <AuthContext.Provider value={{ user, signIn, signOut, loading }}>{children}</AuthContext.Provider>
}


export const useAuth = () => useContext(AuthContext)