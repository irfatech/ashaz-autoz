const AUTH_KEY = "app_auth"
const AUTH_TIMESTAMP_KEY = "app_auth_ts"
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000

export const APP_PASSWORD = "ashaz2026"

export function isAuthenticated(): boolean {
  if (typeof sessionStorage === "undefined") return false
  const ts = sessionStorage.getItem(AUTH_TIMESTAMP_KEY)
  if (!ts) return false
  if (Date.now() - Number(ts) > SESSION_DURATION_MS) {
    logout()
    return false
  }
  return sessionStorage.getItem(AUTH_KEY) === "true"
}

export function login(password: string): boolean {
  if (password !== APP_PASSWORD) return false
  sessionStorage.setItem(AUTH_KEY, "true")
  sessionStorage.setItem(AUTH_TIMESTAMP_KEY, String(Date.now()))
  return true
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(AUTH_TIMESTAMP_KEY)
}
