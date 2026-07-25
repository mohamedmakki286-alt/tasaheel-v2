import client from './client';

export interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface TableCount {
  tableName: string;
  count: number;
}

export interface PreviewResponse {
  customerIds: number[];
  workshopIds: number[];
  tableCounts: TableCount[];
  totalRecordsToDelete: number;
  confirmText: string;
}

export interface ResetReport {
  customerIds: number[];
  workshopIds: number[];
  countsBefore: TableCount[];
  totalDeleted: number;
  filesDeleted: string[];
  dryRun: boolean;
}

export interface AuditLogEntry {
  id: number;
  adminUserId: number;
  adminUserName: string;
  customerIds: string;
  workshopIds: string;
  technicianIds: string;
  totalRecordsDeleted: number;
  tablesAffected: string;
  filesDeleted: string;
  result: string;
  error: string;
  createdAt: string;
}

export async function getTestDataResetUsers(): Promise<{ customers: UserData[]; workshops: UserData[] }> {
  const res = await client.get('/admin/test-data-reset/users');
  return res.data;
}

export async function previewTestDataReset(customerIds?: number[], workshopIds?: number[]): Promise<PreviewResponse> {
  const res = await client.post('/admin/test-data-reset/preview', {
    customerIds: customerIds || null,
    workshopIds: workshopIds || null,
  });
  return res.data;
}

export async function executeTestDataReset(confirmText: string): Promise<ResetReport> {
  const res = await client.post('/admin/test-data-reset/execute', {
    confirmText,
    dryRun: false,
  });
  return res.data;
}

export async function getTestDataResetAuditLog(): Promise<AuditLogEntry[]> {
  const res = await client.get('/admin/test-data-reset/audit-log');
  return res.data;
}
