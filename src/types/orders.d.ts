export interface OrderCreatedPayload {
  email: string;
  orderId: string;
  amount: number;
  items: {
    name: string;
    quantity: number;
    amount: number;
  }[];
  createdAt: Date;
}
