import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { cloudClient } from './cloudClient'

const RECOVERY_KEY = 'lokma.pending-password-recovery'

export function hasPendingPasswordRecovery() {
  return window.sessionStorage.getItem(RECOVERY_KEY) === '1'
}

export function clearPendingPasswordRecovery() {
  window.sessionStorage.removeItem(RECOVERY_KEY)
}

function markPasswordRecoveryPending() {
  window.sessionStorage.setItem(RECOVERY_KEY, '1')
  window.dispatchEvent(new CustomEvent('lokma:password-recovery'))
}

function recoveryParams(url: URL) {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  return {
    type: url.searchParams.get('type') ?? hash.get('type'),
    code: url.searchParams.get('code') ?? hash.get('code'),
    accessToken: url.searchParams.get('access_token') ?? hash.get('access_token'),
    refreshToken: url.searchParams.get('refresh_token') ?? hash.get('refresh_token'),
  }
}

async function handleAuthUrl(rawUrl: string) {
  if (!cloudClient) return

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return
  }

  const normalizedPath = url.pathname.replace(/\/$/, '')
  const isLokmaRecovery = url.protocol === 'lokma:' && url.hostname === 'auth' && normalizedPath === '/reset'
  if (!isLokmaRecovery) return

  const params = recoveryParams(url)
  if (params.type && params.type !== 'recovery') return

  if (params.code) {
    const { error } = await cloudClient.auth.exchangeCodeForSession(params.code)
    if (error) throw error
  } else if (params.accessToken && params.refreshToken) {
    const { error } = await cloudClient.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    })
    if (error) throw error
  } else {
    return
  }

  markPasswordRecoveryPending()
}

export async function initializeNativeAuthLinks() {
  if (cloudClient) {
    cloudClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') markPasswordRecoveryPending()
    })
  }

  if (!Capacitor.isNativePlatform()) return

  const launchUrl = await App.getLaunchUrl()
  if (launchUrl?.url) {
    await handleAuthUrl(launchUrl.url).catch(() => {
      window.dispatchEvent(new CustomEvent('lokma:password-recovery-error'))
    })
  }

  await App.addListener('appUrlOpen', ({ url }) => {
    void handleAuthUrl(url).catch(() => {
      window.dispatchEvent(new CustomEvent('lokma:password-recovery-error'))
    })
  })
}
