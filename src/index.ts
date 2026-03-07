import { UPSCarrierService } from "./carriers/ups/rates";
import { RateRequest } from "./interfaces/shipping";

// Create our UPS service
const ups = new UPSCarrierService();

// Example request — like a Shopify store asking for rates
const exampleRequest: RateRequest = {
  origin: {
    name: "Cybership Warehouse",
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

// Call our service
async function main() {
  try {
    console.log("Fetching UPS rates...");
    const result = await ups.getRates(exampleRequest);
    console.log("Rates received:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

main();
