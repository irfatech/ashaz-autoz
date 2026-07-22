export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
}

export interface VehicleInfo {
  brand: string
  model: string
  year: number
  vin: string
  mileage: number
  color: string
  transmission: string
  fuelType: string
  engine: string
}

export interface DocumentData {
  id: string
  type: "quotation" | "invoice"
  number: string
  date: string
  validUntil: string
  customer: CustomerInfo
  vehicle: VehicleInfo
  lineItems: LineItem[]
  taxRate: number
  discount: number
  notes: string
  terms: string
  signatoryName: string
  signatoryTitle: string
  customerName: string
}

function getCounterKey(type: "quotation" | "invoice"): string {
  const prefix = type === "quotation" ? "qtn" : "inv"
  return `app_${prefix}_counter`
}

function getStorageKey(type: "quotation" | "invoice"): string {
  return `app_${type}s`
}

export function generateDocNumber(type: "quotation" | "invoice"): string {
  const key = getCounterKey(type)
  const year = new Date().getFullYear()
  const counter = Number(localStorage.getItem(key) || "0") + 1
  localStorage.setItem(key, String(counter))
  const prefix = type === "quotation" ? "QTN" : "INV"
  return `${prefix}-${year}-${String(counter).padStart(4, "0")}`
}

export function generateDocId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function saveDocument(doc: DocumentData): void {
  const key = getStorageKey(doc.type)
  const docs: DocumentData[] = JSON.parse(localStorage.getItem(key) || "[]")
  const idx = docs.findIndex((d) => d.id === doc.id)
  if (idx >= 0) docs[idx] = doc
  else docs.unshift(doc)
  localStorage.setItem(key, JSON.stringify(docs))
}

export function getDocuments(type: "quotation" | "invoice"): DocumentData[] {
  const key = getStorageKey(type)
  return JSON.parse(localStorage.getItem(key) || "[]")
}

export function getDocument(type: "quotation" | "invoice", id: string): DocumentData | undefined {
  return getDocuments(type).find((d) => d.id === id)
}

export function deleteDocument(type: "quotation" | "invoice", id: string): void {
  const key = getStorageKey(type)
  const docs = getDocuments(type).filter((d) => d.id !== id)
  localStorage.setItem(key, JSON.stringify(docs))
}
