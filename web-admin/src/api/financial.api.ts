import client, { mapPage } from './client';
import type {
  FinancialDashboard,
  WorkshopSettlement,
  InvoiceDTO,
  Account,
  JournalEntry,
  PlatformSetting,
  PaginatedResponse,
} from '../types';

export async function getDashboard(): Promise<FinancialDashboard> {
  const { data } = await client.get<any>('/admin/financial/dashboard');
  return data.data || data;
}

export async function getPendingSettlements(): Promise<any[]> {
  const { data } = await client.get('/admin/financial/settlements/pending');
  return data.data || data;
}

export async function getPendingInvoicesForWorkshop(workshopId: number): Promise<InvoiceDTO[]> {
  const { data } = await client.get(`/admin/financial/settlements/pending/${workshopId}`);
  return data.data || data;
}

export async function createSettlement(payload: {
  workshopId: number;
  invoiceCommissions: Record<string, number>;
  notes?: string;
}): Promise<WorkshopSettlement> {
  const { data } = await client.post('/admin/financial/settlements', payload);
  return data.data || data;
}

export async function getSettlements(params?: Record<string, any>): Promise<PaginatedResponse<WorkshopSettlement>> {
  const { data } = await client.get<any>('/admin/financial/settlements', {
    params: { ...params, page: params?.page != null ? params.page - 1 : 0 },
  });
  return mapPage(data);
}

export async function getSettlement(id: number): Promise<WorkshopSettlement> {
  const { data } = await client.get(`/admin/financial/settlements/${id}`);
  return data.data || data;
}

export async function completeSettlement(id: number): Promise<WorkshopSettlement> {
  const { data } = await client.put(`/admin/financial/settlements/${id}/complete`);
  return data.data || data;
}

export async function cancelSettlement(id: number): Promise<WorkshopSettlement> {
  const { data } = await client.put(`/admin/financial/settlements/${id}/cancel`);
  return data.data || data;
}

export async function getSettlementReport(params?: Record<string, any>): Promise<any[]> {
  const { data } = await client.get('/admin/financial/settlements/report', { params });
  return data.data || data;
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await client.get('/admin/financial/accounts');
  return data.data || data;
}

export async function getJournalEntries(params?: Record<string, any>): Promise<PaginatedResponse<JournalEntry>> {
  const { data } = await client.get<any>('/admin/financial/journal-entries', {
    params: { ...params, page: params?.page != null ? params.page - 1 : 0 },
  });
  return mapPage(data);
}

export async function getJournalEntry(id: number): Promise<JournalEntry> {
  const { data } = await client.get(`/admin/financial/journal-entries/${id}`);
  return data.data || data;
}

export async function getTrialBalance(): Promise<any[]> {
  const { data } = await client.get('/admin/financial/reports/trial-balance');
  return data.data || data;
}

export async function getIncomeStatement(params?: Record<string, any>): Promise<any> {
  const { data } = await client.get('/admin/financial/reports/income-statement', { params });
  return data.data || data;
}

export async function getBalanceSheet(): Promise<any> {
  const { data } = await client.get('/admin/financial/reports/balance-sheet');
  return data.data || data;
}

export async function getGeneralLedger(params: Record<string, any>): Promise<any[]> {
  const { data } = await client.get('/admin/financial/reports/general-ledger', { params });
  return data.data || data;
}

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const { data } = await client.get('/admin/settings/platform');
  return data.data || data;
}

export async function updatePlatformSetting(payload: { key: string; value: string; description?: string }): Promise<PlatformSetting> {
  const { data } = await client.put('/admin/settings/platform', payload);
  return data.data || data;
}

export async function getEarningsReport(params?: Record<string, any>): Promise<any> {
  const { data } = await client.get('/admin/financial/earnings', { params });
  return data.data || data;
}
