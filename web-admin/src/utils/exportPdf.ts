import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const h = (pdfW * canvas.height) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 10, pdfW, h);
  pdf.save(`${filename}.pdf`);
}

export async function exportDataToPDF(data: Record<string, any>[], filename: string, title: string) {
  if (!data.length) return;
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:-9999px;top:0;direction:rtl;font-family:Cairo,sans-serif;padding:20px;background:white';
  const h2 = document.createElement('h2');
  h2.style.cssText = 'text-align:center;margin-bottom:20px;font-size:22px;color:#1a3a72';
  h2.textContent = title;
  el.appendChild(h2);
  const tbl = document.createElement('table');
  tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px';
  const headers = Object.keys(data[0]);
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.style.cssText = 'border:1px solid #ddd;padding:8px;background:#1a3a72;color:white;text-align:right';
    th.textContent = h;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  tbl.appendChild(thead);
  const tbody = document.createElement('tbody');
  data.forEach((row) => {
    const tr = document.createElement('tr');
    headers.forEach((h) => {
      const td = document.createElement('td');
      td.style.cssText = 'border:1px solid #ddd;padding:8px;text-align:right';
      td.textContent = String(row[h] ?? '');
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  el.appendChild(tbl);
  document.body.appendChild(el);
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
  document.body.removeChild(el);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('l', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  pdf.addImage(imgData, 'PNG', 0, 10, pdfW, (pdfW * canvas.height) / canvas.width);
  pdf.save(`${filename}.pdf`);
}
