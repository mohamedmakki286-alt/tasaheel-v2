import type { SettlementReport, IncomeStatementLine } from '../types';
import { exportTableDocument } from './brandedDocuments';

const sar = (value: number) => `${value.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;

export function exportSettlementReportPdf(report: SettlementReport, filename: string) {
  return exportTableDocument(
    'تقرير التسوية',
    `${report.workshopName || 'الورشة'} • الفترة ${report.period}`,
    ['رقم الفاتورة', 'العميل', 'الإجمالي', 'العمولة', 'الصافي', 'تاريخ الدفع'],
    report.items.map(item => [item.invoiceNumber, item.customerName, sar(item.grandTotal), sar(item.commissionAmount), sar(item.netAmount), new Date(item.paidAt).toLocaleDateString('ar-SA-u-ca-gregory')]),
    filename,
    [['إجمالي الفواتير', sar(report.totalGross)], ['إجمالي العمولة', sar(report.totalCommission)], ['صافي المستحق', sar(report.totalNet)]],
  );
}

export function exportIncomeStatementPdf(lines: IncomeStatementLine[], title: string, filename: string) {
  return exportTableDocument(title || 'كشف الدخل', 'تقرير مالي صادر من حساب الورشة', ['البيان', 'المبلغ'], lines.map(line => [line.item, sar(line.amount)]), filename, [['صافي النتيجة', sar(lines.reduce((sum, line) => sum + line.amount, 0))]]);
}
