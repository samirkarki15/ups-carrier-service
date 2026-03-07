import axios from "axios";
import { getUPSToken } from "./auth";
import { config } from "../../config";
import { CarrierService } from "../../interfaces/carrier";
import {
  RateRequest,
  RateResponse,
  RateQuote,
} from "../../interfaces/shipping";

const UPS_SERVICE_NAMES: Record<string, string> = {
  "01": "UPS Next Day Air",
  "02": "UPS Second Day Air",
  "03": "UPS Ground",
  "07": "UPS Worldwide Express",
  "08": "UPS Worldwide Expedited",
  "11": "UPS Standard",
  "12": "UPS Three-Day Select",
};

export class UPSCarrierService implements CarrierService {
  carrier = "UPS";

  private buildRateRequest(request: RateRequest) {
    return {
      RateRequest: {
        Request: {
          RequestOption: "Shop",
        },
        Shipment: {
          Shipper: {
            Address: {
              Addressline: request.origin.street,
              City: request.origin.city,
              StateProvinceCode: request.origin.state,
              PostalCode: request.origin.zip,
              CountryCode: request.origin.country,
            },
          },
          ShipTo: {
            Address: {
              Addressline: request.destination.street,
              City: request.destination.city,
              StateProvinceCode: request.destination.state,
              PostalCode: request.destination.zip,
              CountryCode: request.destination.country,
            },
          },
          Package: {
            PackagingType: {
              Code: "02", // Customer Supplied Package
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: "IN",
              },
              Length: String(request.package.lengthin),
              Width: String(request.package.widthin),
              Height: String(request.package.heightin),
            },
            PackageWeight: {
              UnitOfMeasurement: { Code: "LBS" },
              Weight: String(request.package.weightlbs),
            },
          },
        },
      },
    };
  }

  // This cleans up UPS ugly response into our simple RateQuote
  private parseRateResponse(upsResponse: any): RateQuote[] {
    const shipments = upsResponse?.RateResponse?.RatedShipment;

    // UPS sometimes returns one result, sometimes an array
    // We normalize it to always be an array
    const ratedShipments = Array.isArray(shipments) ? shipments : [shipments];

    return ratedShipments.map((shipment: any) => {
      const serviceCode = shipment.Service.Code;

      return {
        carrier: "UPS",
        serviceCode: serviceCode,
        // Look up human readable name, fallback to code if not found
        serviceName:
          UPS_SERVICE_NAMES[serviceCode] || `UPS Service ${serviceCode}`,
        currency: shipment.TotalCharges.CurrencyCode,
        // Convert string "8.50" to number 8.50
        totalCost: parseFloat(shipment.TotalCharges.MonetaryValue),
        // Optional field — not always present
        estimatedDays: shipment.GuaranteedDelivery?.BusinessDaysInTransit
          ? parseInt(shipment.GuaranteedDelivery.BusinessDaysInTransit)
          : undefined,
      };
    });
  }

  // This is the main function — called by the store
  // It puts everything together
  async getRates(request: RateRequest): Promise<RateResponse> {
    try {
      // Step 1 — get our auth token (cached or fresh)
      const token = await getUPSToken();

      // Step 2 — build the UPS formatted request
      const upsRequest = this.buildRateRequest(request);

      // Step 3 — call UPS Rating API
      const response = await axios.post(
        `${config.ups.baseUrl}/api/rating/v2205/Shop`,
        upsRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            transId: `rate-${Date.now()}`,
            transactionSrc: "cybership",
          },
        },
      );

      // Step 4 — clean up the response
      const quotes = this.parseRateResponse(response.data);

      // Step 5 — return clean rates to the store
      return {
        success: true,
        quotes,
      };
    } catch (error: any) {
      // Handle specific UPS error codes
      if (error.response?.status === 401) {
        throw new Error("UPS Authentication failed — check your credentials");
      }

      if (error.response?.status === 429) {
        throw new Error("UPS Rate limit exceeded — too many requests");
      }

      if (error.response?.status >= 500) {
        throw new Error("UPS server error — try again later");
      }

      if (error.code === "ECONNABORTED") {
        throw new Error("UPS request timed out — try again");
      }

      throw new Error(`UPS Rates error: ${error.message}`);
    }
  }
}
