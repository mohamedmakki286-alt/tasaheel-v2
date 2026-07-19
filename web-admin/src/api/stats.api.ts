import client from './client';
import type { Stats } from '../types';

export async function getStats(): Promise<Stats> {
  const { data } = await client.get<Stats>('/admin/stats');
  return data;
}
