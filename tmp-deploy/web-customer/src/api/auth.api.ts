import client from './client';

const API = import.meta.env.VITE_API_URL || '/api';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    client.post('/auth/login', data),
  register: (data: { name: string; email: string; phone?: string; city: string; password: string }) =>
    client.post('/auth/register/customer', data),
  getProfile: () => client.get('/customers/profile'),
  updateProfile: (data: { name?: string; email?: string; phone?: string; city?: string }) =>
    client.put('/customers/profile', data),
  verifyEmail: (email: string, code: string) =>
    client.post('/auth/email/verify', { email, code }),
  resendVerification: (email: string) =>
    client.post('/auth/email/resend-verification', { email }),
  forgotPassword: (email: string) =>
    fetch(`${API}/auth/password/forgot`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    fetch(`${API}/auth/password/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword }) }),
};
