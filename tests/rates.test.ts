import axios from "axios";
import { UPSCarrierService } from "../src/carriers/ups/rates";
import { RateRequest } from "../src/interfaces/shipping";

jest.mock("axios");
jest.mock("../src/carriers/ups/auth", () => ({
  // Always return a fake token in tests
  // So auth never blocks our rate tests
  getUPSToken: jest.fn().mockResolvedValue("fake_token_123"),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

// A realistic fake UPS rating response
// Based on real UPS API documentation
const mockUPSRateResponse = {
  data: {
    RateResponse: {
      RatedShipment: [
        {
          Service: { Code: "03" },
          TotalCharges: {
            CurrencyCode: "USD",
            MonetaryValue: "8.50",
          },
          GuaranteedDelivery: {
            BusinessDaysInTransit: "3",
          },
        },
        {
          Service: { Code: "01" },
          TotalCharges: {
            CurrencyCode: "USD",
            MonetaryValue: "24.00",
          },
          GuaranteedDelivery: {
            BusinessDaysInTransit: "1",
          },
        },
      ],
    },
  },
};

// Example request we use in all tests
const exampleRequest: RateRequest = {
  origin: {
    name: "Test Warehouse",
    street: "1 World Way",
    city: "Los Angeles",
    state: "CA",
    zip: "90045",
    country: "US",
  },
  destination: {
    name: "John Doe",
    street: "350 5th Ave",
    city: "New York",
    state: "NY",
    zip: "10118",
    country: "US",
  },
  package: {
    weightlbs: 5,
    lengthin: 10,
    widthin: 8,
    heightin: 6,
  },
};

describe("UPS Rate Shopping", () => {
  let upsService: UPSCarrierService;

  beforeEach(() => {
    jest.clearAllMocks();
    upsService = new UPSCarrierService();
  });

  // TEST 1 — Does it return clean rates?
  it("should return normalized rate quotes", async () => {
    mockedAxios.post.mockResolvedValueOnce(mockUPSRateResponse);

    const result = await upsService.getRates(exampleRequest);

    // Should be successful
    expect(result.success).toBe(true);

    // Should have 2 quotes
    expect(result.quotes).toHaveLength(2);

    // First quote should be UPS Ground
    expect(result.quotes[0]).toMatchObject({
      carrier: "UPS",
      serviceName: "UPS Ground",
      serviceCode: "03",
      currency: "USD",
      totalCost: 8.5,
      estimatedDays: 3,
    });

    // Second quote should be Next Day Air
    expect(result.quotes[1]).toMatchObject({
      carrier: "UPS",
      serviceName: "UPS Next Day Air",
      serviceCode: "01",
      currency: "USD",
      totalCost: 24.0,
      estimatedDays: 1,
    });
  });

  // TEST 2 — Does it handle 401 correctly?
  it("should throw auth error on 401 response", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 401 },
      message: "Unauthorized",
    });

    await expect(upsService.getRates(exampleRequest)).rejects.toThrow(
      "UPS Authentication failed",
    );
  });

  // TEST 3 — Does it handle rate limiting?
  it("should throw rate limit error on 429 response", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 429 },
      message: "Too Many Requests",
    });

    await expect(upsService.getRates(exampleRequest)).rejects.toThrow(
      "UPS Rate limit exceeded",
    );
  });

  // TEST 4 — Does it handle UPS server errors?
  it("should throw server error on 500 response", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 500 },
      message: "Internal Server Error",
    });

    await expect(upsService.getRates(exampleRequest)).rejects.toThrow(
      "UPS server error",
    );
  });

  // TEST 5 — Does it handle timeouts?
  it("should throw timeout error when request times out", async () => {
    mockedAxios.post.mockRejectedValueOnce({
      code: "ECONNABORTED",
      message: "timeout of 5000ms exceeded",
    });

    await expect(upsService.getRates(exampleRequest)).rejects.toThrow(
      "UPS request timed out",
    );
  });
});
