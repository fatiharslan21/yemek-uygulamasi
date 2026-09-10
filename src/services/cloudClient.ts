import { createClient, type AuthChangeEvent, type SupabaseClient, type User } from '@supabase/supabase-js'

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

function ensureCloudClient() {
  if (!cloudClient) throw new Error('Bulut bağlantısı henüz yapılandırılmadı.')
  return cloudClient
}

function passwordResetRedirectUrl() {
  const configured = import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL?.trim()
  if (configured) return configured
  return `${window.location.origin}${window.location.pathname}`
}

export async function getCloudUser(): Promise<User | null> {
  if (!cloudClient) return null
  const { data, error } = await cloudClient.auth.getUser()
  if (error) throw error
  return data.user ?? null
}

export async function signUpWithEmail(email: string, password: string) {
  const client = ensureCloudClient()
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const client = ensureCloudClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function requestPasswordReset(email: string) {
  const client = ensureCloudClient()
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl(),
  })
  if (error) throw error
}

export async function updateCloudPassword(password: string) {
  const client = ensureCloudClient()
  const { error } = await client.auth.updateUser({ password })
  if (error) throw error
}

export async function signOutCloud() {
  if (!cloudClient) return
  const { error } = await cloudClient.auth.signOut()
  if (error) throw error
}

export async function deleteCloudAccount() {
  const client = ensureCloudClient()
  const { data, error } = await client.functions.invoke('delete-account')
  if (error) throw error
  if (!data?.deleted) throw new Error(data?.error ?? 'Hesap silme işlemi tamamlanamadı.')
  await client.auth.signOut({ scope: 'local' })
}

export function subscribeCloudAuth(callback: (user: User | null, event: AuthChangeEvent) => void) {
  if (!cloudClient) return () => undefined
  const { data } = cloudClient.auth.onAuthStateChange((event, session) => callback(session?.user ?? null, event))
  return () => data.subscription.unsubscribe()
}
