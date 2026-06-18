const API_ORIGIN = window.location.protocol === 'file:' ? 'http://localhost:3000' : ''

export function apiUrl(path) {
  return `${API_ORIGIN}${path}`
}
