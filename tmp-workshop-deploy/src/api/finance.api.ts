import apiClient from './client';
import type { Invoice, FinancialStats, WorkshopFinancialDashboard, TransactionItem, WorkshopSettlement, SettlementReport, IncomeStatementLine } from '../types';

export async function getInvoices(page = 0, size = 20): Promise<{ content: Invoice[]; totalElements: number }> {
  const { data } = await apiClient.get('/workshops/invoices', { params: { page, size } });
  return data.data;
}

export async function getFinancialStats(): Promise<FinancialStats> {
  const { data } = await apiClient.get('/workshops/financial-stats');
  return data.data;
}

export async function getFinancialDashboard(): Promise<WorkshopFinancialDashboard> {
  const { data } = await apiClient.get('/workshops/financial/dashboard');
  return data.data;
}

export async function getFinancialInvoices(
  page = 0,
  size = 20,
  status?: string
): Promise<{ content: Invoice[]; totalElements: number }> {
  const params: Record<string, string | number> = { page, size };
  if (status && status !== 'all') params.status = status;
  const { data } = await apiClient.get('/workshops/financial/invoices', { params });
  return data.data;
}

export async function getFinancialSettlements(
  page = 0,
  size = 10
): Promise<{ content: WorkshopSettlement[]; totalElements: number }> {
  const { data } = await apiClient.get('/workshops/financial/settlements', { params: { page, size } });
  return data.data;
}

export async function getFinancialTransactions(limit = 10): Promise<TransactionItem[]> {
  const { data } = await apiClient.get('/workshops/financial/transactions', { params: { limit } });
  return data.data;
}

export async function getFinancialSettlementReport(from?: string, to?: string): Promise<SettlementReport[]> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get('/workshops/financial/settlement-report', { params });
  return data.data;
}

export async function getFinancialIncomeStatement(from?: string, to?: string): Promise<IncomeStatementLine[]> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get('/workshops/financial/income-statement', { params });
  return data.data;
}
