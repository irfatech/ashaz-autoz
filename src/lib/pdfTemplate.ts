import type { DocumentData } from "./documents"

export function buildPdfHtml(data: DocumentData): string {
  const logo = window.location.origin + "/images/ashaz-timor-flag-color-logo.webp"
  const siteUrl = window.location.origin

  const lineItemsHtml = data.lineItems
    .map(
      (item, i) => `
    <tr>
      <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${i + 1}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${item.description}</td>
      <td style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${item.quantity}</td>
      <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px;">$${item.unitPrice.toLocaleString()}</td>
      <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e5e7eb; font-size: 12px; font-weight: 600;">$${item.total.toLocaleString()}</td>
    </tr>`,
    )
    .join("")

  const subtotal = data.lineItems.reduce((s, i) => s + i.total, 0)
  const taxAmount = subtotal * (data.taxRate / 100)
  const grandTotal = subtotal + taxAmount - data.discount

  const vehicle = data.vehicle

  return `
<style>
  .pdf-body, .pdf-body * { margin: 0; padding: 0; box-sizing: border-box; }
  .pdf-body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1f2937; line-height: 1.5; }
  .pdf-body .page { width: 100%; padding: 30px; }
  .pdf-body .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 3px solid #DA291C; }
  .pdf-body .header img { height: 56px; width: auto; }
  .pdf-body .header .company-info { flex: 1; }
  .pdf-body .header .company-name { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.01em; }
  .pdf-body .header .company-details { font-size: 11px; color: #6b7280; margin-top: 3px; line-height: 1.6; }
  .pdf-body .doc-title { text-align: center; margin-bottom: 24px; }
  .pdf-body .doc-title .label { font-size: 28px; font-weight: 900; color: #DA291C; letter-spacing: 0.15em; text-transform: uppercase; }
  .pdf-body .doc-title .number { font-size: 14px; color: #6b7280; margin-top: 2px; }
  .pdf-body .doc-title .number span { color: #374151; font-weight: 600; }
  .pdf-body .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px dashed #e5e7eb; }
  .pdf-body .meta-row span { color: #374151; font-weight: 500; }
  .pdf-body .section-title { font-size: 13px; font-weight: 700; color: #DA291C; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
  .pdf-body .details-grid { display: flex; gap: 24px; margin-bottom: 20px; }
  .pdf-body .details-grid .box { flex: 1; padding: 14px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #f3f4f6; }
  .pdf-body .details-grid .box .row { display: flex; font-size: 12px; padding: 3px 0; }
  .pdf-body .details-grid .box .row .label { width: 80px; color: #9ca3af; flex-shrink: 0; }
  .pdf-body .details-grid .box .row .value { color: #374151; font-weight: 500; }
  .pdf-body table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .pdf-body table.items thead th { background: #DA291C; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px; text-align: left; }
  .pdf-body table.items thead th:first-child { border-radius: 6px 0 0 0; }
  .pdf-body table.items thead th:last-child { border-radius: 0 6px 0 0; }
  .pdf-body table.items tfoot td { padding: 6px 10px; font-size: 12px; text-align: right; }
  .pdf-body table.items tfoot .total-row td { font-weight: 700; font-size: 14px; border-top: 2px solid #DA291C; padding-top: 8px; color: #DA291C; }
  .pdf-body .notes-section { display: flex; gap: 24px; margin-bottom: 24px; }
  .pdf-body .notes-section .box { flex: 1; }
  .pdf-body .notes-section .box .heading { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .pdf-body .notes-section .box .content { font-size: 11px; color: #6b7280; line-height: 1.6; }
  .pdf-body .signatures { display: flex; gap: 40px; margin-bottom: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .pdf-body .signatures .sig-box { flex: 1; }
  .pdf-body .signatures .sig-box .line { border-bottom: 1px solid #374151; height: 32px; margin-bottom: 4px; width: 80%; }
  .pdf-body .signatures .sig-box .label { font-size: 11px; color: #6b7280; }
  .pdf-body .signatures .sig-box .name { font-size: 12px; font-weight: 600; color: #374151; margin-top: 2px; }
  .pdf-body .footer { text-align: center; font-size: 10px; color: #9ca3af; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media print {
    @page { margin: 0.4in; }
    .pdf-body .page { padding: 0; }
    .pdf-body .details-grid .box { background: none; border-color: #d1d5db; }
    .pdf-body table.items thead th { background: #DA291C !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
<div class="pdf-body">
  <div class="page">

    <div class="header">
      <img src="${logo}" alt="Ashaz Autoz" />
      <div class="company-info">
        <div class="company-name">Ashaz Autoz</div>
        <div class="company-details">
          Ponte Foun, Comoro, Dili, Timor-Leste<br>
          +670 7715 4379 &bull; ashazautoz@gmail.com &bull; ${siteUrl}
        </div>
      </div>
    </div>

    <div class="doc-title">
      <div class="label">${data.type === "quotation" ? "Quotation" : "Invoice"}</div>
      <div class="number"># <span>${data.number}</span></div>
    </div>

    <div class="meta-row">
      <div>Date: <span>${data.date}</span></div>
      <div>Valid Until: <span>${data.validUntil}</span></div>
    </div>

    <div class="section-title">Details</div>
    <div class="details-grid">
      <div class="box">
        <div class="row"><span class="label">Customer</span><span class="value">${data.customer.name}</span></div>
        <div class="row"><span class="label">Phone</span><span class="value">${data.customer.phone}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${data.customer.email}</span></div>
        <div class="row"><span class="label">Address</span><span class="value">${data.customer.address}</span></div>
      </div>
      <div class="box">
        ${vehicle.brand ? `<div class="row"><span class="label">Vehicle</span><span class="value">${vehicle.brand} ${vehicle.model} (${vehicle.year})</span></div>` : ""}
        ${vehicle.vin ? `<div class="row"><span class="label">VIN</span><span class="value">${vehicle.vin}</span></div>` : ""}
        ${vehicle.mileage ? `<div class="row"><span class="label">Mileage</span><span class="value">${vehicle.mileage.toLocaleString()} km</span></div>` : ""}
        ${vehicle.color ? `<div class="row"><span class="label">Color</span><span class="value">${vehicle.color}</span></div>` : ""}
      </div>
    </div>

    <div class="section-title">Items</div>
    <table class="items">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th>Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Price</th>
          <th style="width: 100px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
      <tfoot>
        <tr><td colspan="4">Subtotal</td><td>$${subtotal.toLocaleString()}</td></tr>
        ${data.taxRate > 0 ? `<tr><td colspan="4">Tax (${data.taxRate}%)</td><td>$${taxAmount.toLocaleString()}</td></tr>` : ""}
        ${data.discount > 0 ? `<tr><td colspan="4">Discount</td><td>-$${data.discount.toLocaleString()}</td></tr>` : ""}
        <tr class="total-row"><td colspan="4">Total (USD)</td><td>$${grandTotal.toLocaleString()}</td></tr>
      </tfoot>
    </table>

    <div class="notes-section">
      ${data.notes ? `<div class="box"><div class="heading">Notes</div><div class="content">${data.notes}</div></div>` : ""}
      ${data.terms ? `<div class="box"><div class="heading">Terms &amp; Conditions</div><div class="content">${data.terms}</div></div>` : ""}
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="line"></div>
        <div class="label">Authorized Signatory</div>
        <div class="name">${data.signatoryName || "Ashaz Autoz"}</div>
      </div>
      <div class="sig-box">
        <div class="line"></div>
        <div class="label">Customer</div>
        <div class="name">${data.customerName || data.customer.name}</div>
      </div>
    </div>

    <div class="footer">
      Ashaz Autoz &bull; Ponte Foun, Comoro, Dili, Timor-Leste &bull; +670 7715 4379 &bull; ${siteUrl}
    </div>

  </div>
</div>`
}
