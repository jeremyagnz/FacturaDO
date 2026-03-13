import apiClient from './api.client';
import type { LoginDto, RegisterDto, User } from '@/types/auth.types';

export const authService = {
  login: async (dto: LoginDto) => {
    const { data } = await apiClient.post<{
      data: { accessToken: string; refreshToken: string; expiresIn: number };
    }>('/auth/login', dto);
    return data.data;
  },

  register: async (dto: RegisterDto) => {
    const { data } = await apiClient.post<{ data: { user: User } }>('/auth/register', dto);
    return data.data;
  },

  refreshTokens: async (refreshToken: string) => {
    const { data } = await apiClient.post<{
      data: { accessToken: string; refreshToken: string };
    }>('/auth/refresh', { refreshToken });
    return data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<{ data: User }>('/auth/me');
    return data.data;
  },
};
