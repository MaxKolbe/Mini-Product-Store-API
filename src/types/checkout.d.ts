export type LineItem = {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description: string;
      metadata?: {
        productId: string;
      };
    };
    unit_amount: number;
  };
  quantity: number;
};

export type LineItems = LineItem[];
