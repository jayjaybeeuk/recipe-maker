export function checkBrowserCompatibility(): { supported: boolean; reasons: string[] } {
  const reasons: string[] = []

  if (typeof window === 'undefined') {
    return { supported: true, reasons: [] }
  }

  if (!window.isSecureContext) {
    reasons.push('Secure context (HTTPS) is required.')
  }

  if (!navigator.storage?.getDirectory) {
    reasons.push('Origin Private File System (OPFS) is not available.')
  }

  return { supported: reasons.length === 0, reasons }
}
