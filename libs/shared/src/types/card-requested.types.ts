export interface CustomerData {
  documentType: string;
  documentNumber: string;
  fullName: string;
  age: number;
  email: string;
}

export interface ProductData {
  type: string;
  currency: string;
}

export interface CardRequestedData {
  requestId: string;
  customer: CustomerData;
  product: ProductData;
  forceError: boolean;
}
