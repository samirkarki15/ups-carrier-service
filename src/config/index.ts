import dotenv from "dotenv";
dotenv.config();

// This loads all environment variables in one place
export const config = {
  ups: {
    clientId: process.env.UPS_CLIENT_ID || "",
    clientSecret: process.env.UPS_CLIENT_SECRET || "",
    baseUrl: process.env.UPS_BASE_URL || "https://onlinetools.ups.com",
  },
};
