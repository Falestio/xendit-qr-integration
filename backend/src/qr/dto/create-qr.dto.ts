export class CreateQRCodeDto {
  userId: string;
  productId: string;
  amount: number;
  basket: {
    reference_id: string;
    name: string;
    category: string;
    currency: string;
    price: number;
    quantity: number;
    type: 'PRODUCT' | 'SERVICE';
    url?: string;
    description?: string;
    sub_category?: string;
  }[];
  metadata?: object;
}
