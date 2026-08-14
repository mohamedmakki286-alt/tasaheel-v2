import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

type Line = { name: string; quantity: number; unitPrice: number; total: number };
type PartyContext = {
  requestId: string | number;
  workshopName?: string;
  customerName?: string;
  vehicle?: string;
};

const money = (value: number | null | undefined) => `${Number(value || 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
const date = (value?: string) => value ? new Date(value).toLocaleDateString('ar-SA-u-ca-gregory') : new Date().toLocaleDateString('ar-SA-u-ca-gregory');
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));

function shell(title: string, subtitle: string, meta: string, content: string) {
  return `<div dir="rtl" style="width:794px;box-sizing:border-box;background:#fff;color:#171717;font-family:Cairo,Tahoma,Arial,sans-serif;padding:40px 44px;line-height:1.65">
    <style>
      @font-face{font-family:Cairo;src:url('/fonts/cairo.woff2') format('woff2');font-weight:100 900}
      *{box-sizing:border-box}.head{display:flex;align-items:center;justify-content:space-between;padding-bottom:22px;border-bottom:3px solid #e30613}.brand{display:flex;align-items:center;gap:14px}.logo{width:66px;height:66px;object-fit:contain;border-radius:15px}.brand-name{font-size:26px;font-weight:900}.muted{color:#737373}.doc-title{text-align:left}.doc-title h1{font-size:22px;margin:0;font-weight:900}.doc-title p{font-size:11px;margin:3px 0 0;color:#737373}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:20px 0}.meta div{border:1px solid #e5e5e5;border-radius:10px;padding:9px 11px}.meta small{display:block;color:#888;font-size:9px}.meta strong{display:block;font-size:11px;margin-top:2px}.section{margin-top:18px}.section h2{font-size:14px;margin:0 0 9px;border-right:4px solid #e30613;padding-right:9px}.parties{display:grid;grid-template-columns:1fr 1fr;gap:10px}.party{background:#f8f8f8;border-radius:12px;padding:12px;font-size:11px}.party strong{display:block;font-size:13px;margin-bottom:4px}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#171717;color:white;font-weight:700;padding:10px 8px}td{padding:9px 8px;border-bottom:1px solid #eee;text-align:center}td:first-child,th:first-child{text-align:right}.totals{width:52%;margin-right:auto;margin-top:16px}.total-row{display:flex;justify-content:space-between;padding:7px 10px;font-size:11px;border-bottom:1px solid #eee}.total-row.final{background:#e30613;color:#fff;border-radius:9px;border:0;font-size:14px;font-weight:900;margin-top:6px}.note{margin-top:14px;background:#fff5f5;border:1px solid #ffd6d9;color:#7f1d1d;padding:10px 12px;border-radius:10px;font-size:10px}.notes{white-space:pre-wrap;background:#f8f8f8;border-radius:12px;padding:13px;font-size:11px}.footer{margin-top:30px;padding-top:14px;border-top:1px solid #ddd;display:flex;justify-content:space-between;color:#888;font-size:9px}
    </style>
    <header class="head"><div class="brand"><img class="logo" src="/tasaheel-logo.png"/><div><div class="brand-name">تساهيل</div><div class="muted" style="font-size:10px">منصة صيانة السيارات</div></div></div><div class="doc-title"><h1>${title}</h1><p>${subtitle}</p></div></header>
    <div class="meta">${meta}</div>${content}
    <footer class="footer"><span>وثيقة إلكترونية صادرة عبر منصة تساهيل</span><span>salabaa.com</span></footer>
  </div>`;
}

async function savePdf(html: string, filename: string) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;background:white;z-index:-1';
  host.innerHTML = html;
  document.body.appendChild(host);
  try {
    await document.fonts.ready;
    await Promise.all(Array.from(host.querySelectorAll('img')).map((img) => img.complete ? Promise.resolve() : new Promise<void>((resolve) => { img.onload = img.onerror = () => resolve(); })));
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = canvas.height * width / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const image = canvas.toDataURL('image/jpeg', 0.96);
    let position = 0;
    pdf.addImage(image, 'JPEG', 0, position, width, height);
    let remaining = height - pageHeight;
    while (remaining > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, position, width, height);
      remaining -= pageHeight;
    }
    pdf.save(`${filename}.pdf`);
  } finally {
    host.remove();
  }
}

export async function exportInvoiceDocument(invoice: any, context: PartyContext) {
  const taxPercent = Number(invoice.taxPercent ?? 15), grandTotal = Number(invoice.grandTotal || 0);
  const subtotal = Number(invoice.totalAmount ?? grandTotal / (1 + taxPercent / 100));
  const tax = Number(invoice.taxAmount ?? invoice.tax ?? grandTotal - subtotal);
  const qr = invoice.zatcaQrPayload ? await QRCode.toDataURL(invoice.zatcaQrPayload, { width: 150, margin: 1, errorCorrectionLevel: 'M' }) : '';
  const rows = (invoice.items || []).map((item: Line, i: number) => `<tr><td>${i + 1}. ${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(item.total)}</td></tr>`).join('');
  const meta = `<div><small>رقم الفاتورة</small><strong>${escapeHtml(invoice.invoiceNumber || invoice.id)}</strong></div><div><small>رقم الطلب</small><strong>#${escapeHtml(context.requestId)}</strong></div><div><small>تاريخ الإصدار</small><strong>${date(invoice.createdAt)}</strong></div><div><small>الحالة</small><strong>${escapeHtml(invoice.status || 'صادرة')}</strong></div>`;
  const content = `<section class="parties"><div class="party"><strong>مقدم الخدمة</strong>${escapeHtml(invoice.supplierLegalName || context.workshopName || invoice.workshopName || 'ورشة تساهيل')}<br/>${escapeHtml(invoice.supplierAddress || '')}<br/>الرقم الضريبي: ${escapeHtml(invoice.supplierTaxNumber || 'غير مسجل')}<br/>السجل التجاري: ${escapeHtml(invoice.supplierCommercialRegistration || '—')}</div><div class="party"><strong>العميل والمركبة</strong>${escapeHtml(context.customerName || invoice.customerName || 'عميل تساهيل')}<br/>${escapeHtml(context.vehicle || '—')}${qr ? `<br/><img src="${qr}" style="width:92px;height:92px;margin-top:8px" alt="QR ضريبي"/>` : ''}</div></section><section class="section"><h2>تفاصيل البنود</h2><table><thead><tr><th>البيان</th><th>الكمية</th><th>سعر الوحدة شامل الضريبة</th><th>الإجمالي</th></tr></thead><tbody>${rows}</tbody></table></section><div class="totals"><div class="total-row"><span>الإجمالي قبل الضريبة</span><strong>${money(subtotal)}</strong></div><div class="total-row"><span>ضريبة القيمة المضافة (${taxPercent}%)</span><strong>${money(tax)}</strong></div><div class="total-row final"><span>الإجمالي النهائي</span><span>${money(grandTotal)}</span></div></div><div class="note">أسعار البنود شاملة ضريبة القيمة المضافة، وتم استخراج قيمة الضريبة من الإجمالي.</div>`;
  await savePdf(shell('فاتورة ضريبية مبسطة', 'فاتورة خدمات صيانة سيارات', meta, content), `فاتورة-تساهيل-${invoice.invoiceNumber || context.requestId}`);
}

export async function exportInspectionDocument(report: any, context: PartyContext) {
  const parts = (report.parts || []).map((item: any, i: number) => `<tr><td>${i + 1}. ${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${money(item.unitPrice)}</td><td>${money(item.total)}</td></tr>`).join('');
  const labor = (report.labor || []).map((item: any, i: number) => `<tr><td>${i + 1}. ${escapeHtml(item.description)}</td><td>${item.hours ?? item.minutes ?? '—'}</td><td>${money(item.hourlyRate)}</td><td>${money(item.total)}</td></tr>`).join('');
  const meta = `<div><small>رقم التقرير</small><strong>${escapeHtml(report.id)}</strong></div><div><small>رقم الطلب</small><strong>#${escapeHtml(context.requestId)}</strong></div><div><small>تاريخ الفحص</small><strong>${date(report.createdAt)}</strong></div><div><small>الأولوية</small><strong>${escapeHtml(report.priority || 'عادية')}</strong></div>`;
  const content = `<section class="parties"><div class="party"><strong>الورشة</strong>${escapeHtml(context.workshopName || 'ورشة تساهيل')}</div><div class="party"><strong>العميل والمركبة</strong>${escapeHtml(context.customerName || 'عميل تساهيل')}<br/>${escapeHtml(context.vehicle || '—')}</div></section>${parts ? `<section class="section"><h2>قطع الغيار المقترحة</h2><table><thead><tr><th>البيان</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${parts}</tbody></table></section>` : ''}${labor ? `<section class="section"><h2>أعمال الصيانة</h2><table><thead><tr><th>العمل</th><th>الساعات</th><th>سعر الساعة</th><th>الإجمالي</th></tr></thead><tbody>${labor}</tbody></table></section>` : ''}<section class="section"><h2>ملاحظات الفني</h2><div class="notes">${escapeHtml(report.notes || 'لا توجد ملاحظات إضافية.')}</div></section><div class="totals"><div class="total-row final"><span>التكلفة التقديرية</span><span>${money(report.grandTotal)}</span></div></div>`;
  await savePdf(shell('تقرير فحص فني', 'نتائج الفحص والتوصيات الفنية', meta, content), `تقرير-فحص-تساهيل-${context.requestId}`);
}

export async function exportTableDocument(title: string, subtitle: string, headers: string[], data: unknown[][], filename: string, summary?: Array<[string, unknown]>) {
  const meta = `<div><small>تاريخ الإصدار</small><strong>${new Date().toLocaleString('ar-SA-u-ca-gregory')}</strong></div><div><small>عدد السجلات</small><strong>${data.length}</strong></div>`;
  const tableRows = data.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('');
  const totals = summary?.length ? `<div class="totals">${summary.map(([label, value], index) => `<div class="total-row ${index === summary.length - 1 ? 'final' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>` : '';
  const content = `<section class="section"><h2>${escapeHtml(title)}</h2><table><thead><tr>${headers.map(value => `<th>${escapeHtml(value)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></section>${totals}`;
  await savePdf(shell(title, subtitle, meta, content), filename);
}
