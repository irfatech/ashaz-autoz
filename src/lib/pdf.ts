export async function generatePdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  const imgData = canvas.toDataURL("image/jpeg", 0.98)
  const pdf = new jsPDF({ unit: "in", format: "a4", orientation: "portrait" })

  const margin = 0.5
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2
  const imgHeight = (canvas.height * usableWidth) / canvas.width

  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, "JPEG", margin, position, usableWidth, imgHeight)
  heightLeft -= usableHeight

  while (heightLeft > 0) {
    position = margin - (imgHeight - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, "JPEG", margin, position, usableWidth, imgHeight)
    heightLeft -= usableHeight
  }

  pdf.save(filename)
}
