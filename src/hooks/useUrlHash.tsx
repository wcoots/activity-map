"use client";

export function useUrlHash() {
  function extractHashParameters() {
    const hashParameters: {
      hashLatitude: number | null;
      hashLongitude: number | null;
      hashZoom: number | null;
    } = { hashLatitude: null, hashLongitude: null, hashZoom: null };

    if (typeof window === "undefined") return hashParameters;

    const regex =
      /^#(\-?\d+(?:\.\d+)?)\/(\-?\d+(?:\.\d+)?)\/(\-?\d+(?:\.\d+)?)$/;
    const result = regex.exec(window.location.hash);

    if (result) {
      const [, latitude, longitude, zoom] = result;
      hashParameters.hashLatitude = parseFloat(latitude);
      hashParameters.hashLongitude = parseFloat(longitude);
      hashParameters.hashZoom = parseFloat(zoom);
    }

    return hashParameters;
  }

  function updateUrlHash(
    latitude: number,
    longitude: number,
    zoom: number
  ): void {
    if (typeof window === "undefined") return;

    const hashLatitude = latitude.toFixed(4);
    const hashLongitude = longitude.toFixed(4);
    const hashZoom = zoom.toFixed(2);
    window.location.hash = `#${hashLatitude}/${hashLongitude}/${hashZoom}`;
  }

  return { extractHashParameters, updateUrlHash };
}
