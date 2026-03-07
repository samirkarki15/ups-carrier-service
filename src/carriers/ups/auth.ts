import axios from "axios";
import { config } from "../../config";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export function clearUPSTokenCache(): void {
  tokenCache = null;
}

export async function getUPSToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log("Reusing existing UPS token");
    return tokenCache.accessToken;
  }

  console.log("Requesting new UPS token");

  try {
    const response = await axios.post(
      `${config.ups.baseUrl}/security/v1/oauth/token`,
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: config.ups.clientId,
          password: config.ups.clientSecret,
        },
      },
    );

    tokenCache = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000 - 60000, // Refresh 1 minute before expiry
    };

    return tokenCache.accessToken;
  } catch (error: any) {
    throw new Error(
      `UPS Authentication failed: ${error.response?.data || error.message}`,
    );
  }
}
