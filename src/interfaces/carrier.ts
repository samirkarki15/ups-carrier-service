import { RateRequest, RateResponse } from "./shipping";

export interface CarrierService {
  carrier: string;
  getRates(request: RateRequest): Promise<RateResponse>;
}
