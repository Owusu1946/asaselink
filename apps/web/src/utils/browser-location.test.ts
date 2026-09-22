import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserLocation } from "./browser-location";

describe("getBrowserLocation", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns longitude and latitude in map coordinate order", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (success: PositionCallback) => success({ coords: { longitude: -0.205, latitude: 5.61 } } as GeolocationPosition),
      },
    });

    await expect(getBrowserLocation()).resolves.toEqual([-0.205, 5.61]);
  });

  it("explains a denied permission and preserves the coordinate fallback", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1 } as GeolocationPositionError),
      },
    });

    await expect(getBrowserLocation()).rejects.toThrow("Location permission was denied");
  });
});
