function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function generatePdf(element: HTMLElement, filename: string): Promise<void> {
  await delay(500)
  const html2pdf = (await import("html2pdf.js")).default
  await html2pdf()
    .set({
      margin: [0.5, 0.5, 0.5, 0.5],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        foreignObjectRendering: true,
        logging: false,
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    })
    .from(element)
    .save()
}
