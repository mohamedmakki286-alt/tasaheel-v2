import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SettlementReport, IncomeStatementLine } from '../types';

export function exportSettlementReportPdf(report: SettlementReport, filename: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(report.workshopName || 'تقرير التسوية', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`الفترة: ${report.period}`, pageWidth / 2, 30, { align: 'center' });

  const rows = report.items.map((item) => [
    item.invoiceNumber,
    item.customerName,
    item.grandTotal.toFixed(2),
    item.commissionAmount.toFixed(2),
    item.netAmount.toFixed(2),
    new Date(item.paidAt).toLocaleDateString('ar-SA'),
  ]);

  autoTable(doc, {
    head: [['رقم الفاتورة', 'العميل', 'الإجمالي', 'العمولة', 'الصافي', 'تاريخ الدفع']],
    body: rows,
    startY: 40,
    styles: { fontSize: 9, halign: 'right' },
    headStyles: { fillColor: [26, 58, 114], textColor: 255, fontStyle: 'bold' },
    foot: [['', 'الإجمالي', report.totalGross.toFixed(2), report.totalCommission.toFixed(2), report.totalNet.toFixed(2), '']],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    tableLineColor: 200,
    tableLineWidth: 0.5,
  });

  doc.save(`${filename}.pdf`);
}

export function exportIncomeStatementPdf(lines: IncomeStatementLine[], title: string, filename: string) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(title || 'كشف الدخل', pageWidth / 2, 20, { align: 'center' });

  const rows = lines.map((line) => [
    line.item,
    line.amount.toFixed(2),
  ]);

  autoTable(doc, {
    head: [['البيان', 'المبلغ']],
    body: rows,
    startY: 40,
    styles: { fontSize: 10, halign: 'right' },
    headStyles: { fillColor: [26, 58, 114], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [50, 50, 50] },
    tableLineColor: 200,
    tableLineWidth: 0.5,
  });

  doc.save(`${filename}.pdf`);
}
