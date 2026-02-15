export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function setRole(role: string) {
  localStorage.setItem('role', role);
}

export function getToken() {
  return localStorage.getItem('token');
}

export function getRole() {
  return localStorage.getItem('role');
}

export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch (e) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/login';
}
