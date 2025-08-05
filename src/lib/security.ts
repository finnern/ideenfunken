/**
 * Security utilities for input validation and XSS protection
 */

// HTML entities to prevent XSS attacks
const HTML_ENTITIES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '&': '&amp;'
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  
  return text.replace(/[<>"'&/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Sanitize text input by removing dangerous characters and limiting length
 */
export function sanitizeTextInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return ''
  
  // Trim whitespace
  let sanitized = input.trim()
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  return sanitized
}

/**
 * Validate book title input
 */
export function validateBookTitle(title: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeTextInput(title, 200)
  
  if (!sanitized) {
    return { isValid: false, error: 'Title is required' }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Title must be at least 2 characters long' }
  }
  
  // Check for suspicious patterns
  if (/javascript:|data:|vbscript:|on\w+=/i.test(sanitized)) {
    return { isValid: false, error: 'Title contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validate author name input
 */
export function validateAuthorName(author: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeTextInput(author, 100)
  
  if (!sanitized) {
    return { isValid: false, error: 'Author name is required' }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Author name must be at least 2 characters long' }
  }
  
  // Check for suspicious patterns
  if (/javascript:|data:|vbscript:|on\w+=/i.test(sanitized)) {
    return { isValid: false, error: 'Author name contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validate description input
 */
export function validateDescription(description: string): { isValid: boolean; error?: string } {
  if (!description) {
    return { isValid: true } // Description is optional
  }
  
  const sanitized = sanitizeTextInput(description, 2000)
  
  // Check for suspicious patterns
  if (/javascript:|data:|vbscript:|on\w+=/i.test(sanitized)) {
    return { isValid: false, error: 'Description contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Validate email input
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const sanitized = sanitizeTextInput(email, 254)
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' }
  }
  
  // Simple email regex (more permissive than RFC5322 but safe)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' }
  }
  
  // Check for at least one uppercase, one lowercase, one number
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
  }
  
  return { isValid: true }
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Rate limiting helper (simple client-side implementation)
 * For production, implement server-side rate limiting
 */
class SimpleRateLimit {
  private attempts: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs)
    
    if (recentAttempts.length >= maxAttempts) {
      return false
    }
    
    // Record this attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

export const rateLimit = new SimpleRateLimit()