// User role/tier system
// Admin users get access to Designer Mode FAB and other advanced features

const ADMIN_EMAILS = [
  'thethanhster@gmail.com',
]

export type UserRole = 'admin' | 'user' | 'guest'

export function getUserRole(email: string | undefined | null): UserRole {
  if (!email) return 'guest'
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return 'admin'
  return 'user'
}

export function isAdmin(email: string | undefined | null): boolean {
  return getUserRole(email) === 'admin'
}
