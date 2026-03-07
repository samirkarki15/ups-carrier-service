import axios from "axios";
import { clearUPSTokenCache, getUPSToken } from "../src/carriers/ups/auth";

// Tell Jest to fake axios
// So we never make real HTTP calls in tests
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// This resets everything between tests
// So one test doesn't affect another
beforeEach(() => {
  jest.clearAllMocks();
  clearUPSTokenCache();
});

describe("UPS Authentication", () => {
  // TEST 1 — Does it fetch a token successfully?
  it("should fetch and return a new token", async () => {
    // Fake UPS response — pretend UPS said this
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "fake_token_123",
        expires_in: 3600, // 1 hour
      },
    });

    const token = await getUPSToken();

    // Did we get the right token back?
    expect(token).toBe("fake_token_123");

    // Did we call UPS exactly once?
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  // TEST 2 — Does it reuse cached token?
  it("should reuse cached token without calling UPS again", async () => {
    // Fake UPS response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "cached_token_456",
        expires_in: 3600,
      },
    });

    // Call twice
    const token1 = await getUPSToken();
    const token2 = await getUPSToken();

    // Both should return same token
    expect(token1).toBe("cached_token_456");
    expect(token2).toBe("cached_token_456");

    // UPS should only have been called ONCE
    // Second call used the cache!
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  // TEST 3 — Does it handle auth failure?
  it("should throw meaningful error when auth fails", async () => {
    // Fake UPS rejecting our credentials
    mockedAxios.post.mockRejectedValueOnce(
      new Error("Request failed with status 401"),
    );

    // Expect our function to throw a clear error
    await expect(getUPSToken()).rejects.toThrow("UPS Authentication failed");
  });
});
