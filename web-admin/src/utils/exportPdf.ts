import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BrandedPdfOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'p' | 'l';
  metadata?: Array<{ label: string; value: unknown }>;
  footerNote?: string;
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]!));
const exportedAt = () => new Date().toLocaleString('ar-SA-u-ca-gregory');

function brandedShell(options: BrandedPdfOptions, content: string) {
  const meta = (options.metadata || []).map(item => `<div class="meta-item"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong></div>`).join('');
  return `<main dir="rtl" class="pdf-page"><style>
    @font-face{font-family:Cairo;src:url('/fonts/cairo.woff2') format('woff2');font-weight:100 900}
    *{box-sizing:border-box}.pdf-page{width:${options.orientation === 'l' ? '1120px' : '794px'};min-height:${options.orientation === 'l' ? '794px' : '1120px'};padding:38px 44px;background:#fff;color:#171717;font-family:Cairo,Tahoma,Arial,sans-serif;line-height:1.55}.pdf-head{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #e30613;padding-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:60px;height:60px;object-fit:contain;border-radius:13px}.brand strong{font-size:24px;font-weight:900}.muted{color:#777;font-size:10px}.doc{text-align:left}.doc h1{margin:0;font-size:20px;font-weight:900}.doc p{margin:3px 0 0;color:#777;font-size:10px}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:17px 0}.meta-item{border:1px solid #e5e5e5;border-radius:9px;padding:8px 10px}.meta-item small{display:block;color:#888;font-size:8px}.meta-item strong{font-size:10px}.content{margin-top:16px}table{width:100%;border-collapse:collapse;font-size:9px;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid}th{background:#171717;color:#fff;padding:9px 7px;text-align:right;font-weight:800}td{padding:8px 7px;border-bottom:1px solid #e9e9e9;text-align:right;vertical-align:top}tbody tr:nth-child(even){background:#fafafa}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.summary-card{border:1px solid #e5e5e5;border-radius:11px;padding:12px}.summary-card small{display:block;color:#777;font-size:9px}.summary-card strong{display:block;margin-top:4px;font-size:14px}.section-title{font-size:14px;border-right:4px solid #e30613;padding-right:8px;margin:18px 0 9px}.footer{margin-top:24px;padding-top:11px;border-top:1px solid #ddd;display:flex;justify-content:space-between;color:#888;font-size:8px}
  </style><header class="pdf-head"><div class="brand"><img src="/tasaheel-logo.png"><div><strong>تساهيل</strong><div class="muted">منصة صيانة السيارات</div></div></div><div class="doc"><h1>${escapeHtml(options.title)}</h1><p>${escapeHtml(options.subtitle || 'تقرير إداري')}</p></div></header>${meta ? `<section class="meta">${meta}</section>` : ''}<section class="content">${content}</section><footer class="footer"><span>${escapeHtml(options.footerNote || 'وثيقة إلكترونية صادرة من لوحة إدارة تساهيل')}</span><span>تاريخ التصدير: ${exportedAt()}</span></footer></main>`;
}

async function waitForAssets(host: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(Array.from(host.querySelectorAll('img')).map(img => img.complete ? Promise.resolve() : new Promise<void>(resolve => { img.onload = img.onerror = () => resolve(); })));
}

export async function exportHtmlToPDF(content: string, options: BrandedPdfOptions) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;background:#fff;z-index:-1';
  host.innerHTML = brandedShell(options, content);
  document.body.appendChild(host);
  try {
    await waitForAssets(host);
    const canvas = await html2canvas(host.firstElementChild as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: '#fff' });
    const pdf = new jsPDF(options.orientation || 'p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = canvas.height * pageWidth / canvas.width;
    const image = canvas.toDataURL('image/jpeg', .96);
    let y = 0;
    pdf.addImage(image, 'JPEG', 0, y, pageWidth, imageHeight);
    for (let remaining = imageHeight - pageHeight; remaining > 0; remaining -= pageHeight) {
      y -= pageHeight;
      pdf.addPage();
      pdf.addImage(image, 'JPEG', 0, y, pageWidth, imageHeight);
    }
    pdf.save(`${options.filename}.pdf`);
  } finally { host.remove(); }
}

export async function exportElementToPDF(element: HTMLElement, filename: string) {
  await exportHtmlToPDF(element.outerHTML, { title: filename, filename, orientation: 'l' });
}

export async function exportDataToPDF(data: Record<string, any>[], filename: string, title: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const table = `<table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${data.map(row => `<tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  await exportHtmlToPDF(table, { title: title || filename, subtitle: `${data.length} سجل`, filename, orientation: headers.length > 5 ? 'l' : 'p', metadata: [{ label: 'عدد السجلات', value: data.length }, { label: 'تاريخ التقرير', value: exportedAt() }] });
}

export async function exportFinancialDocument(title: string, filename: string, summary: Record<string, unknown>, sections: Array<{ title: string; rows: Record<string, unknown>[] }>) {
  const cards = `<div class="summary-grid">${Object.entries(summary).map(([label, value]) => `<div class="summary-card"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`;
  const bodies = sections.map(section => { const headers = section.rows[0] ? Object.keys(section.rows[0]) : []; return `<h2 class="section-title">${escapeHtml(section.title)}</h2>${headers.length ? `<table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${section.rows.map(row => `<tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p>لا توجد بيانات</p>'}`; }).join('');
  await exportHtmlToPDF(cards + bodies, { title, subtitle: 'مستند مالي', filename, orientation: 'l', metadata: [{ label: 'تاريخ الإصدار', value: exportedAt() }] });
}
