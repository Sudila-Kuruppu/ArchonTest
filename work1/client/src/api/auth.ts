import { apiRequest } from './client';

export interface User {
  id: number;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return apiRequest<{ user: User }>('/auth/me');
}
