export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Package {
  weightlbs: number;
  lengthin: number;
  widthin: number;
  heightin: number;
}

export interface RateRequest {
  origin: Address;
  destination: Address;
  package: Package;
  serviceCode?: string;
}

export interface RateQuote {
  carrier: string;
  serviceName: string;
  serviceCode: string;
  currency: string;
  totalCost: number;
  estimatedDays?: number;
}

export interface RateResponse {
  success: boolean;
  quotes: RateQuote[];
}
