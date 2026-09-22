export type BrowserCoordinates = [longitude: number, latitude: number];

export function getBrowserLocation(): Promise<BrowserCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location access is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve([coords.longitude, coords.latitude]),
      (error) => {
        const message = error.code === 1
          ? "Location permission was denied. Allow location access or enter coordinates instead."
          : "Your current location could not be determined. Enter coordinates instead.";
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  });
}
