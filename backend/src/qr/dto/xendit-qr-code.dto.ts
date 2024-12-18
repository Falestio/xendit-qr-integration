export class XenditQRCodeDto {
  id: string; // QR code ID from Xendit
  reference_id: string; // Reference ID
  business_id: string; // Business ID
  type: string; // Type of QR code (e.g., DYNAMIC)
  currency: string; // Currency (e.g., IDR)
  amount: number; // Amount
  channel_code: string; // Channel code
  status: string; // Status (e.g., ACTIVE)
  qr_string: string; // QR string
  expires_at: string; // Expiration date
  created: string; // Creation date
  updated: string; // Update date
  basket: object; // Basket details
  metadata: object;
}
