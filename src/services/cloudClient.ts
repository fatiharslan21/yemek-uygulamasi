import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const cloudConfigured = Boolean(url && publishableKey)

export const cloudClient: SupabaseClient | null = cloudConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export async function getCloudUser(): Promise<User | null> {
  if (!cloudClient) return null
  const { data } = await cloudClient.auth.getUser()
  return data.user ?? null
}

export async function signUpWithEmail(email: string, password: string) {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const { data, error } = await cloudClient.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  const { data, error } = await cloudClient.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOutCloud() {
  if (!cloudClient) return
  const { error } = await cloudClient.auth.signOut()
  if (error) throw error
}

export function subscribeCloudAuth(callback: (user: User | null) => void) {
  if (!cloudClient) return () => undefined
  const { data } = cloudClient.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null))
  return () => data.subscription.unsubscribe()
}
