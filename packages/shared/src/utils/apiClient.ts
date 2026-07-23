const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'https://api.salabaa.com/api';

export async function fetchCallParticipants(requestId: number, token: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/calls/request/${requestId}/participants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (body && body.success && body.data) return body.data;
    return body;
  } catch (err) {
    console.error('Failed to fetch call participants:', err);
    return null;
  }
}
